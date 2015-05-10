/**
 * @description Packets used by this yet-to-be-named robotics project
 */
var Packets = {};

/**
 * @module Packets.Set_RGB_LED
 * @description Packet to set a new state on a Component.RGB_LED
 * 
 * @example var packet = new Packets.Set_RGB_LED(an_RGB_LED_instance);
 * @example var another_RGB_LED_instance.set(packet); // Now the two instances have the same settings
 * @example
 * @example var manual_packet = new Packets.Set_RGB_LED({name: 'An RGB LED', r: 1, g: 0.5, b: 0.25, a: 1});
 * @example
 * @example var sanitized_packet = new Packets.Set_RGB_LED(suspicious_packet);
 */
Packets.Set_RGB_LED = function Set_RGB_LED(options) {
  // @prop String port -- Dataflow port for this type of packet (always 'set_RGB_LED')
  this.port = 'set_RGB_LED';
  
  // @prop String name -- Name of RGB LED to set
  // @option String name -- Set .name
  this.name = String(options.name);
  
  // @prop Boolean enabled -- True to enable, false to disable
  // @option Boolean enabled -- Set .enabled
  this.enabled = Boolean(options.enabled);
  
  // @prop Number r -- Red color channel
  // @option Number r -- Set .r
  this.r = Number(options.r) || 0;
  
  // @prop Number g -- Green color channel
  // @option Number g -- Set .g
  this.g = Number(options.g) || 0;
  
  // @prop Number b -- Blue color channel
  // @option Number b -- Set .b
  this.b = Number(options.b) || 0;
  
  // @prop Number a -- Alpha channel, used for overall dimmer
  // @option Number a -- Set .a
  this.a = Number(options.a) || 0;
}

/**
 * @module Packets.List
 * @description For listing Components on a host
 * 
 * @example var var packet = new Packets.List();
 * @example packet.addComponent(some_component);
 */
Packets.List = function List(options) {
  var self = this;
  
  // @prop String port -- Dataflow port for this type of packet (always 'list')
  this.port = 'list';
  
  // @prop [{String name, String type}] components -- List of Components, with name and type (by constructor name)
  // @option [{String name, String type}] components -- Set .components
  this.components = [];
  
  if(options && options.components) {
    options.components.forEach(function(v, i, a) {
      self.addComponent(v);
    });
  }
}

// @method proto Packets.List addComponent(Component component) -- Add a component description to a List
Packets.List.prototype.addComponent = function addComponent(component) {
  this.components.push({name: String(component.name), type: component.type || String(component.constructor.name)});
  
  return this;
}

/**
 * @module Packets.Update
 * @description For sending a set of Component state updates
 * 
 * @example var packet = new Packets.Update();
 * 
 * @example packet.addComponent(someComponent);
 * @example packet.addSubpacket(new Packets.Set_RGB_LED(LED_that_needs_update));
 */
Packets.Update = function Update(options) {
  var self = this;
  
  // @prop String port -- Dataflow port for this type of packet (always 'update')
  this.port = 'update';
  
  // @prop [Packets.Set_RGB_LED] subpackets -- List of subpackets, with each subpacket representing an update for one Component
  // @option [Packets.Set_RGB_LED] subpackets -- Set .subpackets
  this.subpackets = [];
  
  if(options && options.subpackets) {
    options.subpackets.forEach(function(v, i, a) {
      self.addSubpacket(v);
    });
  }
}

// @method proto Packets.Update addSubpacket(Packets.Set_RGB_LED subpacket) -- Add a subpacket to an Update
Packets.Update.prototype.addSubpacket = function addSubpacket(subpacket) {
  this.subpackets.push(new Packets.Set_RGB_LED(subpacket));
  
  return this;
}

if(typeof module != 'undefined' && module != null && module.exports) {
  module.exports = Packets;
}
