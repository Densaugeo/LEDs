# Components.js

Electrical components supported by this yet-to-be-named robotics project

Dependencies: None

---

## Components.RGB_LED

Inherits: None

RGB LED...

```
var led = new Components.RGB_LED({name: 'An RGB LED', controllerIndex: 0, pins: [0, 1, 2]});
var led.set(new Packets.Set_RGB_LED({port: 'set', name: 'An RGB LED', r: 1, g: 0.5, b: 0.25, a: 1}));

led.pins.forEach(function(v, i, a) {
  some_controller.setPin(v, led.pinDuties[i]);
});
```

#### Options

`Number` **controllerIndex** -- Set .controllerIndex

`String` **name** -- Set .name

`[Number]` **pins** -- Set .pins

#### Properties

`Number` **a** -- Alpha channel, used for overall dimmer

`Number` **b** -- Blue color channel

`Number` **controllerIndex** -- Index of Controller, used by host to keep track of Components

`Boolean` **enabled** -- Exactly what it sounds like

`Number` **g** -- Green color channel

`String` **name** -- Name of this RGB_LED to set

`[Number]` **pinDuties** -- Duty cycle values to be sent to Controller

`[Number]` **pins** -- Controller pins used by this Component

`Number` **r** -- Red color channel

#### Methods

`undefined` proto **set**`(Packets.Set_RGB_LED packet)` -- Update this Component's rgba values and pin duty cycles

