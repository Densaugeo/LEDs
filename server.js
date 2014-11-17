process.title = 'Template';

var http    = require('http');
var repl    = require('repl');
var fs      = require('fs');
var express = require('express');
var ws      = require('ws');
var stdio   = require('stdio');
var iz      = require('iz');
var i2c;

/////////////////
// Get options //
/////////////////

var optionsAllowed = {
  'ip'    : {key: 'i', args: 1, description: 'IP address for both HTTP and WS servers. Defaults to OpenShift if available, or if not then 0.0.0.0'},
  'port'  : {key: 'p', args: 1, description: 'TCP port for both HTTP and WS servers. Defaults to OpenShift if available, or if not then 8080'},
  'remote': {key: 'r', args: 1, description: 'Remote light\'s WebSocket server. [IP]:[TCP Port]'},
  'local' : {key: 'l', args: 1, description: 'Control a light locally at the specified i2c address'},
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

if(!iz(options.remote).valid) {
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
        
        if(options.remote && wsRPi.readyState === wsRPi.OPEN) {
          wsRPi.send(data);
        }
        
        if(options.local && localControl.ready) {
          localControl.setLED(data);
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
    wsRPi = new ws('ws://' + options.remote + '/websocket');
  }
  catch(e) {
    console.error('Error: Cannot connect to remote light at address' + options.remote);
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

if(options.remote) {
  connectToRPi();
}

///////////////////////
// Local i2c control //
///////////////////////

var registers = {
  MODE1     : 0x00,
  MODE2     : 0x01,
  LED0_ON_L : 0x06,
  LED0_ON_H : 0x07,
  LED0_OFF_L: 0x08,
  LED0_OFF_H: 0x09,
  ALL_ON_L  : 0xFA,
  ALL_ON_H  : 0xFB,
  ALL_OFF_L : 0xFC,
  ALL_OFF_H : 0xFD,
  PRESCALE  : 0xFE,
}

var modes = {
  ALLCALL: 0x01,
  OUTDRV : 0x04,
  RESTART: 0x80,
  SLEEP  : 0x10,
}

var localControl = {ready: false};
var wire;

if(options.local) {
  try {
    log('Starting up i2c...');
    
    i2c = require('i2c');
    wire = new i2c(options.local, {device: '/dev/i2c-1'});
    
    wire.writeBytes(registers.ALL_ON_L , [0x00]);
    wire.writeBytes(registers.ALL_ON_H , [0x00]);
    wire.writeBytes(registers.ALL_OFF_L, [0x00]);
    wire.writeBytes(registers.ALL_OFF_H, [0x00]);
    wire.writeBytes(registers.MODE1, [modes.ALLCALL]);
    wire.writeBytes(registers.MODE2, [modes.OUTDRV]);
    
    // Delay 5 ms for for i2c chip stuff
    setTimeout(function() {
      var prescale = Math.floor(2.5e+7/4096/1000 - 0.5); // Controller frequence / 12 bits / duty cycle frequency...
      
      wire.writeBytes(registers.MODE1, [0x11]); // Sleep + all call mode, maybe?
      
      // Delay 5 ms for for i2c chip stuff
      setTimeout(function() {
        wire.writeBytes(registers.PRESCALE, [prescale]);
        wire.writeBytes(registers.MODE1, [0x01]); // Back to all call
        
        // Delay 5 ms for for i2c chip stuff
        setTimeout(function() {
          wire.writeBytes(registers.MODE1, [0x81]); // No idea what this is for
          
          localControl.setPin = function(pin, duty) {
            wire.writeBytes(registers.LED0_ON_L  + 4*pin, [0x00       ]);
            wire.writeBytes(registers.LED0_ON_H  + 4*pin, [0x00       ]);
            wire.writeBytes(registers.LED0_OFF_L + 4*pin, [duty & 0xFF]);
            wire.writeBytes(registers.LED0_OFF_H + 4*pin, [duty >> 8  ]);
          }
          
          // The internals of these buffers aren't actually touched anywhere else in the server, except for the target address
          localControl.setLED = function(data) {
            var target = data.readUInt16LE(0);
            var red    = data.readUInt16LE(2);
            var green  = data.readUInt16LE(4);
            var blue   = data.readUInt16LE(6);
            var alpha  = data.readUInt16LE(8);
            
            localControl.setPin(3*target    , red  *alpha/4095);
            localControl.setPin(3*target + 1, green*alpha/4095);
            localControl.setPin(3*target + 2, blue *alpha/4095);
          }
          
          // Initial values, generally from storage
          for(var i = 0, endi = state.leds.length; i < endi; ++i) {
            localControl.setLED(state.leds[i]);
          }
          
          localControl.ready = true;
          
          log('i2c pwm controller ready');
        }, 5);
      }, 5);
    }, 5);
  }
  catch(e) {
    log('Error setting up i2c: ' + e);
  }
}

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
  cli.context.i2c            = i2c;
  cli.context.optionsCLI     = optionsCLI;
  cli.context.optionsFile    = optionsFile;
  cli.context.options        = options;
  cli.context.app            = app;
  cli.context.httpServer     = httpServer;
  cli.context.wsServer       = wsServer;
  cli.context.wsRPi          = wsRPi;
  cli.context.state          = state;
  cli.context.stateToSend    = stateToSend;
  cli.context.registers      = registers;
  cli.context.modes          = modes;
  cli.context.localControl   = localControl;
  cli.context.wire           = wire;
}
