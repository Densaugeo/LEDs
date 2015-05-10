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
    
    self.emit('Set_RGB_LED', new Packets.Set_RGB_LED({name: self.name, r: self.r.value/4095, g: self.g.value/4095, b: self.b.value/4095, a: self.a.value/4095}));
  });
  
  this.open();
}
ComponentPanels.RGB_LED.prototype = Object.create(PanelUI.Panel.prototype);
ComponentPanels.RGB_LED.prototype.constructor = ComponentPanels.RGB_LED;

if(typeof module != 'undefined' && module != null && module.exports) {
  module.exports = ComponentPanels;
}
