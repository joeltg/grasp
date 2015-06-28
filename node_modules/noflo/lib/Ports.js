(function() {
  var EventEmitter, InPort, InPorts, OutPort, OutPorts, Ports,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  InPort = require('./InPort');

  OutPort = require('./OutPort');

  Ports = (function(_super) {
    __extends(Ports, _super);

    Ports.prototype.model = InPort;

    function Ports(ports) {
      var name, options;
      this.ports = {};
      if (!ports) {
        return;
      }
      for (name in ports) {
        options = ports[name];
        this.add(name, options);
      }
    }

    Ports.prototype.add = function(name, options, process) {
      if (name === 'add' || name === 'remove') {
        throw new Error('Add and remove are restricted port names');
      }
      if (!name.match(/^[a-z0-9_\.\/]+$/)) {
        throw new Error("Port names can only contain lowercase alphanumeric characters and underscores. '" + name + "' not allowed");
      }
      if (this.ports[name]) {
        this.remove(name);
      }
      if (typeof options === 'object' && options.canAttach) {
        this.ports[name] = options;
      } else {
        this.ports[name] = new this.model(options, process);
      }
      this[name] = this.ports[name];
      this.emit('add', name);
      return this;
    };

    Ports.prototype.remove = function(name) {
      if (!this.ports[name]) {
        throw new Error("Port " + name + " not defined");
      }
      delete this.ports[name];
      delete this[name];
      this.emit('remove', name);
      return this;
    };

    return Ports;

  })(EventEmitter);

  exports.InPorts = InPorts = (function(_super) {
    __extends(InPorts, _super);

    function InPorts() {
      return InPorts.__super__.constructor.apply(this, arguments);
    }

    InPorts.prototype.on = function(name, event, callback) {
      if (!this.ports[name]) {
        throw new Error("Port " + name + " not available");
      }
      return this.ports[name].on(event, callback);
    };

    InPorts.prototype.once = function(name, event, callback) {
      if (!this.ports[name]) {
        throw new Error("Port " + name + " not available");
      }
      return this.ports[name].once(event, callback);
    };

    return InPorts;

  })(Ports);

  exports.OutPorts = OutPorts = (function(_super) {
    __extends(OutPorts, _super);

    function OutPorts() {
      return OutPorts.__super__.constructor.apply(this, arguments);
    }

    OutPorts.prototype.model = OutPort;

    OutPorts.prototype.connect = function(name, socketId) {
      if (!this.ports[name]) {
        throw new Error("Port " + name + " not available");
      }
      return this.ports[name].connect(socketId);
    };

    OutPorts.prototype.beginGroup = function(name, group, socketId) {
      if (!this.ports[name]) {
        throw new Error("Port " + name + " not available");
      }
      return this.ports[name].beginGroup(group, socketId);
    };

    OutPorts.prototype.send = function(name, data, socketId) {
      if (!this.ports[name]) {
        throw new Error("Port " + name + " not available");
      }
      return this.ports[name].send(data, socketId);
    };

    OutPorts.prototype.endGroup = function(name, socketId) {
      if (!this.ports[name]) {
        throw new Error("Port " + name + " not available");
      }
      return this.ports[name].endGroup(socketId);
    };

    OutPorts.prototype.disconnect = function(name, socketId) {
      if (!this.ports[name]) {
        throw new Error("Port " + name + " not available");
      }
      return this.ports[name].disconnect(socketId);
    };

    return OutPorts;

  })(Ports);

}).call(this);
