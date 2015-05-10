# ComponentPanels.js

UI panels for the component supported by hosts for [project needs name]

Dependencies: `PanelUI.js` 

---

## ComponentPanels.RGB_LED

Inherits: `PanelUI.Panel`

UI panel for RB LEDs...just like it sounds

```
var led = new ComponentPanels.RGB_LED({id: 'led1', heading: 'A light', name: 'Same name as on host'});
```

#### Options

`String` **name** -- Set .name

#### Properties

`Boolean` **enabled** -- Specifies whether related Component on host should be enabled. Overwrites color of heading

`String` **name** -- Name of associated component on the host

`[HTMLElement]` **sliders** -- div to hold all the sliders

`Boolean` **sliding** -- Stays true for 1000ms after sliders are slid

#### Methods

`undefined` proto **emitSet_RGB_LED**`()` -- Emits a Set_RGB_LED packet with all relevant values

