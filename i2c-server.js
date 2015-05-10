process.title = 'i2c-server';

var repl        = require('repl');
var fs          = require('fs');
var http        = require('http');
var ws          = require('ws');

var Controllers = require('./lib/Controllers.js');
var Components  = require('./lib/Components.js');
var Packets     = require('./lib/Packets.js');

var options;

try {
  options = JSON.parse(fs.readFileSync('i2c-config.json'));
} catch(e) {
  console.log('Error: Unable to read config file "i2c-config.json". (' + e + ')');
  process.exit(1);
}

// Logger - Prints to stdout with timestamp, unless silenced by option. Add log file support?
var log = options.silent ? function(){} : function(message){console.log(new Date().toUTCString() + ': ' + message)};

var i2cControllers = [];

options.i2c_controllers.forEach(function(v, i, a) {
  i2cControllers[i] = new Controllers[v.type](v);
});

var attachedComponents = {};

options.attached_components.forEach(function(v, i, a) {
  // Translate from config file naming convention to JS naming
  v.controllerIndex = v.controller_index;
  
  attachedComponents[v.name] = new Components[v.type](v);
});

/////////////////////////
// Restore saved state //
/////////////////////////

var savedState;

try {
  savedState = JSON.parse(fs.readFileSync('i2c-components-state.json'));
} catch(e) {
  log('Error: Unable to read save state file "i2c-components-state.json". (' + e + ')');
  process.exit(1);
}

savedState.forEach(function(v, i, a) {
  var component = attachedComponents[v.name];
  var controller = i2cControllers[component.controllerIndex];
  
  // Restore saved state to Component abstraction
  component.set(v);
  
  // Restore saved state to Controller too
  component.pins.forEach(function(v, i, a) {
    controller.setPin(v, component.pinDuties[i]);
  });
});

/////////////////
// HTTP server //
/////////////////

var httpServer = http.createServer(function(request, response) {
  response.writeHead(400);
  response.write('Error 400: This server is only for websockets. Maybe if I am feeling thorough I will put a usage page here.');
  response.end();
});
httpServer.listen(options.port, options.ip);

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
        // Tell the client about all the attachedComponents
        var packet = new Packets.List();
        
        for(var i in attachedComponents) {
          packet.addComponent(attachedComponents[i]);
        }
        
        connection.send(JSON.stringify(packet));
        break;
      case 'req_update':
        // Tell the client all of the current statuses
        var packet = new Packets.Update();
        
        for(var i in attachedComponents) {
          packet.addSubpacket(new Packets.Set_RGB_LED(attachedComponents[i]));
        }
        
        connection.send(JSON.stringify(packet));
        
        break;
      case 'set_RGB_LED':
        var screenedPacket = new Packets.Set_RGB_LED(packet);
        
        // Set a component
        attachedComponents[screenedPacket.name].set(screenedPacket);
        
        i2cUpdater.notify(screenedPacket);
        wsUpdater.notify(screenedPacket);
        fileUpdater.notify(screenedPacket);
        
        break;
    }
  });
  
  connection.on('close', function() {
    log('Closed incoming WebSocket');
  });
});

///////////////////////////////////////////////////////////////////////
// Keep i2c controllers, WS clients, and saved state file up to date //
///////////////////////////////////////////////////////////////////////

var i2cUpdater = new function() {
  var componentsToUpdate = {};
  
  this.notify = function(packet) {
    componentsToUpdate[packet.name] = true;
  }
  
  setInterval(function() {
    for(var i in componentsToUpdate) {
      var component = attachedComponents[i];
      var controller = i2cControllers[component.controllerIndex];
      
      component.pins.forEach(function(v, i, a) {
        controller.setPin(v, component.pinDuties[i]);
      });
    }
    
    componentsToUpdate = {};
  }, options.i2c_update_interval);
}

var wsUpdater = new function() {
  var componentsToUpdate = {};
  
  this.notify = function(packet) {
    componentsToUpdate[packet.name] = true;
  }
  
  setInterval(function() {
    var packet = new Packets.Update();
    
    for(var i in componentsToUpdate) {
      packet.addSubpacket(new Packets.Set_RGB_LED(attachedComponents[i]));
    }
    
    if(packet.subpackets.length > 0) {
      var text = JSON.stringify(packet);
      
      wsServer.clients.forEach(function(v, i, a) {
        v.send(text);
      });
    }
    
    componentsToUpdate = {};
  }, options.ws_update_interval);
}

var fileUpdater = new function() {
  var changed = false;
  
  this.notify = function() {
    changed = true;
  }
  
  setInterval(function() {
    if(changed) {
      // Update the file
      var state = [];
      
      for(var i in attachedComponents) {
        state.push(new Packets.Set_RGB_LED(attachedComponents[i]));
      }
      
      fs.writeFile('i2c-components-state.json', JSON.stringify(state), function(err) {
        if(err) {
          log('Error saving state file: ' + err);
        }
      });
    }
    
    changed = false;
  }, options.file_update_interval);
}

/////////
// CLI //
/////////

if(options.repl) {
  var cli = repl.start({});
  cli.context.repl               = repl;
  cli.context.fs                 = fs;
  cli.context.http               = http;
  cli.context.ws                 = ws;
  
  cli.context.Controllers        = Controllers;
  cli.context.Components         = Components;
  cli.context.Packets            = Packets;
  
  cli.context.options            = options;
  cli.context.log                = log;
  cli.context.i2cControllers     = i2cControllers;
  cli.context.attachedComponents = attachedComponents;
  cli.context.savedState         = savedState;
  cli.context.httpServer         = httpServer;
  cli.context.wsServer           = wsServer;
  cli.context.i2cUpdater         = i2cUpdater;
  cli.context.wsUpdater          = wsUpdater;
  cli.context.fileUpdater        = fileUpdater;
}
