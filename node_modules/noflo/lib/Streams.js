(function() {
  var IP, StreamReceiver, StreamSender, Substream;

  IP = (function() {
    function IP(data) {
      this.data = data;
    }

    IP.prototype.sendTo = function(port) {
      return port.send(this.data);
    };

    IP.prototype.getValue = function() {
      return this.data;
    };

    IP.prototype.toObject = function() {
      return this.data;
    };

    return IP;

  })();

  exports.IP = IP;

  Substream = (function() {
    function Substream(key) {
      this.key = key;
      this.value = [];
    }

    Substream.prototype.push = function(value) {
      return this.value.push(value);
    };

    Substream.prototype.sendTo = function(port) {
      var ip, _i, _len, _ref;
      port.beginGroup(this.key);
      _ref = this.value;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ip = _ref[_i];
        if (ip instanceof Substream || ip instanceof IP) {
          ip.sendTo(port);
        } else {
          port.send(ip);
        }
      }
      return port.endGroup();
    };

    Substream.prototype.getKey = function() {
      return this.key;
    };

    Substream.prototype.getValue = function() {
      var hasKeys, ip, obj, res, val, _i, _len, _ref;
      switch (this.value.length) {
        case 0:
          return null;
        case 1:
          if (typeof this.value[0].getValue === 'function') {
            if (this.value[0] instanceof Substream) {
              obj = {};
              obj[this.value[0].key] = this.value[0].getValue();
              return obj;
            } else {
              return this.value[0].getValue();
            }
          } else {
            return this.value[0];
          }
          break;
        default:
          res = [];
          hasKeys = false;
          _ref = this.value;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            ip = _ref[_i];
            val = typeof ip.getValue === 'function' ? ip.getValue() : ip;
            if (ip instanceof Substream) {
              obj = {};
              obj[ip.key] = ip.getValue();
              res.push(obj);
            } else {
              res.push(val);
            }
          }
          return res;
      }
    };

    Substream.prototype.toObject = function() {
      var obj;
      obj = {};
      obj[this.key] = this.getValue();
      return obj;
    };

    return Substream;

  })();

  exports.Substream = Substream;

  StreamSender = (function() {
    function StreamSender(port, ordered) {
      this.port = port;
      this.ordered = ordered != null ? ordered : false;
      this.q = [];
      this.resetCurrent();
      this.resolved = false;
    }

    StreamSender.prototype.resetCurrent = function() {
      this.level = 0;
      this.current = null;
      return this.stack = [];
    };

    StreamSender.prototype.beginGroup = function(group) {
      var stream;
      this.level++;
      stream = new Substream(group);
      this.stack.push(stream);
      this.current = stream;
      return this;
    };

    StreamSender.prototype.endGroup = function() {
      var parent, value;
      if (this.level > 0) {
        this.level--;
      }
      value = this.stack.pop();
      if (this.level === 0) {
        this.q.push(value);
        this.resetCurrent();
      } else {
        parent = this.stack[this.stack.length - 1];
        parent.push(value);
        this.current = parent;
      }
      return this;
    };

    StreamSender.prototype.send = function(data) {
      if (this.level === 0) {
        this.q.push(new IP(data));
      } else {
        this.current.push(new IP(data));
      }
      return this;
    };

    StreamSender.prototype.done = function() {
      if (this.ordered) {
        this.resolved = true;
      } else {
        this.flush();
      }
      return this;
    };

    StreamSender.prototype.disconnect = function() {
      this.q.push(null);
      return this;
    };

    StreamSender.prototype.flush = function() {
      var ip, res, _i, _len, _ref;
      res = false;
      if (this.q.length > 0) {
        _ref = this.q;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          ip = _ref[_i];
          if (ip === null) {
            if (this.port.isConnected()) {
              this.port.disconnect();
            }
          } else {
            ip.sendTo(this.port);
          }
        }
        res = true;
      }
      this.q = [];
      return res;
    };

    StreamSender.prototype.isAttached = function() {
      return this.port.isAttached();
    };

    return StreamSender;

  })();

  exports.StreamSender = StreamSender;

  StreamReceiver = (function() {
    function StreamReceiver(port, buffered, process) {
      this.port = port;
      this.buffered = buffered != null ? buffered : false;
      this.process = process != null ? process : null;
      this.q = [];
      this.resetCurrent();
      this.port.process = (function(_this) {
        return function(event, payload, index) {
          var stream;
          switch (event) {
            case 'connect':
              if (typeof _this.process === 'function') {
                return _this.process('connect', index);
              }
              break;
            case 'begingroup':
              _this.level++;
              stream = new Substream(payload);
              if (_this.level === 1) {
                _this.root = stream;
                _this.parent = null;
              } else {
                _this.parent = _this.current;
              }
              return _this.current = stream;
            case 'endgroup':
              if (_this.level > 0) {
                _this.level--;
              }
              if (_this.level === 0) {
                if (_this.buffered) {
                  _this.q.push(_this.root);
                  _this.process('readable', index);
                } else {
                  if (typeof _this.process === 'function') {
                    _this.process('data', _this.root, index);
                  }
                }
                return _this.resetCurrent();
              } else {
                _this.parent.push(_this.current);
                return _this.current = _this.parent;
              }
              break;
            case 'data':
              if (_this.level === 0) {
                return _this.q.push(new IP(payload));
              } else {
                return _this.current.push(new IP(payload));
              }
              break;
            case 'disconnect':
              if (typeof _this.process === 'function') {
                return _this.process('disconnect', index);
              }
          }
        };
      })(this);
    }

    StreamReceiver.prototype.resetCurrent = function() {
      this.level = 0;
      this.root = null;
      this.current = null;
      return this.parent = null;
    };

    StreamReceiver.prototype.read = function() {
      if (this.q.length === 0) {
        return void 0;
      }
      return this.q.shift();
    };

    return StreamReceiver;

  })();

  exports.StreamReceiver = StreamReceiver;

}).call(this);
