process.title = 'Template';

var http    = require('http');
var repl    = require('repl');
var fs      = require('fs');
var express = require('express');
var ws      = require('ws');
var stdio   = require('stdio');
var iz      = require('iz');

/////////////////
// Get options //
/////////////////

var optionsAllowed = {
  'ip'    : {key: 'i', args: 1, description: 'IP address for both HTTP and WS servers. Defaults to OpenShift if available, or if not then 0.0.0.0'},
  'port'  : {key: 'p', args: 1, description: 'TCP port for both HTTP and WS servers. Defaults to OpenShift if available, or if not then 8080'},
  'light' : {key: 'l', args: 1, description: 'Light\'s WebSocket server. [IP]:[TCP Port]'},
  'config': {key: 'c', args: 1, description: 'Load settings from configurations file. Defaults to ./config.json'},
  'state' : {key: 't', args: 1, description: 'Save LED state in this file. Automatically restores at start'},
  'silent': {key: 's', args: 0, description: 'Silence stdout'},
};

var optionsCLI = stdio.getopt(optionsAllowed);

var optionsFile = {};

try {
  var optionsFile = JSON.parse(fs.readFileSync(optionsCLI.config || 'config.json'));
}
catch(error) {
  console.error('Warning: Unable to read config file "' + (optionsCLI.config || 'config.json') + '". (' + error + ')');
}

// Condense options sources into one options object, applying priority
var options = {};

for(var i in optionsAllowed) {
  options[i] = optionsCLI[i] || optionsFile[i];
}

if(!iz(options.ip).required().ip().valid) {
  if(iz(process.env[options.ip]).required().ip().valid) {
    options.ip = process.env[options.ip];
  }
  else {
    console.error('Error: IP must be a valid IP address or local url. Run with -i 0.0.0.0 to use all available IPs');
    process.exit(1);
  }
}

if(!iz(options.port).required().int().between(1, 65535).valid) {
  if(iz(process.env[options.port]).required().int().between(1, 65535).valid) {
    options.port = process.env[options.port];
  }
  else {
    console.error('Error: TCP port must be an integer between 1 and 65535. Run with -p 8080 to listen on port 8080');
    process.exit(1);
  }
}

if(iz(options.port).int().between(1, 1024).valid) {
  console.warn('Warning: TCP ports between 1 and 1024 may require root permission');
}

if(!iz(options.light).required().valid) {
  console.error('Error: Light address required (format: [IP]:[TCP Port]');
  process.exit(1);
}

// Logger - Prints to stdout with timestamp, unless silenced by option. Add log file support?
var log = options.silent ? function(){} : function(message){console.log(new Date().toUTCString() + ': ' + message)};

// State is for: 1) Restoring state after reboot and 2) Keeping clients in sync
var state = {}; // Stores current state
state.leds = [
  Buffer('0000000000000000FF0F', 'hex'),
  Buffer('0100000000000000FF0F', 'hex'),
  Buffer('0200000000000000FF0F', 'hex'),
  Buffer('0300000000000000FF0F', 'hex'),
  Buffer('0400000000000000FF0F', 'hex')
];

if(options.state) {
  try {
    var storedState = fs.readFileSync(options.state);
    
    for(var i = 0, endi = Math.floor(storedState.length/10); i < endi; ++i) {
      var target = storedState.readUInt16LE(10*i);
      
      if(state.leds[target]) {
        state.leds[target] = storedState.slice(10*i, 10*i + 10);
      }
    }
  }
  catch(error) {
    console.error('Warning: Unable to read state file "' + options.state + '". (' + error + ')');
  }
}

var stateToSend = {};
stateToSend.leds = [false, false, false, false, false];
var stateToStore = false;

setInterval(function() {
  var clients = wsServer.clients;
  
  for(var i = 0, endi = stateToSend.leds.length; i < endi; ++i) {
    if(stateToSend.leds[i]) {
      stateToSend.leds[i] = false;
      stateToStore = true;
      
      for(var j = 0, endj = clients.length; j < endj; ++j) {
        clients[j].send(state.leds[i]);
      }
    }
  }
}, 100);

setInterval(function() {
  fs.writeFileSync('led_state.bin', Buffer.concat(state.leds));
  
  stateToStore = false;
}, 10000);

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

wsServer.on('connection', function(connection) {
  log('Received incoming WebSocket');
  
  for(var i = 0, endi = state.leds.length; i < endi; ++i) {
    connection.send(state.leds[i]);
  }
  
  connection.on('message', function(data) {
    if(data instanceof Buffer && data.length >= 10) {
      var target = data.readUInt16LE(0);
      
      if(state.leds[target]) {
        state.leds[target] = data.slice();
        stateToSend.leds[target] = true;
        
        if(wsRPi.readyState === wsRPi.OPEN) {
          wsRPi.send(data);
        }
        else {
          log('Error: WebSocket to RPi is not open');
        }
      }
    }
  });
  
  connection.on('close', function() {
    log('Closed incoming WebSocket');
  });
});

///////////////
// WS to RPi //
///////////////

var wsRPi;

function connectToRPi() {
  try {
    wsRPi = new ws('ws://' + options.light + '/websocket');
  }
  catch(e) {
    console.error('Error: Cannot connect to light at address' + options.light);
    process.exit(1);
  }
  
  wsRPi.on('open', function(connection) {
    log('Opened WebSocket to RPi');
    
    for(var i = 0, endi = state.leds.length; i < endi; ++i) {
      wsRPi.send(state.leds[i]);
    }
  });
  
  wsRPi.on('error', function(e) {
    log('Error opening WebSocket to RPi: ' + e);
    log('Attempting to reconnect in 10s...');
    setTimeout(connectToRPi, 10000);
  });
  
  wsRPi.on('close', function() {
    log('Closed WebSocket to RPi. Attempting to reconnect in 10s...');
    setTimeout(connectToRPi, 10000);
  });
}

connectToRPi();

/////////
// CLI //
/////////

if(!options.silent) {
  var cli = repl.start({});
  cli.context.http           = http;
  cli.context.repl           = repl;
  cli.context.fs             = fs;
  cli.context.express        = express;
  cli.context.ws             = ws;
  cli.context.stdio          = stdio;
  cli.context.iz             = iz;
  cli.context.optionsCLI     = optionsCLI;
  cli.context.optionsFile    = optionsFile;
  cli.context.options        = options;
  cli.context.app            = app;
  cli.context.httpServer     = httpServer;
  cli.context.wsServer       = wsServer;
  cli.context.wsRPi          = wsRPi;
  cli.context.state          = state;
  cli.context.stateToSend    = stateToSend;
}
