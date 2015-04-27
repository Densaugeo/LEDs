/**
 * @description Provides DF.Node, an asynchronous non-recursive EventEmitter replacement
 */
var DF = {};

// @prop [DF.Packet] queue -- Queue of packets
DF.queue = [];

// @prop Array pipes -- Records connections as: [{port: [listeners], anotherPort: [listeners]}, ...]
DF.pipes = [];

// @method undefined pipe(DF.Node source, String sourcePort, DF.Node destination, String destinationPort) -- Connects DF Nodes. The destination's port function is called and given data from the source's port
DF.pipe = function(source, sourcePort, destination, destinationPort) {
  if(DF.pipes[source.id][sourcePort] == null) {
    DF.pipes[source.id][sourcePort] = [];
  }
  
  DF.pipes[source.id][sourcePort].push({node: destination, port: destinationPort});
}

// @method undefined process(DF.Packet packet) -- Process an event
DF.process = function(packet) {
  var listeners = DF.pipes[packet.sourceID][packet.port];
  
  if(listeners != null) {
    listeners.forEach(function(v, i, a) {
      v.node[v.port](packet.data);
    });
  }
}

// @method undefined update() -- Immediately processes event queue
DF.update = function() {
  var packet;
  
  while(packet = DF.queue.shift()) {
    DF.process(packet);
  }
}

// @prop Number period -- Time in ms between automatic graph updates
DF.period = 10;

// @method undefined loop() -- Basic update loop
DF.loop = function() {
  DF.update();
  
  setTimeout(DF.loop, DF.period);
}
setTimeout(DF.loop, DF.period);

/**
 * @module DF.Packet
 * @description A packet for a DF network
 */
DF.Packet = function(sourceID, port, data) {
  // @prop Number sourceID -- Numeric id of DF source node
  this.sourceID = sourceID;
  
  // @prop String port -- Source port's name
  this.port = port;
  
  // @prop * data -- Arbitrary packet data
  this.data = data;
}

/**
 * @module DF.Node
 * @description DF nodes are similar to EventEmitters
 * 
 * @example var node1 = new DF.Node();
 * @example var node2 = new DF.Node();
 * @example 
 * @example node2.onFoo = function(arg) {
 * @example   console.log(arg);
 * @example });
 * @example DF.pipe(node1, 'foo', node2, 'onFoo');
 * @example 
 * @example node.emit('foo', 'bar');
 */
DF.Node = function(options) {
  // @prop Number id -- Sequential integer ID for DF nodes
  this.id = DF.pipes.push({}) - 1;
}

// @method proto DF.Node on(String port, Function listener) -- Adds a listener. Surprise.
DF.Node.prototype.on = function(port, listener) {
  this['on' + port] = listener;
  
  DF.pipe(this, port, this, 'on' + port);
  
  return this;
}

// @method proto DF.Node addListener(String port, Function listener) -- Alias for on
DF.Node.prototype.addListener = DF.Node.prototype.on;

// @method proto DF.Node addEventListener(String port, Function listener) -- Alias for on
DF.Node.prototype.addEventListener = DF.Node.prototype.on;

// @method proto undefined emit(String port, * data) -- Emit a packet. Passes 'data' argument on to listeners
DF.Node.prototype.emit = function(port, data) {
  DF.queue.push(new DF.Packet(this.id, port, data));
}

// @method proto undefined emitSync(String port, * data) -- Synchronous version of .emit(). This method uses recursion, so avoid unbounded loops
DF.Node.prototype.emitSync = function(port, data) {
  this.emit(port, data);
  
  DF.update();
}

if(typeof module != 'undefined' && module != null && module.exports) {
  module.exports = DF;
}
