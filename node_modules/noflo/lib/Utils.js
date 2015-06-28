(function() {
  var clone, guessLanguageFromFilename;

  clone = function(obj) {
    var flags, key, newInstance;
    if ((obj == null) || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof RegExp) {
      flags = '';
      if (obj.global != null) {
        flags += 'g';
      }
      if (obj.ignoreCase != null) {
        flags += 'i';
      }
      if (obj.multiline != null) {
        flags += 'm';
      }
      if (obj.sticky != null) {
        flags += 'y';
      }
      return new RegExp(obj.source, flags);
    }
    newInstance = new obj.constructor();
    for (key in obj) {
      newInstance[key] = clone(obj[key]);
    }
    return newInstance;
  };

  guessLanguageFromFilename = function(filename) {
    if (/.*\.coffee$/.test(filename)) {
      return 'coffeescript';
    }
    return 'javascript';
  };

  exports.clone = clone;

  exports.guessLanguageFromFilename = guessLanguageFromFilename;

}).call(this);
