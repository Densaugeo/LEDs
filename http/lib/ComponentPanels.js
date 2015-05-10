/**
 * @description UI panels for the component supported by hosts for [project needs name]
 * @depends PanelUI.js
 */
var ComponentPanels = {};

/**
 * @module ComponentPanels.RGB_LED inherits PanelUI.Panel
 * @description UI panel for RB LEDs...just like it sounds
 * 
 * @example var led = new ComponentPanels.RGB_LED({id: 'led1', heading: 'A light', name: 'Same name as on host'});
 */
ComponentPanels.RGB_LED = function(options) {
  PanelUI.Panel.call(this, options);
  
  var self = this;
  
  // @prop String name -- Name of associated component on the host
  // @option String name -- Set .name
  this.name = String(options.name);
  
  // @prop Boolean enabled -- Specifies whether related Component on host should be enabled. Overwrites color of heading
  var enabled = true;
  Object.defineProperty(this, 'enabled', {
    get: function() {
      return enabled;
    },
    set: function(v) {
      enabled = v;
      this.domElement.children[0].style.color = enabled ? '' : '#888';
    },
    enumerable: true,
  });
  
  // @prop [HTMLElement] sliders -- div to hold all the sliders
  this.sliders = fE('div', {className: 'led_sliders'}, [
    // In FF, sliders with fractional values get highlighted in ways that seem to ignore CSS, so can't use 0..1 range
    this.r = fE('input', {type: 'range', title: 'Red'  , min: 0, max: 4095, value: 0}),
    this.g = fE('input', {type: 'range', title: 'Green', min: 0, max: 4095, value: 0}),
    this.b = fE('input', {type: 'range', title: 'Blue' , min: 0, max: 4095, value: 0}),
    this.a = fE('input', {type: 'range', title: 'Alpha', min: 0, max: 4095, value: 0}),
  ]);
  
  // @prop Boolean sliding -- Stays true for 1000ms after sliders are slid
  this.sliding = false;
  
  var resetSliding = function() {
    self.sliding = false;
  }
  
  this.domElement.appendChild(this.sliders);
  
  this.sliders.addEventListener('input', function(e) {
    self.sliding = true;
    setTimeout(resetSliding, 1000);
    
    self.emitSet_RGB_LED();
  });
  
  this.open();
}
ComponentPanels.RGB_LED.prototype = Object.create(PanelUI.Panel.prototype);
ComponentPanels.RGB_LED.prototype.constructor = ComponentPanels.RGB_LED;

// @method proto undefined emitSet_RGB_LED() -- Emits a Set_RGB_LED packet with all relevant values
ComponentPanels.RGB_LED.prototype.emitSet_RGB_LED = function emitSet_RGB_LED() {
  this.emit('Set_RGB_LED', new Packets.Set_RGB_LED({name: this.name, enabled: this.enabled, r: this.r.value/4095, g: this.g.value/4095, b: this.b.value/4095, a: this.a.value/4095}));
}

if(typeof module != 'undefined' && module != null && module.exports) {
  module.exports = ComponentPanels;
}
