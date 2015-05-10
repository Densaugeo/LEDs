/**
 * @description I²C controllers supported by this yet-to-be-named robotics project
 * 
 * @depends i2c
 */
var i2c = require('i2c');

var Controllers = {};

var blankFunction = function(){};

/**
 * @module Controllers.PCA9685
 * @description Provides an interface for the PCA9685  I²C-based pwm controller from NXP
 * 
 * @example var controller = new Controllers.PCA9685({bus: '/dev/i2c-0', address: 0x40});
 * @example controller.setPin(0,    0); // Set pin 0 all the way off
 * @example controller.setPin(1, 2048); // Set pin 1 half way on
 * @example controller.setPin(2, 4095); // Set pin 2 all the way on
 */
Controllers.PCA9685 = function PCA9685(options) {
  var self = this;
  
  // @method undefined setPin(Number pin, Number duty) -- 'duty' is 12-bit pwm duty cycle from (scales from 0 = full off to 4095 = full on)
  this.setPin = function(pin, duty) {
    this.wire.writeBytes(Controllers.PCA9685.LED0_ON_L  + 4*pin, [0x00       ], blankFunction);
    this.wire.writeBytes(Controllers.PCA9685.LED0_ON_H  + 4*pin, [0x00       ], blankFunction);
    this.wire.writeBytes(Controllers.PCA9685.LED0_OFF_L + 4*pin, [duty & 0xFF], blankFunction);
    this.wire.writeBytes(Controllers.PCA9685.LED0_OFF_H + 4*pin, [duty >> 8  ], blankFunction);
  }
  
  // @prop String bus -- I²C bus to which PCA9685 is attached, usually a /dev device (read only)
  // @option String bus -- Set .bus property
  Object.defineProperty(this, 'bus', {value: options.bus + '', enumberable: true});
  
  // @prop Number address -- I²C address of PCA9685 (read only)
  // @option Number address -- Set .address property
  Object.defineProperty(this, 'address', {value: Number(options.address), enumberable: true});
  
  // @prop i2c wire -- Interface to I²C channel, provided by  I²C library
  this.wire = new i2c(this.address, {device: this.bus});
  
  this.wire.writeBytes(Controllers.PCA9685.ALL_ON_L , [0x00], blankFunction);
  this.wire.writeBytes(Controllers.PCA9685.ALL_ON_H , [0x00], blankFunction);
  this.wire.writeBytes(Controllers.PCA9685.ALL_OFF_L, [0x00], blankFunction);
  this.wire.writeBytes(Controllers.PCA9685.ALL_OFF_H, [0x00], blankFunction);
  this.wire.writeBytes(Controllers.PCA9685.MODE1, [Controllers.PCA9685.ALLCALL], blankFunction);
  this.wire.writeBytes(Controllers.PCA9685.MODE2, [Controllers.PCA9685.OUTDRV], blankFunction);
  
  // Delay 5 ms for for I²C chip stuff
  setTimeout(function() {
    var prescale = Math.floor(2.5e+7/4096/1000 - 0.5); // Controller frequence / 12 bits / duty cycle frequency...
    
    self.wire.writeBytes(Controllers.PCA9685.MODE1, [0x11], blankFunction); // Sleep + all call mode, maybe?
    
    // Delay 5 ms for for I²C chip stuff
    setTimeout(function() {
      self.wire.writeBytes(Controllers.PCA9685.PRESCALE, [prescale], blankFunction);
      self.wire.writeBytes(Controllers.PCA9685.MODE1, [0x01], blankFunction); // Back to all call
      
      // Delay 5 ms for for I²C chip stuff
      setTimeout(function() {
        self.wire.writeBytes(Controllers.PCA9685.MODE1, [0x81], blankFunction); // No idea what this is for
      }, 5);
    }, 5);
  }, 5);
}
Controllers.PCA9685.MODE1      = 0x00;
Controllers.PCA9685.MODE2      = 0x01;
Controllers.PCA9685.LED0_ON_L  = 0x06;
Controllers.PCA9685.LED0_ON_H  = 0x07;
Controllers.PCA9685.LED0_OFF_L = 0x08;
Controllers.PCA9685.LED0_OFF_H = 0x09;
Controllers.PCA9685.ALL_ON_L   = 0xFA;
Controllers.PCA9685.ALL_ON_H   = 0xFB;
Controllers.PCA9685.ALL_OFF_L  = 0xFC;
Controllers.PCA9685.ALL_OFF_H  = 0xFD;
Controllers.PCA9685.PRESCALE   = 0xFE;
Controllers.PCA9685.ALLCALL    = 0x01;
Controllers.PCA9685.OUTDRV     = 0x04;
Controllers.PCA9685.RESTART    = 0x80;
Controllers.PCA9685.SLEEP      = 0x10;

if(typeof module != 'undefined' && module != null && module.exports) {
  module.exports = Controllers;
}
