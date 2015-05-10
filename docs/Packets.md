# Packets.js

Packets used by this yet-to-be-named robotics project

Dependencies: None

---

## Packets.Set_RGB_LED

Inherits: None

Packet to set a new state on a Component.RGB_LED

```
var packet = new Packets.Set_RGB_LED(an_RGB_LED_instance);
var another_RGB_LED_instance.set(packet); // Now the two instances have the same settings

var manual_packet = new Packets.Set_RGB_LED({name: 'An RGB LED', r: 1, g: 0.5, b: 0.25, a: 1});

var sanitized_packet = new Packets.Set_RGB_LED(suspicious_packet);
```

#### Options

`Number` **a** -- Set .a

`Number` **b** -- Set .b

`Number` **g** -- Set .g

`String` **name** -- Set .name

`String` **port** -- Set .port

`Number` **r** -- Set .r

#### Properties

`Number` **a** -- Alpha channel, used for overall dimmer

`Number` **b** -- Blue color channel

`Number` **g** -- Green color channel

`String` **name** -- Name of RGB LED to set

`String` **port** -- Dataflow port for this type of packet (always 'set_RGB_LED')

`Number` **r** -- Red color channel

---

## Packets.List

Inherits: None

For listing Components on a host

```
var var packet = new Packets.List();
packet.addComponent(some_component);
```

#### Options

`[{String` **name,** String type}] components -- Set .components

`String` **port** -- Set .port

#### Properties

`[{String` **name,** String type}] components -- List of Components, with name and type (by constructor name)

`String` **port** -- Dataflow port for this type of packet (always 'list')

#### Methods

`Packets.List` proto **addComponent**`(Component component)` -- Add a component description to a List

---

## Packets.Update

Inherits: None

For sending a set of Component state updates

```
var packet = new Packets.Update();
packet.addComponent(someComponent);
packet.addSubpacket(new Packets.Set_RGB_LED(LED_that_needs_update));
```

#### Options

`String` **port** -- Set .port

`[Packets.Set_RGB_LED]` **subpackets** -- Set .subpackets

#### Properties

`String` **port** -- Dataflow port for this type of packet (always 'update')

`[Packets.Set_RGB_LED]` **subpackets** -- List of subpackets, with each subpacket representing an update for one Component

#### Methods

`Packets.Update` proto **addSubpacket**`(Packets.Set_RGB_LED subpacket)` -- Add a subpacket to an Update

