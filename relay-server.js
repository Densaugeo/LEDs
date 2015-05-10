process.title = 'relay-server';

var repl    = require('repl');
var fs      = require('fs');
var http    = require('http');
var ws      = require('ws');
var express = require('express');

var Packets = require('./lib/Packets.js');

var options;

try {
  options = JSON.parse(fs.readFileSync('relay-config.json'));
} catch(e) {
  console.log('Error: Unable to read config file "relay-config.json". (' + e + ')');
  process.exit(1);
}

// Logger - Prints to stdout with timestamp, unless silenced by option. Add log file support?
var log = options.silent ? function(){} : function(message){console.log(new Date().toUTCString() + ': ' + message)};

// Aggregate list of components attached to all connected remote hosts
var componentList = new Packets.List;

// Contains references to host WebSocket connections, indexed by component name
var componentDirectory = {};

/////////////////
// HTTP server //
/////////////////

var app = express();
var httpServer = http.createServer(app);
httpServer.listen(options.port, options.ip);

// Simple static page server
app.use('/', express.static('./http'));
app.use(express.compress());
log('Static file server listening at http://' + options.ip + ':' + options.port + '/');

///////////////
// WS server //
///////////////

var wsServer = new ws.Server({server: httpServer, path: '/'});
log('WS server listening at ws://' + options.ip + ':' + options.port + '/');

wsServer.on('connection', function(connection) {
  log('Received incoming WebSocket');
  
  connection.on('message', function(data) {
    try {
      var packet = JSON.parse(data);
    } catch(e) {
      log('Bad JSON received on ws');
      return;
    }
    
    switch(packet.port) {
      case 'req_list':
        // Return aggregate list from cache
        connection.send(JSON.stringify(componentList));
        break;
      case 'req_update':
        // Pass request on to all connected hosts
        hostConnections.forEach(function(v, i, a) {
          v.send(JSON.stringify({port: 'req_update'}));
        });
        break;
      case 'set_RGB_LED':
        // Pass request to correct host
        var screenedPacket = new Packets.Set_RGB_LED(packet);
        
        if(componentDirectory[screenedPacket.name] != null) {
          componentDirectory[screenedPacket.name].send(JSON.stringify(screenedPacket));
        }
        break;
    }
  });
  
  connection.on('close', function() {
    log('Closed incoming WebSocket');
  });
});

/////////////////////
// WS to i2c hosts //
/////////////////////

var hostConnections = [];

options.remotes.forEach(function(v, i, a) {
  try {
    var connection = new ws('ws://' + v + '/');
  }
  catch(e) {
    log('Error: Cannot open WebSocket to remote host at ' + v);
    process.exit(1);
  }
  
  connection.on('open', function() {
    log('Opened WebSocket to remote host at ' + v);
    
    connection.send(JSON.stringify({port: 'req_list'}));
  });
    
  connection.on('message', function(data) {
    try {
      var packet = JSON.parse(data);
    } catch(e) {
      log('Bad JSON received on WebSocket to remote host at ' + v);
      return;
    }
    
    switch(packet.port) {
      case 'list':
        var screenedPacket = new Packets.List(packet);
        
        screenedPacket.components.forEach(function(v, i, a) {
          componentList.addComponent(v);
          
          componentDirectory[v.name] = connection;
        });
        break;
      case 'update':
        var screenedPacket = new Packets.Update(packet);
        var text = JSON.stringify(screenedPacket);
        
        wsServer.clients.forEach(function(v, i, a) {
          v.send(text);
        });
        break;
    }
  });
  
  connection.on('close', function() {
    log('Closed WebSocket to remote host at ' + v + '');
  });
  
  connection.on('error', function(e) {
    log('Error opening WebSocket to remote host at ' + v + ': ' + e);
  });
  
  hostConnections[i] = connection;
});

/////////
// CLI //
/////////

if(options.repl) {
  var cli = repl.start({});
  cli.context.repl               = repl;
  cli.context.fs                 = fs;
  cli.context.http               = http;
  cli.context.ws                 = ws;
  cli.context.express            = express;
  
  cli.context.Packets            = Packets;
  
  cli.context.options            = options;
  cli.context.log                = log;
  cli.context.componentList      = componentList;
  cli.context.componentDirectory = componentDirectory;
  cli.context.app                = app;
  cli.context.httpServer         = httpServer;
  cli.context.wsServer           = wsServer;
  cli.context.hostConnections    = hostConnections;
}
