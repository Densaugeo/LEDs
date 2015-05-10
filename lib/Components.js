/**
 * @description Electrical components supported by this yet-to-be-named robotics project
 */
var Components = {};

/**
 * @module Components.RGB_LED
 * @description RGB LED...
 * 
 * @example var led = new Components.RGB_LED({name: 'An RGB LED', controllerIndex: 0, pins: [0, 1, 2]});
 * @example var led.set(new Packets.Set_RGB_LED({port: 'set', name: 'An RGB LED', r: 1, g: 0.5, b: 0.25, a: 1}));
 * @example
 * @example led.pins.forEach(function(v, i, a) {
 * @example   some_controller.setPin(v, led.pinDuties[i]);
 * @example });
 */
Components.RGB_LED = function RGB_LED(options) {
  // @prop String name -- Name of this RGB_LED to set
  // @option String name -- Set .name
  this.name = String(options.name);
  
  // @prop Number controllerIndex -- Index of Controller, used by host to keep track of Components
  // @option Number controllerIndex -- Set .controllerIndex
  this.controllerIndex = Number(options.controllerIndex);
  
  // @prop [Number] pins -- Controller pins used by this Component
  // @option [Number] pins -- Set .pins
  this.pins = options.pins.slice();
  
  // @prop [Number] pinDuties -- Duty cycle values to be sent to Controller
  this.pinDuties = [0, 0, 0];
  
  // @prop Number r -- Red color channel
  this.r = 0;
  
  // @prop Number g -- Green color channel
  this.g = 0;
  
  // @prop Number b -- Blue color channel
  this.b = 0;
  
  // @prop Number a -- Alpha channel, used for overall dimmer
  this.a = 0;
  
  // @prop Boolean enabled -- Exactly what it sounds like
  this.enabled = true;
}

// @method proto undefined set(Packets.Set_RGB_LED packet) -- Update this Component's rgba values and pin duty cycles
Components.RGB_LED.prototype.set = function set(packet) {
  this.enabled = packet.enabled;
  this.r = packet.r;
  this.g = packet.g;
  this.b = packet.b;
  this.a = packet.a;
  
  if(this.enabled) {
    this.pinDuties = [this.r*this.a*4095, this.g*this.a*4095, this.b*this.a*4095];
  } else {
    this.pinDuties = [0, 0, 0];
  }
}

if(typeof module != 'undefined' && module != null && module.exports) {
  module.exports = Components;
}
