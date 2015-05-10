# Controllers.js

I²C controllers supported by this yet-to-be-named robotics project

Dependencies: `i2c` 

---

## Controllers.PCA9685

Inherits: None

Provides an interface for the PCA9685  I²C-based pwm controller from NXP

```
var controller = new Controllers.PCA9685({bus: '/dev/i2c-0', address: 0x40});
controller.setPin(0,    0); // Set pin 0 all the way off
controller.setPin(1, 2048); // Set pin 1 half way on
controller.setPin(2, 4095); // Set pin 2 all the way on
```

#### Options

`Number` **address** -- Set .address property

`String` **bus** -- Set .bus property

#### Properties

`Number` **address** -- I²C address of PCA9685 (read only)

`String` **bus** -- I²C bus to which PCA9685 is attached, usually a /dev device (read only)

`i2c` **wire** -- Interface to I²C channel, provided by  I²C library

#### Methods

`undefined` **setPin**`(Number pin, Number duty)` -- 'duty' is 12-bit pwm duty cycle from (scales from 0 = full off to 4095 = full on)

