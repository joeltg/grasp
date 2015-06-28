(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Build required libs
noflo = require('noflo');
},{"noflo":34}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":19}],4:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var kMaxLength = 0x3fffffff

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Note:
 *
 * - Implementation must support adding new properties to `Uint8Array` instances.
 *   Firefox 4-29 lacked support, fixed in Firefox 30+.
 *   See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *  - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *  - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *    incorrect length in some situations.
 *
 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they will
 * get the Object implementation, which is slower but will work correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = (function () {
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        new Uint8Array(1).subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Find the length
  var length
  if (type === 'number')
    length = subject > 0 ? subject >>> 0 : 0
  else if (type === 'string') {
    if (encoding === 'base64')
      subject = base64clean(subject)
    length = Buffer.byteLength(subject, encoding)
  } else if (type === 'object' && subject !== null) { // assume object is array-like
    if (subject.type === 'Buffer' && isArray(subject.data))
      subject = subject.data
    length = +subject.length > 0 ? Math.floor(+subject.length) : 0
  } else
    throw new TypeError('must start with number, buffer, array or string')

  if (this.length > kMaxLength)
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
      'size: 0x' + kMaxLength.toString(16) + ' bytes')

  var buf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer.TYPED_ARRAY_SUPPORT && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    if (Buffer.isBuffer(subject)) {
      for (i = 0; i < length; i++)
        buf[i] = subject.readUInt8(i)
    } else {
      for (i = 0; i < length; i++)
        buf[i] = ((subject[i] % 256) + 256) % 256
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer.TYPED_ARRAY_SUPPORT && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

Buffer.isBuffer = function (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b))
    throw new TypeError('Arguments must be Buffers')

  var x = a.length
  var y = b.length
  for (var i = 0, len = Math.min(x, y); i < len && a[i] === b[i]; i++) {}
  if (i !== len) {
    x = a[i]
    y = b[i]
  }
  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) throw new TypeError('Usage: Buffer.concat(list[, length])')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (totalLength === undefined) {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    case 'hex':
      ret = str.length >>> 1
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    default:
      ret = str.length
  }
  return ret
}

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function (encoding, start, end) {
  var loweredCase = false

  start = start >>> 0
  end = end === undefined || end === Infinity ? this.length : end >>> 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase)
          throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.equals = function (b) {
  if(!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max)
      str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  return Buffer.compare(this, b)
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(byte)) throw new Error('Invalid hex string')
    buf[offset + i] = byte
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function asciiWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  var charsWritten = blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function utf16leWrite (buf, string, offset, length) {
  var charsWritten = blitBuffer(utf16leToBytes(string), buf, offset, length, 2)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = utf16leWrite(this, string, offset, length)
      break
    default:
      throw new TypeError('Unknown encoding: ' + encoding)
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function binarySlice (buf, start, end) {
  return asciiSlice(buf, start, end)
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len;
    if (start < 0)
      start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0)
      end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start)
    end = start

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0)
    throw new RangeError('offset is not uint')
  if (offset + ext > length)
    throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80))
    return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  if (!noAssert)
    checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else objectWriteUInt16(this, value, offset, true)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else objectWriteUInt16(this, value, offset, false)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else objectWriteUInt32(this, value, offset, true)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert)
    checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else objectWriteUInt32(this, value, offset, false)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new TypeError('value is out of bounds')
  if (offset + ext > buf.length) throw new TypeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert)
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  if (end < start) throw new TypeError('sourceEnd < sourceStart')
  if (target_start < 0 || target_start >= target.length)
    throw new TypeError('targetStart out of bounds')
  if (start < 0 || start >= source.length) throw new TypeError('sourceStart out of bounds')
  if (end < 0 || end > source.length) throw new TypeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < len; i++) {
      target[i + target_start] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new TypeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new TypeError('start out of bounds')
  if (end < 0 || end > this.length) throw new TypeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-z]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F) {
      byteArray.push(b)
    } else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++) {
        byteArray.push(parseInt(h[j], 16))
      }
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length, unitSize) {
  if (unitSize) length -= length % unitSize;
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

},{"base64-js":5,"ieee754":6,"is-array":7}],5:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],6:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],7:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],8:[function(require,module,exports){
module.exports={
  "O_RDONLY": 0,
  "O_WRONLY": 1,
  "O_RDWR": 2,
  "S_IFMT": 61440,
  "S_IFREG": 32768,
  "S_IFDIR": 16384,
  "S_IFCHR": 8192,
  "S_IFBLK": 24576,
  "S_IFIFO": 4096,
  "S_IFLNK": 40960,
  "S_IFSOCK": 49152,
  "O_CREAT": 512,
  "O_EXCL": 2048,
  "O_NOCTTY": 131072,
  "O_TRUNC": 1024,
  "O_APPEND": 8,
  "O_DIRECTORY": 1048576,
  "O_NOFOLLOW": 256,
  "O_SYNC": 128,
  "O_SYMLINK": 2097152,
  "S_IRWXU": 448,
  "S_IRUSR": 256,
  "S_IWUSR": 128,
  "S_IXUSR": 64,
  "S_IRWXG": 56,
  "S_IRGRP": 32,
  "S_IWGRP": 16,
  "S_IXGRP": 8,
  "S_IRWXO": 7,
  "S_IROTH": 4,
  "S_IWOTH": 2,
  "S_IXOTH": 1,
  "E2BIG": 7,
  "EACCES": 13,
  "EADDRINUSE": 48,
  "EADDRNOTAVAIL": 49,
  "EAFNOSUPPORT": 47,
  "EAGAIN": 35,
  "EALREADY": 37,
  "EBADF": 9,
  "EBADMSG": 94,
  "EBUSY": 16,
  "ECANCELED": 89,
  "ECHILD": 10,
  "ECONNABORTED": 53,
  "ECONNREFUSED": 61,
  "ECONNRESET": 54,
  "EDEADLK": 11,
  "EDESTADDRREQ": 39,
  "EDOM": 33,
  "EDQUOT": 69,
  "EEXIST": 17,
  "EFAULT": 14,
  "EFBIG": 27,
  "EHOSTUNREACH": 65,
  "EIDRM": 90,
  "EILSEQ": 92,
  "EINPROGRESS": 36,
  "EINTR": 4,
  "EINVAL": 22,
  "EIO": 5,
  "EISCONN": 56,
  "EISDIR": 21,
  "ELOOP": 62,
  "EMFILE": 24,
  "EMLINK": 31,
  "EMSGSIZE": 40,
  "EMULTIHOP": 95,
  "ENAMETOOLONG": 63,
  "ENETDOWN": 50,
  "ENETRESET": 52,
  "ENETUNREACH": 51,
  "ENFILE": 23,
  "ENOBUFS": 55,
  "ENODATA": 96,
  "ENODEV": 19,
  "ENOENT": 2,
  "ENOEXEC": 8,
  "ENOLCK": 77,
  "ENOLINK": 97,
  "ENOMEM": 12,
  "ENOMSG": 91,
  "ENOPROTOOPT": 42,
  "ENOSPC": 28,
  "ENOSR": 98,
  "ENOSTR": 99,
  "ENOSYS": 78,
  "ENOTCONN": 57,
  "ENOTDIR": 20,
  "ENOTEMPTY": 66,
  "ENOTSOCK": 38,
  "ENOTSUP": 45,
  "ENOTTY": 25,
  "ENXIO": 6,
  "EOPNOTSUPP": 102,
  "EOVERFLOW": 84,
  "EPERM": 1,
  "EPIPE": 32,
  "EPROTO": 100,
  "EPROTONOSUPPORT": 43,
  "EPROTOTYPE": 41,
  "ERANGE": 34,
  "EROFS": 30,
  "ESPIPE": 29,
  "ESRCH": 3,
  "ESTALE": 70,
  "ETIME": 101,
  "ETIMEDOUT": 60,
  "ETXTBSY": 26,
  "EWOULDBLOCK": 35,
  "EXDEV": 18,
  "SIGHUP": 1,
  "SIGINT": 2,
  "SIGQUIT": 3,
  "SIGILL": 4,
  "SIGTRAP": 5,
  "SIGABRT": 6,
  "SIGIOT": 6,
  "SIGBUS": 10,
  "SIGFPE": 8,
  "SIGKILL": 9,
  "SIGUSR1": 30,
  "SIGSEGV": 11,
  "SIGUSR2": 31,
  "SIGPIPE": 13,
  "SIGALRM": 14,
  "SIGTERM": 15,
  "SIGCHLD": 20,
  "SIGCONT": 19,
  "SIGSTOP": 17,
  "SIGTSTP": 18,
  "SIGTTIN": 21,
  "SIGTTOU": 22,
  "SIGURG": 16,
  "SIGXCPU": 24,
  "SIGXFSZ": 25,
  "SIGVTALRM": 26,
  "SIGPROF": 27,
  "SIGWINCH": 28,
  "SIGIO": 23,
  "SIGSYS": 12,
  "SSL_OP_ALL": 2147486719,
  "SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION": 262144,
  "SSL_OP_CIPHER_SERVER_PREFERENCE": 4194304,
  "SSL_OP_CISCO_ANYCONNECT": 32768,
  "SSL_OP_COOKIE_EXCHANGE": 8192,
  "SSL_OP_CRYPTOPRO_TLSEXT_BUG": 2147483648,
  "SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS": 2048,
  "SSL_OP_EPHEMERAL_RSA": 2097152,
  "SSL_OP_LEGACY_SERVER_CONNECT": 4,
  "SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER": 32,
  "SSL_OP_MICROSOFT_SESS_ID_BUG": 1,
  "SSL_OP_MSIE_SSLV2_RSA_PADDING": 64,
  "SSL_OP_NETSCAPE_CA_DN_BUG": 536870912,
  "SSL_OP_NETSCAPE_CHALLENGE_BUG": 2,
  "SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG": 1073741824,
  "SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG": 8,
  "SSL_OP_NO_COMPRESSION": 131072,
  "SSL_OP_NO_QUERY_MTU": 4096,
  "SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION": 65536,
  "SSL_OP_NO_SSLv2": 16777216,
  "SSL_OP_NO_SSLv3": 33554432,
  "SSL_OP_NO_TICKET": 16384,
  "SSL_OP_NO_TLSv1": 67108864,
  "SSL_OP_NO_TLSv1_1": 268435456,
  "SSL_OP_NO_TLSv1_2": 134217728,
  "SSL_OP_PKCS1_CHECK_1": 0,
  "SSL_OP_PKCS1_CHECK_2": 0,
  "SSL_OP_SINGLE_DH_USE": 1048576,
  "SSL_OP_SINGLE_ECDH_USE": 524288,
  "SSL_OP_SSLEAY_080_CLIENT_DH_BUG": 128,
  "SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG": 16,
  "SSL_OP_TLS_BLOCK_PADDING_BUG": 512,
  "SSL_OP_TLS_D5_BUG": 256,
  "SSL_OP_TLS_ROLLBACK_BUG": 8388608,
  "NPN_ENABLED": 1
}

},{}],9:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],10:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],11:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":12}],12:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],13:[function(require,module,exports){
(function (global){
/*! http://mths.be/punycode v1.2.4 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports;
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		while (length--) {
			array[length] = fn(array[length]);
		}
		return array;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings.
	 * @private
	 * @param {String} domain The domain name.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		return map(string.split(regexSeparators), fn).join('.');
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <http://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * http://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols to a Punycode string of ASCII-only
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name to Unicode. Only the
	 * Punycoded parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it on a string that has already been converted to
	 * Unicode.
	 * @memberOf punycode
	 * @param {String} domain The Punycode domain name to convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(domain) {
		return mapDomain(domain, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name to Punycode. Only the
	 * non-ASCII parts of the domain name will be converted, i.e. it doesn't
	 * matter if you call it with a domain that's already in ASCII.
	 * @memberOf punycode
	 * @param {String} domain The domain name to convert, as a Unicode string.
	 * @returns {String} The Punycode representation of the given domain name.
	 */
	function toASCII(domain) {
		return mapDomain(domain, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.2.4',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <http://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],16:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":14,"./encode":15}],17:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var punycode = require('punycode');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a puny coded representation of "domain".
      // It only converts the part of the domain name that
      // has non ASCII characters. I.e. it dosent matter if
      // you call it with a domain that already is in ASCII.
      var domainArray = this.hostname.split('.');
      var newOut = [];
      for (var i = 0; i < domainArray.length; ++i) {
        var s = domainArray[i];
        newOut.push(s.match(/[^A-Za-z0-9_-]/) ?
            'xn--' + punycode.encode(s) : s);
      }
      this.hostname = newOut.join('.');
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  Object.keys(this).forEach(function(k) {
    result[k] = this[k];
  }, this);

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    Object.keys(relative).forEach(function(k) {
      if (k !== 'protocol')
        result[k] = relative[k];
    });

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      Object.keys(relative).forEach(function(k) {
        result[k] = relative[k];
      });
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especialy happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host) && (last === '.' || last === '..') ||
      last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last == '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especialy happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!isNull(result.pathname) || !isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

function isString(arg) {
  return typeof arg === "string";
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isNull(arg) {
  return arg === null;
}
function isNullOrUndefined(arg) {
  return  arg == null;
}

},{"punycode":13,"querystring":16}],18:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],19:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":18,"_process":12,"inherits":10}],20:[function(require,module,exports){
var indexOf = require('indexof');

var Object_keys = function (obj) {
    if (Object.keys) return Object.keys(obj)
    else {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    }
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

var defineProp = (function() {
    try {
        Object.defineProperty({}, '_', {});
        return function(obj, name, value) {
            Object.defineProperty(obj, name, {
                writable: true,
                enumerable: false,
                configurable: true,
                value: value
            })
        };
    } catch(e) {
        return function(obj, name, value) {
            obj[name] = value;
        };
    }
}());

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

function Context() {}
Context.prototype = {};

var Script = exports.Script = function NodeScript (code) {
    if (!(this instanceof Script)) return new Script(code);
    this.code = code;
};

Script.prototype.runInContext = function (context) {
    if (!(context instanceof Context)) {
        throw new TypeError("needs a 'context' argument.");
    }
    
    var iframe = document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';
    
    document.body.appendChild(iframe);
    
    var win = iframe.contentWindow;
    var wEval = win.eval, wExecScript = win.execScript;

    if (!wEval && wExecScript) {
        // win.eval() magically appears when this is called in IE:
        wExecScript.call(win, 'null');
        wEval = win.eval;
    }
    
    forEach(Object_keys(context), function (key) {
        win[key] = context[key];
    });
    forEach(globals, function (key) {
        if (context[key]) {
            win[key] = context[key];
        }
    });
    
    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);
    
    forEach(Object_keys(win), function (key) {
        // Avoid copying circular objects like `top` and `window` by only
        // updating existing context properties or new properties in the `win`
        // that was only introduced after the eval.
        if (key in context || indexOf(winKeys, key) === -1) {
            context[key] = win[key];
        }
    });

    forEach(globals, function (key) {
        if (!(key in context)) {
            defineProp(context, key, win[key]);
        }
    });
    
    document.body.removeChild(iframe);
    
    return res;
};

Script.prototype.runInThisContext = function () {
    return eval(this.code); // maybe...
};

Script.prototype.runInNewContext = function (context) {
    var ctx = Script.createContext(context);
    var res = this.runInContext(ctx);

    forEach(Object_keys(ctx), function (key) {
        context[key] = ctx[key];
    });

    return res;
};

forEach(Object_keys(Script.prototype), function (name) {
    exports[name] = Script[name] = function (code) {
        var s = Script(code);
        return s[name].apply(s, [].slice.call(arguments, 1));
    };
});

exports.createScript = function (code) {
    return exports.Script(code);
};

exports.createContext = Script.createContext = function (context) {
    var copy = new Context();
    if(typeof context === 'object') {
        forEach(Object_keys(context), function (key) {
            copy[key] = context[key];
        });
    }
    return copy;
};

},{"indexof":21}],21:[function(require,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],22:[function(require,module,exports){
(function() {
  var ArrayPort, port,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  port = require("./Port");

  ArrayPort = (function(_super) {
    __extends(ArrayPort, _super);

    function ArrayPort(type) {
      this.type = type;
      ArrayPort.__super__.constructor.call(this, this.type);
    }

    ArrayPort.prototype.attach = function(socket, socketId) {
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        socketId = this.sockets.length;
      }
      this.sockets[socketId] = socket;
      return this.attachSocket(socket, socketId);
    };

    ArrayPort.prototype.connect = function(socketId) {
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("" + (this.getId()) + ": No connections available");
        }
        this.sockets.forEach(function(socket) {
          if (!socket) {
            return;
          }
          return socket.connect();
        });
        return;
      }
      if (!this.sockets[socketId]) {
        throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
      }
      return this.sockets[socketId].connect();
    };

    ArrayPort.prototype.beginGroup = function(group, socketId) {
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("" + (this.getId()) + ": No connections available");
        }
        this.sockets.forEach((function(_this) {
          return function(socket, index) {
            if (!socket) {
              return;
            }
            return _this.beginGroup(group, index);
          };
        })(this));
        return;
      }
      if (!this.sockets[socketId]) {
        throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
      }
      if (this.isConnected(socketId)) {
        return this.sockets[socketId].beginGroup(group);
      }
      this.sockets[socketId].once("connect", (function(_this) {
        return function() {
          return _this.sockets[socketId].beginGroup(group);
        };
      })(this));
      return this.sockets[socketId].connect();
    };

    ArrayPort.prototype.send = function(data, socketId) {
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("" + (this.getId()) + ": No connections available");
        }
        this.sockets.forEach((function(_this) {
          return function(socket, index) {
            if (!socket) {
              return;
            }
            return _this.send(data, index);
          };
        })(this));
        return;
      }
      if (!this.sockets[socketId]) {
        throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
      }
      if (this.isConnected(socketId)) {
        return this.sockets[socketId].send(data);
      }
      this.sockets[socketId].once("connect", (function(_this) {
        return function() {
          return _this.sockets[socketId].send(data);
        };
      })(this));
      return this.sockets[socketId].connect();
    };

    ArrayPort.prototype.endGroup = function(socketId) {
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("" + (this.getId()) + ": No connections available");
        }
        this.sockets.forEach((function(_this) {
          return function(socket, index) {
            if (!socket) {
              return;
            }
            return _this.endGroup(index);
          };
        })(this));
        return;
      }
      if (!this.sockets[socketId]) {
        throw new Error("" + (this.getId()) + ": No connection '" + socketId + "' available");
      }
      return this.sockets[socketId].endGroup();
    };

    ArrayPort.prototype.disconnect = function(socketId) {
      var socket, _i, _len, _ref;
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        if (!this.sockets.length) {
          throw new Error("" + (this.getId()) + ": No connections available");
        }
        _ref = this.sockets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          socket = _ref[_i];
          if (!socket) {
            return;
          }
          socket.disconnect();
        }
        return;
      }
      if (!this.sockets[socketId]) {
        return;
      }
      return this.sockets[socketId].disconnect();
    };

    ArrayPort.prototype.isConnected = function(socketId) {
      var connected;
      if (socketId == null) {
        socketId = null;
      }
      if (socketId === null) {
        connected = false;
        this.sockets.forEach((function(_this) {
          return function(socket) {
            if (!socket) {
              return;
            }
            if (socket.isConnected()) {
              return connected = true;
            }
          };
        })(this));
        return connected;
      }
      if (!this.sockets[socketId]) {
        return false;
      }
      return this.sockets[socketId].isConnected();
    };

    ArrayPort.prototype.isAddressable = function() {
      return true;
    };

    ArrayPort.prototype.isAttached = function(socketId) {
      var socket, _i, _len, _ref;
      if (socketId === void 0) {
        _ref = this.sockets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          socket = _ref[_i];
          if (socket) {
            return true;
          }
        }
        return false;
      }
      if (this.sockets[socketId]) {
        return true;
      }
      return false;
    };

    return ArrayPort;

  })(port.Port);

  exports.ArrayPort = ArrayPort;

}).call(this);

},{"./Port":37}],23:[function(require,module,exports){
(function (process){
(function() {
  var AsyncComponent, component, port,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  port = require("./Port");

  component = require("./Component");

  AsyncComponent = (function(_super) {
    __extends(AsyncComponent, _super);

    function AsyncComponent(inPortName, outPortName, errPortName) {
      this.inPortName = inPortName != null ? inPortName : "in";
      this.outPortName = outPortName != null ? outPortName : "out";
      this.errPortName = errPortName != null ? errPortName : "error";
      if (!this.inPorts[this.inPortName]) {
        throw new Error("no inPort named '" + this.inPortName + "'");
      }
      if (!this.outPorts[this.outPortName]) {
        throw new Error("no outPort named '" + this.outPortName + "'");
      }
      this.load = 0;
      this.q = [];
      this.errorGroups = [];
      this.outPorts.load = new port.Port();
      this.inPorts[this.inPortName].on("begingroup", (function(_this) {
        return function(group) {
          if (_this.load > 0) {
            return _this.q.push({
              name: "begingroup",
              data: group
            });
          }
          _this.errorGroups.push(group);
          return _this.outPorts[_this.outPortName].beginGroup(group);
        };
      })(this));
      this.inPorts[this.inPortName].on("endgroup", (function(_this) {
        return function() {
          if (_this.load > 0) {
            return _this.q.push({
              name: "endgroup"
            });
          }
          _this.errorGroups.pop();
          return _this.outPorts[_this.outPortName].endGroup();
        };
      })(this));
      this.inPorts[this.inPortName].on("disconnect", (function(_this) {
        return function() {
          if (_this.load > 0) {
            return _this.q.push({
              name: "disconnect"
            });
          }
          _this.outPorts[_this.outPortName].disconnect();
          _this.errorGroups = [];
          if (_this.outPorts.load.isAttached()) {
            return _this.outPorts.load.disconnect();
          }
        };
      })(this));
      this.inPorts[this.inPortName].on("data", (function(_this) {
        return function(data) {
          if (_this.q.length > 0) {
            return _this.q.push({
              name: "data",
              data: data
            });
          }
          return _this.processData(data);
        };
      })(this));
    }

    AsyncComponent.prototype.processData = function(data) {
      this.incrementLoad();
      return this.doAsync(data, (function(_this) {
        return function(err) {
          if (err) {
            _this.error(err, _this.errorGroups, _this.errPortName);
          }
          return _this.decrementLoad();
        };
      })(this));
    };

    AsyncComponent.prototype.incrementLoad = function() {
      this.load++;
      if (this.outPorts.load.isAttached()) {
        this.outPorts.load.send(this.load);
      }
      if (this.outPorts.load.isAttached()) {
        return this.outPorts.load.disconnect();
      }
    };

    AsyncComponent.prototype.doAsync = function(data, callback) {
      return callback(new Error("AsyncComponents must implement doAsync"));
    };

    AsyncComponent.prototype.decrementLoad = function() {
      if (this.load === 0) {
        throw new Error("load cannot be negative");
      }
      this.load--;
      if (this.outPorts.load.isAttached()) {
        this.outPorts.load.send(this.load);
      }
      if (this.outPorts.load.isAttached()) {
        this.outPorts.load.disconnect();
      }
      if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
        return process.nextTick((function(_this) {
          return function() {
            return _this.processQueue();
          };
        })(this));
      } else {
        return setTimeout((function(_this) {
          return function() {
            return _this.processQueue();
          };
        })(this), 0);
      }
    };

    AsyncComponent.prototype.processQueue = function() {
      var event, processedData;
      if (this.load > 0) {
        return;
      }
      processedData = false;
      while (this.q.length > 0) {
        event = this.q[0];
        switch (event.name) {
          case "begingroup":
            if (processedData) {
              return;
            }
            this.outPorts[this.outPortName].beginGroup(event.data);
            this.errorGroups.push(event.data);
            this.q.shift();
            break;
          case "endgroup":
            if (processedData) {
              return;
            }
            this.outPorts[this.outPortName].endGroup();
            this.errorGroups.pop();
            this.q.shift();
            break;
          case "disconnect":
            if (processedData) {
              return;
            }
            this.outPorts[this.outPortName].disconnect();
            if (this.outPorts.load.isAttached()) {
              this.outPorts.load.disconnect();
            }
            this.errorGroups = [];
            this.q.shift();
            break;
          case "data":
            this.processData(event.data);
            this.q.shift();
            processedData = true;
        }
      }
    };

    AsyncComponent.prototype.shutdown = function() {
      this.q = [];
      return this.errorGroups = [];
    };

    return AsyncComponent;

  })(component.Component);

  exports.AsyncComponent = AsyncComponent;

}).call(this);

}).call(this,require('_process'))
},{"./Component":25,"./Port":37,"_process":12}],24:[function(require,module,exports){
(function() {
  var BasePort, EventEmitter, validTypes,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  validTypes = ['all', 'string', 'number', 'int', 'object', 'array', 'boolean', 'color', 'date', 'bang', 'function', 'buffer'];

  BasePort = (function(_super) {
    __extends(BasePort, _super);

    function BasePort(options) {
      this.handleOptions(options);
      this.sockets = [];
      this.node = null;
      this.name = null;
    }

    BasePort.prototype.handleOptions = function(options) {
      if (!options) {
        options = {};
      }
      if (!options.datatype) {
        options.datatype = 'all';
      }
      if (options.required === void 0) {
        options.required = false;
      }
      if (options.datatype === 'integer') {
        options.datatype = 'int';
      }
      if (validTypes.indexOf(options.datatype) === -1) {
        throw new Error("Invalid port datatype '" + options.datatype + "' specified, valid are " + (validTypes.join(', ')));
      }
      if (options.type && options.type.indexOf('/') === -1) {
        throw new Error("Invalid port type '" + options.type + "' specified. Should be URL or MIME type");
      }
      return this.options = options;
    };

    BasePort.prototype.getId = function() {
      if (!(this.node && this.name)) {
        return 'Port';
      }
      return "" + this.node + " " + (this.name.toUpperCase());
    };

    BasePort.prototype.getDataType = function() {
      return this.options.datatype;
    };

    BasePort.prototype.getDescription = function() {
      return this.options.description;
    };

    BasePort.prototype.attach = function(socket, index) {
      if (index == null) {
        index = null;
      }
      if (!this.isAddressable() || index === null) {
        index = this.sockets.length;
      }
      this.sockets[index] = socket;
      this.attachSocket(socket, index);
      if (this.isAddressable()) {
        this.emit('attach', socket, index);
        return;
      }
      return this.emit('attach', socket);
    };

    BasePort.prototype.attachSocket = function() {};

    BasePort.prototype.detach = function(socket) {
      var index;
      index = this.sockets.indexOf(socket);
      if (index === -1) {
        return;
      }
      this.sockets[index] = void 0;
      if (this.isAddressable()) {
        this.emit('detach', socket, index);
        return;
      }
      return this.emit('detach', socket);
    };

    BasePort.prototype.isAddressable = function() {
      if (this.options.addressable) {
        return true;
      }
      return false;
    };

    BasePort.prototype.isBuffered = function() {
      if (this.options.buffered) {
        return true;
      }
      return false;
    };

    BasePort.prototype.isRequired = function() {
      if (this.options.required) {
        return true;
      }
      return false;
    };

    BasePort.prototype.isAttached = function(socketId) {
      if (socketId == null) {
        socketId = null;
      }
      if (this.isAddressable() && socketId !== null) {
        if (this.sockets[socketId]) {
          return true;
        }
        return false;
      }
      if (this.sockets.length) {
        return true;
      }
      return false;
    };

    BasePort.prototype.listAttached = function() {
      var attached, idx, socket, _i, _len, _ref;
      attached = [];
      _ref = this.sockets;
      for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
        socket = _ref[idx];
        if (!socket) {
          continue;
        }
        attached.push(idx);
      }
      return attached;
    };

    BasePort.prototype.isConnected = function(socketId) {
      var connected;
      if (socketId == null) {
        socketId = null;
      }
      if (this.isAddressable()) {
        if (socketId === null) {
          throw new Error("" + (this.getId()) + ": Socket ID required");
        }
        if (!this.sockets[socketId]) {
          throw new Error("" + (this.getId()) + ": Socket " + socketId + " not available");
        }
        return this.sockets[socketId].isConnected();
      }
      connected = false;
      this.sockets.forEach((function(_this) {
        return function(socket) {
          if (!socket) {
            return;
          }
          if (socket.isConnected()) {
            return connected = true;
          }
        };
      })(this));
      return connected;
    };

    BasePort.prototype.canAttach = function() {
      return true;
    };

    return BasePort;

  })(EventEmitter);

  module.exports = BasePort;

}).call(this);

},{"events":9}],25:[function(require,module,exports){
(function() {
  var Component, EventEmitter, ports,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  ports = require('./Ports');

  Component = (function(_super) {
    __extends(Component, _super);

    Component.prototype.description = '';

    Component.prototype.icon = null;

    Component.prototype.started = false;

    function Component(options) {
      this.error = __bind(this.error, this);
      if (!options) {
        options = {};
      }
      if (!options.inPorts) {
        options.inPorts = {};
      }
      if (options.inPorts instanceof ports.InPorts) {
        this.inPorts = options.inPorts;
      } else {
        this.inPorts = new ports.InPorts(options.inPorts);
      }
      if (!options.outPorts) {
        options.outPorts = {};
      }
      if (options.outPorts instanceof ports.OutPorts) {
        this.outPorts = options.outPorts;
      } else {
        this.outPorts = new ports.OutPorts(options.outPorts);
      }
    }

    Component.prototype.getDescription = function() {
      return this.description;
    };

    Component.prototype.isReady = function() {
      return true;
    };

    Component.prototype.isSubgraph = function() {
      return false;
    };

    Component.prototype.setIcon = function(icon) {
      this.icon = icon;
      return this.emit('icon', this.icon);
    };

    Component.prototype.getIcon = function() {
      return this.icon;
    };

    Component.prototype.error = function(e, groups, errorPort) {
      var group, _i, _j, _len, _len1;
      if (groups == null) {
        groups = [];
      }
      if (errorPort == null) {
        errorPort = 'error';
      }
      if (this.outPorts[errorPort] && (this.outPorts[errorPort].isAttached() || !this.outPorts[errorPort].isRequired())) {
        for (_i = 0, _len = groups.length; _i < _len; _i++) {
          group = groups[_i];
          this.outPorts[errorPort].beginGroup(group);
        }
        this.outPorts[errorPort].send(e);
        for (_j = 0, _len1 = groups.length; _j < _len1; _j++) {
          group = groups[_j];
          this.outPorts[errorPort].endGroup();
        }
        this.outPorts[errorPort].disconnect();
        return;
      }
      throw e;
    };

    Component.prototype.shutdown = function() {
      return this.started = false;
    };

    Component.prototype.start = function() {
      this.started = true;
      return this.started;
    };

    Component.prototype.isStarted = function() {
      return this.started;
    };

    return Component;

  })(EventEmitter);

  exports.Component = Component;

}).call(this);

},{"./Ports":38,"events":9}],26:[function(require,module,exports){
(function (process){
(function() {
  var ComponentLoader, EventEmitter, internalSocket, nofloGraph, utils,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  internalSocket = require('./InternalSocket');

  nofloGraph = require('./Graph');

  utils = require('./Utils');

  EventEmitter = require('events').EventEmitter;

  ComponentLoader = (function(_super) {
    __extends(ComponentLoader, _super);

    function ComponentLoader(baseDir, options) {
      this.baseDir = baseDir;
      this.options = options != null ? options : {};
      this.components = null;
      this.componentLoaders = [];
      this.checked = [];
      this.revalidate = false;
      this.libraryIcons = {};
      this.processing = false;
      this.ready = false;
    }

    ComponentLoader.prototype.getModulePrefix = function(name) {
      if (!name) {
        return '';
      }
      if (name === 'noflo') {
        return '';
      }
      return name.replace('noflo-', '');
    };

    ComponentLoader.prototype.getModuleComponents = function(moduleName) {
      var cPath, definition, dependency, e, loader, loaderPath, name, prefix, _ref, _ref1, _results;
      if (this.checked.indexOf(moduleName) !== -1) {
        return;
      }
      this.checked.push(moduleName);
      try {
        definition = require("/" + moduleName + "/component.json");
      } catch (_error) {
        e = _error;
        if (moduleName.substr(0, 1) === '/') {
          return this.getModuleComponents("noflo-" + (moduleName.substr(1)));
        }
        return;
      }
      for (dependency in definition.dependencies) {
        this.getModuleComponents(dependency.replace('/', '-'));
      }
      if (!definition.noflo) {
        return;
      }
      prefix = this.getModulePrefix(definition.name);
      if (definition.noflo.icon) {
        this.libraryIcons[prefix] = definition.noflo.icon;
      }
      if (moduleName[0] === '/') {
        moduleName = moduleName.substr(1);
      }
      if (definition.noflo.loader) {
        loaderPath = "/" + moduleName + "/" + definition.noflo.loader;
        this.componentLoaders.push(loaderPath);
        loader = require(loaderPath);
        this.registerLoader(loader, function() {});
      }
      if (definition.noflo.components) {
        _ref = definition.noflo.components;
        for (name in _ref) {
          cPath = _ref[name];
          if (cPath.indexOf('.coffee') !== -1) {
            cPath = cPath.replace('.coffee', '.js');
          }
          if (cPath.substr(0, 2) === './') {
            cPath = cPath.substr(2);
          }
          this.registerComponent(prefix, name, "/" + moduleName + "/" + cPath);
        }
      }
      if (definition.noflo.graphs) {
        _ref1 = definition.noflo.graphs;
        _results = [];
        for (name in _ref1) {
          cPath = _ref1[name];
          _results.push(this.registerGraph(prefix, name, "/" + moduleName + "/" + cPath));
        }
        return _results;
      }
    };

    ComponentLoader.prototype.listComponents = function(callback) {
      if (this.processing) {
        this.once('ready', (function(_this) {
          return function() {
            return callback(_this.components);
          };
        })(this));
        return;
      }
      if (this.components) {
        return callback(this.components);
      }
      this.ready = false;
      this.processing = true;
      return setTimeout((function(_this) {
        return function() {
          _this.components = {};
          _this.getModuleComponents(_this.baseDir);
          _this.processing = false;
          _this.ready = true;
          _this.emit('ready', true);
          if (callback) {
            return callback(_this.components);
          }
        };
      })(this), 1);
    };

    ComponentLoader.prototype.load = function(name, callback, metadata) {
      var component, componentName;
      if (!this.ready) {
        this.listComponents((function(_this) {
          return function() {
            return _this.load(name, callback, metadata);
          };
        })(this));
        return;
      }
      component = this.components[name];
      if (!component) {
        for (componentName in this.components) {
          if (componentName.split('/')[1] === name) {
            component = this.components[componentName];
            break;
          }
        }
        if (!component) {
          callback(new Error("Component " + name + " not available with base " + this.baseDir));
          return;
        }
      }
      if (this.isGraph(component)) {
        if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
          process.nextTick((function(_this) {
            return function() {
              return _this.loadGraph(name, component, callback, metadata);
            };
          })(this));
        } else {
          setTimeout((function(_this) {
            return function() {
              return _this.loadGraph(name, component, callback, metadata);
            };
          })(this), 0);
        }
        return;
      }
      return this.createComponent(name, component, metadata, (function(_this) {
        return function(err, instance) {
          if (err) {
            return callback(err);
          }
          if (!instance) {
            callback(new Error("Component " + name + " could not be loaded."));
            return;
          }
          if (name === 'Graph') {
            instance.baseDir = _this.baseDir;
          }
          _this.setIcon(name, instance);
          return callback(null, instance);
        };
      })(this));
    };

    ComponentLoader.prototype.createComponent = function(name, component, metadata, callback) {
      var e, implementation, instance;
      implementation = component;
      if (typeof implementation === 'string') {
        try {
          implementation = require(implementation);
        } catch (_error) {
          e = _error;
          return callback(e);
        }
      }
      if (typeof implementation.getComponent === 'function') {
        instance = implementation.getComponent(metadata);
      } else if (typeof implementation === 'function') {
        instance = implementation(metadata);
      } else {
        callback(new Error("Invalid type " + (typeof implementation) + " for component " + name + "."));
        return;
      }
      if (typeof name === 'string') {
        instance.componentName = name;
      }
      return callback(null, instance);
    };

    ComponentLoader.prototype.isGraph = function(cPath) {
      if (typeof cPath === 'object' && cPath instanceof nofloGraph.Graph) {
        return true;
      }
      if (typeof cPath !== 'string') {
        return false;
      }
      return cPath.indexOf('.fbp') !== -1 || cPath.indexOf('.json') !== -1;
    };

    ComponentLoader.prototype.loadGraph = function(name, component, callback, metadata) {
      var graph, graphImplementation, graphSocket;
      graphImplementation = require(this.components['Graph']);
      graphSocket = internalSocket.createSocket();
      graph = graphImplementation.getComponent(metadata);
      graph.loader = this;
      graph.baseDir = this.baseDir;
      graph.inPorts.graph.attach(graphSocket);
      if (typeof name === 'string') {
        graph.componentName = name;
      }
      graphSocket.send(component);
      graphSocket.disconnect();
      graph.inPorts.remove('graph');
      this.setIcon(name, graph);
      return callback(null, graph);
    };

    ComponentLoader.prototype.setIcon = function(name, instance) {
      var componentName, library, _ref;
      if (!instance.getIcon || instance.getIcon()) {
        return;
      }
      _ref = name.split('/'), library = _ref[0], componentName = _ref[1];
      if (componentName && this.getLibraryIcon(library)) {
        instance.setIcon(this.getLibraryIcon(library));
        return;
      }
      if (instance.isSubgraph()) {
        instance.setIcon('sitemap');
        return;
      }
      instance.setIcon('square');
    };

    ComponentLoader.prototype.getLibraryIcon = function(prefix) {
      if (this.libraryIcons[prefix]) {
        return this.libraryIcons[prefix];
      }
      return null;
    };

    ComponentLoader.prototype.normalizeName = function(packageId, name) {
      var fullName, prefix;
      prefix = this.getModulePrefix(packageId);
      fullName = "" + prefix + "/" + name;
      if (!packageId) {
        fullName = name;
      }
      return fullName;
    };

    ComponentLoader.prototype.registerComponent = function(packageId, name, cPath, callback) {
      var fullName;
      fullName = this.normalizeName(packageId, name);
      this.components[fullName] = cPath;
      if (callback) {
        return callback();
      }
    };

    ComponentLoader.prototype.registerGraph = function(packageId, name, gPath, callback) {
      return this.registerComponent(packageId, name, gPath, callback);
    };

    ComponentLoader.prototype.registerLoader = function(loader, callback) {
      return loader(this, callback);
    };

    ComponentLoader.prototype.setSource = function(packageId, name, source, language, callback) {
      var e, implementation;
      if (!this.ready) {
        this.listComponents((function(_this) {
          return function() {
            return _this.setSource(packageId, name, source, language, callback);
          };
        })(this));
        return;
      }
      if (language === 'coffeescript') {
        if (!window.CoffeeScript) {
          return callback(new Error('CoffeeScript compiler not available'));
        }
        try {
          source = CoffeeScript.compile(source, {
            bare: true
          });
        } catch (_error) {
          e = _error;
          return callback(e);
        }
      }
      try {
        source = source.replace("require('noflo')", "require('./NoFlo')");
        source = source.replace('require("noflo")', 'require("./NoFlo")');
        implementation = eval("(function () { var exports = {}; " + source + "; return exports; })()");
      } catch (_error) {
        e = _error;
        return callback(e);
      }
      if (!(implementation || implementation.getComponent)) {
        return callback(new Error('Provided source failed to create a runnable component'));
      }
      return this.registerComponent(packageId, name, implementation, function() {
        return callback(null);
      });
    };

    ComponentLoader.prototype.getSource = function(name, callback) {
      var component, componentName, nameParts, path;
      if (!this.ready) {
        this.listComponents((function(_this) {
          return function() {
            return _this.getSource(name, callback);
          };
        })(this));
        return;
      }
      component = this.components[name];
      if (!component) {
        for (componentName in this.components) {
          if (componentName.split('/')[1] === name) {
            component = this.components[componentName];
            name = componentName;
            break;
          }
        }
        if (!component) {
          return callback(new Error("Component " + name + " not installed"));
        }
      }
      if (typeof component !== 'string') {
        return callback(new Error("Can't provide source for " + name + ". Not a file"));
      }
      nameParts = name.split('/');
      if (nameParts.length === 1) {
        nameParts[1] = nameParts[0];
        nameParts[0] = '';
      }
      if (this.isGraph(component)) {
        nofloGraph.loadFile(component, function(graph) {
          if (!graph) {
            return callback(new Error('Unable to load graph'));
          }
          return callback(null, {
            name: nameParts[1],
            library: nameParts[0],
            code: JSON.stringify(graph.toJSON()),
            language: 'json'
          });
        });
        return;
      }
      path = window.require.resolve(component);
      if (!path) {
        return callback(new Error("Component " + name + " is not resolvable to a path"));
      }
      return callback(null, {
        name: nameParts[1],
        library: nameParts[0],
        code: window.require.modules[path].toString(),
        language: utils.guessLanguageFromFilename(component)
      });
    };

    ComponentLoader.prototype.clear = function() {
      this.components = null;
      this.checked = [];
      this.revalidate = true;
      this.ready = false;
      return this.processing = false;
    };

    return ComponentLoader;

  })(EventEmitter);

  exports.ComponentLoader = ComponentLoader;

}).call(this);

}).call(this,require('_process'))
},{"./Graph":27,"./InternalSocket":30,"./Utils":40,"_process":12,"events":9}],27:[function(require,module,exports){
(function() {
  var EventEmitter, Graph, clone, mergeResolveTheirsNaive, platform, resetGraph,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  clone = require('./Utils').clone;

  platform = require('./Platform');

  Graph = (function(_super) {
    __extends(Graph, _super);

    Graph.prototype.name = '';

    Graph.prototype.properties = {};

    Graph.prototype.nodes = [];

    Graph.prototype.edges = [];

    Graph.prototype.initializers = [];

    Graph.prototype.exports = [];

    Graph.prototype.inports = {};

    Graph.prototype.outports = {};

    Graph.prototype.groups = [];

    function Graph(name) {
      this.name = name != null ? name : '';
      this.properties = {};
      this.nodes = [];
      this.edges = [];
      this.initializers = [];
      this.exports = [];
      this.inports = {};
      this.outports = {};
      this.groups = [];
      this.transaction = {
        id: null,
        depth: 0
      };
    }

    Graph.prototype.startTransaction = function(id, metadata) {
      if (this.transaction.id) {
        throw Error("Nested transactions not supported");
      }
      this.transaction.id = id;
      this.transaction.depth = 1;
      return this.emit('startTransaction', id, metadata);
    };

    Graph.prototype.endTransaction = function(id, metadata) {
      if (!this.transaction.id) {
        throw Error("Attempted to end non-existing transaction");
      }
      this.transaction.id = null;
      this.transaction.depth = 0;
      return this.emit('endTransaction', id, metadata);
    };

    Graph.prototype.checkTransactionStart = function() {
      if (!this.transaction.id) {
        return this.startTransaction('implicit');
      } else if (this.transaction.id === 'implicit') {
        return this.transaction.depth += 1;
      }
    };

    Graph.prototype.checkTransactionEnd = function() {
      if (this.transaction.id === 'implicit') {
        this.transaction.depth -= 1;
      }
      if (this.transaction.depth === 0) {
        return this.endTransaction('implicit');
      }
    };

    Graph.prototype.setProperties = function(properties) {
      var before, item, val;
      this.checkTransactionStart();
      before = clone(this.properties);
      for (item in properties) {
        val = properties[item];
        this.properties[item] = val;
      }
      this.emit('changeProperties', this.properties, before);
      return this.checkTransactionEnd();
    };

    Graph.prototype.addExport = function(publicPort, nodeKey, portKey, metadata) {
      var exported;
      if (metadata == null) {
        metadata = {
          x: 0,
          y: 0
        };
      }
      if (!this.getNode(nodeKey)) {
        return;
      }
      this.checkTransactionStart();
      exported = {
        "public": publicPort,
        process: nodeKey,
        port: portKey,
        metadata: metadata
      };
      this.exports.push(exported);
      this.emit('addExport', exported);
      return this.checkTransactionEnd();
    };

    Graph.prototype.removeExport = function(publicPort) {
      var exported, found, idx, _i, _len, _ref;
      publicPort = publicPort.toLowerCase();
      found = null;
      _ref = this.exports;
      for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
        exported = _ref[idx];
        if (exported["public"] === publicPort) {
          found = exported;
        }
      }
      if (!found) {
        return;
      }
      this.checkTransactionStart();
      this.exports.splice(this.exports.indexOf(found), 1);
      this.emit('removeExport', found);
      return this.checkTransactionEnd();
    };

    Graph.prototype.addInport = function(publicPort, nodeKey, portKey, metadata) {
      if (!this.getNode(nodeKey)) {
        return;
      }
      this.checkTransactionStart();
      this.inports[publicPort] = {
        process: nodeKey,
        port: portKey,
        metadata: metadata
      };
      this.emit('addInport', publicPort, this.inports[publicPort]);
      return this.checkTransactionEnd();
    };

    Graph.prototype.removeInport = function(publicPort) {
      var port;
      publicPort = publicPort.toLowerCase();
      if (!this.inports[publicPort]) {
        return;
      }
      this.checkTransactionStart();
      port = this.inports[publicPort];
      this.setInportMetadata(publicPort, {});
      delete this.inports[publicPort];
      this.emit('removeInport', publicPort, port);
      return this.checkTransactionEnd();
    };

    Graph.prototype.renameInport = function(oldPort, newPort) {
      if (!this.inports[oldPort]) {
        return;
      }
      this.checkTransactionStart();
      this.inports[newPort] = this.inports[oldPort];
      delete this.inports[oldPort];
      this.emit('renameInport', oldPort, newPort);
      return this.checkTransactionEnd();
    };

    Graph.prototype.setInportMetadata = function(publicPort, metadata) {
      var before, item, val;
      if (!this.inports[publicPort]) {
        return;
      }
      this.checkTransactionStart();
      before = clone(this.inports[publicPort].metadata);
      if (!this.inports[publicPort].metadata) {
        this.inports[publicPort].metadata = {};
      }
      for (item in metadata) {
        val = metadata[item];
        if (val != null) {
          this.inports[publicPort].metadata[item] = val;
        } else {
          delete this.inports[publicPort].metadata[item];
        }
      }
      this.emit('changeInport', publicPort, this.inports[publicPort], before);
      return this.checkTransactionEnd();
    };

    Graph.prototype.addOutport = function(publicPort, nodeKey, portKey, metadata) {
      if (!this.getNode(nodeKey)) {
        return;
      }
      this.checkTransactionStart();
      this.outports[publicPort] = {
        process: nodeKey,
        port: portKey,
        metadata: metadata
      };
      this.emit('addOutport', publicPort, this.outports[publicPort]);
      return this.checkTransactionEnd();
    };

    Graph.prototype.removeOutport = function(publicPort) {
      var port;
      publicPort = publicPort.toLowerCase();
      if (!this.outports[publicPort]) {
        return;
      }
      this.checkTransactionStart();
      port = this.outports[publicPort];
      this.setOutportMetadata(publicPort, {});
      delete this.outports[publicPort];
      this.emit('removeOutport', publicPort, port);
      return this.checkTransactionEnd();
    };

    Graph.prototype.renameOutport = function(oldPort, newPort) {
      if (!this.outports[oldPort]) {
        return;
      }
      this.checkTransactionStart();
      this.outports[newPort] = this.outports[oldPort];
      delete this.outports[oldPort];
      this.emit('renameOutport', oldPort, newPort);
      return this.checkTransactionEnd();
    };

    Graph.prototype.setOutportMetadata = function(publicPort, metadata) {
      var before, item, val;
      if (!this.outports[publicPort]) {
        return;
      }
      this.checkTransactionStart();
      before = clone(this.outports[publicPort].metadata);
      if (!this.outports[publicPort].metadata) {
        this.outports[publicPort].metadata = {};
      }
      for (item in metadata) {
        val = metadata[item];
        if (val != null) {
          this.outports[publicPort].metadata[item] = val;
        } else {
          delete this.outports[publicPort].metadata[item];
        }
      }
      this.emit('changeOutport', publicPort, this.outports[publicPort], before);
      return this.checkTransactionEnd();
    };

    Graph.prototype.addGroup = function(group, nodes, metadata) {
      var g;
      this.checkTransactionStart();
      g = {
        name: group,
        nodes: nodes,
        metadata: metadata
      };
      this.groups.push(g);
      this.emit('addGroup', g);
      return this.checkTransactionEnd();
    };

    Graph.prototype.renameGroup = function(oldName, newName) {
      var group, _i, _len, _ref;
      this.checkTransactionStart();
      _ref = this.groups;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        group = _ref[_i];
        if (!group) {
          continue;
        }
        if (group.name !== oldName) {
          continue;
        }
        group.name = newName;
        this.emit('renameGroup', oldName, newName);
      }
      return this.checkTransactionEnd();
    };

    Graph.prototype.removeGroup = function(groupName) {
      var group, _i, _len, _ref;
      this.checkTransactionStart();
      _ref = this.groups;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        group = _ref[_i];
        if (!group) {
          continue;
        }
        if (group.name !== groupName) {
          continue;
        }
        this.setGroupMetadata(group.name, {});
        this.groups.splice(this.groups.indexOf(group), 1);
        this.emit('removeGroup', group);
      }
      return this.checkTransactionEnd();
    };

    Graph.prototype.setGroupMetadata = function(groupName, metadata) {
      var before, group, item, val, _i, _len, _ref;
      this.checkTransactionStart();
      _ref = this.groups;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        group = _ref[_i];
        if (!group) {
          continue;
        }
        if (group.name !== groupName) {
          continue;
        }
        before = clone(group.metadata);
        for (item in metadata) {
          val = metadata[item];
          if (val != null) {
            group.metadata[item] = val;
          } else {
            delete group.metadata[item];
          }
        }
        this.emit('changeGroup', group, before);
      }
      return this.checkTransactionEnd();
    };

    Graph.prototype.addNode = function(id, component, metadata) {
      var node;
      this.checkTransactionStart();
      if (!metadata) {
        metadata = {};
      }
      node = {
        id: id,
        component: component,
        metadata: metadata
      };
      this.nodes.push(node);
      this.emit('addNode', node);
      this.checkTransactionEnd();
      return node;
    };

    Graph.prototype.removeNode = function(id) {
      var edge, exported, group, index, initializer, node, priv, pub, toRemove, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _q, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      node = this.getNode(id);
      if (!node) {
        return;
      }
      this.checkTransactionStart();
      toRemove = [];
      _ref = this.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        edge = _ref[_i];
        if ((edge.from.node === node.id) || (edge.to.node === node.id)) {
          toRemove.push(edge);
        }
      }
      for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
        edge = toRemove[_j];
        this.removeEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port);
      }
      toRemove = [];
      _ref1 = this.initializers;
      for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
        initializer = _ref1[_k];
        if (initializer.to.node === node.id) {
          toRemove.push(initializer);
        }
      }
      for (_l = 0, _len3 = toRemove.length; _l < _len3; _l++) {
        initializer = toRemove[_l];
        this.removeInitial(initializer.to.node, initializer.to.port);
      }
      toRemove = [];
      _ref2 = this.exports;
      for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
        exported = _ref2[_m];
        if (id.toLowerCase() === exported.process) {
          toRemove.push(exported);
        }
      }
      for (_n = 0, _len5 = toRemove.length; _n < _len5; _n++) {
        exported = toRemove[_n];
        this.removeExports(exported["public"]);
      }
      toRemove = [];
      _ref3 = this.inports;
      for (pub in _ref3) {
        priv = _ref3[pub];
        if (priv.process === id) {
          toRemove.push(pub);
        }
      }
      for (_o = 0, _len6 = toRemove.length; _o < _len6; _o++) {
        pub = toRemove[_o];
        this.removeInport(pub);
      }
      toRemove = [];
      _ref4 = this.outports;
      for (pub in _ref4) {
        priv = _ref4[pub];
        if (priv.process === id) {
          toRemove.push(pub);
        }
      }
      for (_p = 0, _len7 = toRemove.length; _p < _len7; _p++) {
        pub = toRemove[_p];
        this.removeOutport(pub);
      }
      _ref5 = this.groups;
      for (_q = 0, _len8 = _ref5.length; _q < _len8; _q++) {
        group = _ref5[_q];
        if (!group) {
          continue;
        }
        index = group.nodes.indexOf(id);
        if (index === -1) {
          continue;
        }
        group.nodes.splice(index, 1);
      }
      this.setNodeMetadata(id, {});
      if (-1 !== this.nodes.indexOf(node)) {
        this.nodes.splice(this.nodes.indexOf(node), 1);
      }
      this.emit('removeNode', node);
      return this.checkTransactionEnd();
    };

    Graph.prototype.getNode = function(id) {
      var node, _i, _len, _ref;
      _ref = this.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (!node) {
          continue;
        }
        if (node.id === id) {
          return node;
        }
      }
      return null;
    };

    Graph.prototype.renameNode = function(oldId, newId) {
      var edge, exported, group, iip, index, node, priv, pub, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      this.checkTransactionStart();
      node = this.getNode(oldId);
      if (!node) {
        return;
      }
      node.id = newId;
      _ref = this.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        edge = _ref[_i];
        if (!edge) {
          continue;
        }
        if (edge.from.node === oldId) {
          edge.from.node = newId;
        }
        if (edge.to.node === oldId) {
          edge.to.node = newId;
        }
      }
      _ref1 = this.initializers;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        iip = _ref1[_j];
        if (!iip) {
          continue;
        }
        if (iip.to.node === oldId) {
          iip.to.node = newId;
        }
      }
      _ref2 = this.inports;
      for (pub in _ref2) {
        priv = _ref2[pub];
        if (priv.process === oldId) {
          priv.process = newId;
        }
      }
      _ref3 = this.outports;
      for (pub in _ref3) {
        priv = _ref3[pub];
        if (priv.process === oldId) {
          priv.process = newId;
        }
      }
      _ref4 = this.exports;
      for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
        exported = _ref4[_k];
        if (exported.process === oldId) {
          exported.process = newId;
        }
      }
      _ref5 = this.groups;
      for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
        group = _ref5[_l];
        if (!group) {
          continue;
        }
        index = group.nodes.indexOf(oldId);
        if (index === -1) {
          continue;
        }
        group.nodes[index] = newId;
      }
      this.emit('renameNode', oldId, newId);
      return this.checkTransactionEnd();
    };

    Graph.prototype.setNodeMetadata = function(id, metadata) {
      var before, item, node, val;
      node = this.getNode(id);
      if (!node) {
        return;
      }
      this.checkTransactionStart();
      before = clone(node.metadata);
      if (!node.metadata) {
        node.metadata = {};
      }
      for (item in metadata) {
        val = metadata[item];
        if (val != null) {
          node.metadata[item] = val;
        } else {
          delete node.metadata[item];
        }
      }
      this.emit('changeNode', node, before);
      return this.checkTransactionEnd();
    };

    Graph.prototype.addEdge = function(outNode, outPort, inNode, inPort, metadata) {
      var edge, _i, _len, _ref;
      if (metadata == null) {
        metadata = {};
      }
      _ref = this.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        edge = _ref[_i];
        if (edge.from.node === outNode && edge.from.port === outPort && edge.to.node === inNode && edge.to.port === inPort) {
          return;
        }
      }
      if (!this.getNode(outNode)) {
        return;
      }
      if (!this.getNode(inNode)) {
        return;
      }
      this.checkTransactionStart();
      edge = {
        from: {
          node: outNode,
          port: outPort
        },
        to: {
          node: inNode,
          port: inPort
        },
        metadata: metadata
      };
      this.edges.push(edge);
      this.emit('addEdge', edge);
      this.checkTransactionEnd();
      return edge;
    };

    Graph.prototype.addEdgeIndex = function(outNode, outPort, outIndex, inNode, inPort, inIndex, metadata) {
      var edge;
      if (metadata == null) {
        metadata = {};
      }
      if (!this.getNode(outNode)) {
        return;
      }
      if (!this.getNode(inNode)) {
        return;
      }
      if (inIndex === null) {
        inIndex = void 0;
      }
      if (outIndex === null) {
        outIndex = void 0;
      }
      if (!metadata) {
        metadata = {};
      }
      this.checkTransactionStart();
      edge = {
        from: {
          node: outNode,
          port: outPort,
          index: outIndex
        },
        to: {
          node: inNode,
          port: inPort,
          index: inIndex
        },
        metadata: metadata
      };
      this.edges.push(edge);
      this.emit('addEdge', edge);
      this.checkTransactionEnd();
      return edge;
    };

    Graph.prototype.removeEdge = function(node, port, node2, port2) {
      var edge, index, toKeep, toRemove, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      this.checkTransactionStart();
      toRemove = [];
      toKeep = [];
      if (node2 && port2) {
        _ref = this.edges;
        for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
          edge = _ref[index];
          if (edge.from.node === node && edge.from.port === port && edge.to.node === node2 && edge.to.port === port2) {
            this.setEdgeMetadata(edge.from.node, edge.from.port, edge.to.node, edge.to.port, {});
            toRemove.push(edge);
          } else {
            toKeep.push(edge);
          }
        }
      } else {
        _ref1 = this.edges;
        for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
          edge = _ref1[index];
          if ((edge.from.node === node && edge.from.port === port) || (edge.to.node === node && edge.to.port === port)) {
            this.setEdgeMetadata(edge.from.node, edge.from.port, edge.to.node, edge.to.port, {});
            toRemove.push(edge);
          } else {
            toKeep.push(edge);
          }
        }
      }
      this.edges = toKeep;
      for (_k = 0, _len2 = toRemove.length; _k < _len2; _k++) {
        edge = toRemove[_k];
        this.emit('removeEdge', edge);
      }
      return this.checkTransactionEnd();
    };

    Graph.prototype.getEdge = function(node, port, node2, port2) {
      var edge, index, _i, _len, _ref;
      _ref = this.edges;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        edge = _ref[index];
        if (!edge) {
          continue;
        }
        if (edge.from.node === node && edge.from.port === port) {
          if (edge.to.node === node2 && edge.to.port === port2) {
            return edge;
          }
        }
      }
      return null;
    };

    Graph.prototype.setEdgeMetadata = function(node, port, node2, port2, metadata) {
      var before, edge, item, val;
      edge = this.getEdge(node, port, node2, port2);
      if (!edge) {
        return;
      }
      this.checkTransactionStart();
      before = clone(edge.metadata);
      if (!edge.metadata) {
        edge.metadata = {};
      }
      for (item in metadata) {
        val = metadata[item];
        if (val != null) {
          edge.metadata[item] = val;
        } else {
          delete edge.metadata[item];
        }
      }
      this.emit('changeEdge', edge, before);
      return this.checkTransactionEnd();
    };

    Graph.prototype.addInitial = function(data, node, port, metadata) {
      var initializer;
      if (!this.getNode(node)) {
        return;
      }
      this.checkTransactionStart();
      initializer = {
        from: {
          data: data
        },
        to: {
          node: node,
          port: port
        },
        metadata: metadata
      };
      this.initializers.push(initializer);
      this.emit('addInitial', initializer);
      this.checkTransactionEnd();
      return initializer;
    };

    Graph.prototype.addInitialIndex = function(data, node, port, index, metadata) {
      var initializer;
      if (!this.getNode(node)) {
        return;
      }
      if (index === null) {
        index = void 0;
      }
      this.checkTransactionStart();
      initializer = {
        from: {
          data: data
        },
        to: {
          node: node,
          port: port,
          index: index
        },
        metadata: metadata
      };
      this.initializers.push(initializer);
      this.emit('addInitial', initializer);
      this.checkTransactionEnd();
      return initializer;
    };

    Graph.prototype.addGraphInitial = function(data, node, metadata) {
      var inport;
      inport = this.inports[node];
      if (!inport) {
        return;
      }
      return this.addInitial(data, inport.process, inport.port, metadata);
    };

    Graph.prototype.addGraphInitialIndex = function(data, node, index, metadata) {
      var inport;
      inport = this.inports[node];
      if (!inport) {
        return;
      }
      return this.addInitialIndex(data, inport.process, inport.port, index, metadata);
    };

    Graph.prototype.removeInitial = function(node, port) {
      var edge, index, toKeep, toRemove, _i, _j, _len, _len1, _ref;
      this.checkTransactionStart();
      toRemove = [];
      toKeep = [];
      _ref = this.initializers;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        edge = _ref[index];
        if (edge.to.node === node && edge.to.port === port) {
          toRemove.push(edge);
        } else {
          toKeep.push(edge);
        }
      }
      this.initializers = toKeep;
      for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
        edge = toRemove[_j];
        this.emit('removeInitial', edge);
      }
      return this.checkTransactionEnd();
    };

    Graph.prototype.removeGraphInitial = function(node) {
      var inport;
      inport = this.inports[node];
      if (!inport) {
        return;
      }
      return this.removeInitial(inport.process, inport.port);
    };

    Graph.prototype.toDOT = function() {
      var cleanID, cleanPort, data, dot, edge, id, initializer, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      cleanID = function(id) {
        return id.replace(/\s*/g, "");
      };
      cleanPort = function(port) {
        return port.replace(/\./g, "");
      };
      dot = "digraph {\n";
      _ref = this.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        dot += "    " + (cleanID(node.id)) + " [label=" + node.id + " shape=box]\n";
      }
      _ref1 = this.initializers;
      for (id = _j = 0, _len1 = _ref1.length; _j < _len1; id = ++_j) {
        initializer = _ref1[id];
        if (typeof initializer.from.data === 'function') {
          data = 'Function';
        } else {
          data = initializer.from.data;
        }
        dot += "    data" + id + " [label=\"'" + data + "'\" shape=plaintext]\n";
        dot += "    data" + id + " -> " + (cleanID(initializer.to.node)) + "[headlabel=" + (cleanPort(initializer.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
      }
      _ref2 = this.edges;
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        edge = _ref2[_k];
        dot += "    " + (cleanID(edge.from.node)) + " -> " + (cleanID(edge.to.node)) + "[taillabel=" + (cleanPort(edge.from.port)) + " headlabel=" + (cleanPort(edge.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
      }
      dot += "}";
      return dot;
    };

    Graph.prototype.toYUML = function() {
      var edge, initializer, yuml, _i, _j, _len, _len1, _ref, _ref1;
      yuml = [];
      _ref = this.initializers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        initializer = _ref[_i];
        yuml.push("(start)[" + initializer.to.port + "]->(" + initializer.to.node + ")");
      }
      _ref1 = this.edges;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        edge = _ref1[_j];
        yuml.push("(" + edge.from.node + ")[" + edge.from.port + "]->(" + edge.to.node + ")");
      }
      return yuml.join(",");
    };

    Graph.prototype.toJSON = function() {
      var connection, edge, exported, group, groupData, initializer, json, node, priv, property, pub, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      json = {
        properties: {},
        inports: {},
        outports: {},
        groups: [],
        processes: {},
        connections: []
      };
      if (this.name) {
        json.properties.name = this.name;
      }
      _ref = this.properties;
      for (property in _ref) {
        value = _ref[property];
        json.properties[property] = value;
      }
      _ref1 = this.inports;
      for (pub in _ref1) {
        priv = _ref1[pub];
        json.inports[pub] = priv;
      }
      _ref2 = this.outports;
      for (pub in _ref2) {
        priv = _ref2[pub];
        json.outports[pub] = priv;
      }
      _ref3 = this.exports;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        exported = _ref3[_i];
        if (!json.exports) {
          json.exports = [];
        }
        json.exports.push(exported);
      }
      _ref4 = this.groups;
      for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
        group = _ref4[_j];
        groupData = {
          name: group.name,
          nodes: group.nodes
        };
        if (Object.keys(group.metadata).length) {
          groupData.metadata = group.metadata;
        }
        json.groups.push(groupData);
      }
      _ref5 = this.nodes;
      for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
        node = _ref5[_k];
        json.processes[node.id] = {
          component: node.component
        };
        if (node.metadata) {
          json.processes[node.id].metadata = node.metadata;
        }
      }
      _ref6 = this.edges;
      for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
        edge = _ref6[_l];
        connection = {
          src: {
            process: edge.from.node,
            port: edge.from.port,
            index: edge.from.index
          },
          tgt: {
            process: edge.to.node,
            port: edge.to.port,
            index: edge.to.index
          }
        };
        if (Object.keys(edge.metadata).length) {
          connection.metadata = edge.metadata;
        }
        json.connections.push(connection);
      }
      _ref7 = this.initializers;
      for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
        initializer = _ref7[_m];
        json.connections.push({
          data: initializer.from.data,
          tgt: {
            process: initializer.to.node,
            port: initializer.to.port,
            index: initializer.to.index
          }
        });
      }
      return json;
    };

    Graph.prototype.save = function(file, success) {
      var json;
      json = JSON.stringify(this.toJSON(), null, 4);
      return require('fs').writeFile("" + file + ".json", json, "utf-8", function(err, data) {
        if (err) {
          throw err;
        }
        return success(file);
      });
    };

    return Graph;

  })(EventEmitter);

  exports.Graph = Graph;

  exports.createGraph = function(name) {
    return new Graph(name);
  };

  exports.loadJSON = function(definition, success, metadata) {
    var conn, def, exported, graph, group, id, portId, priv, processId, properties, property, pub, split, value, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
    if (metadata == null) {
      metadata = {};
    }
    if (typeof definition === 'string') {
      definition = JSON.parse(definition);
    }
    if (!definition.properties) {
      definition.properties = {};
    }
    if (!definition.processes) {
      definition.processes = {};
    }
    if (!definition.connections) {
      definition.connections = [];
    }
    graph = new Graph(definition.properties.name);
    graph.startTransaction('loadJSON', metadata);
    properties = {};
    _ref = definition.properties;
    for (property in _ref) {
      value = _ref[property];
      if (property === 'name') {
        continue;
      }
      properties[property] = value;
    }
    graph.setProperties(properties);
    _ref1 = definition.processes;
    for (id in _ref1) {
      def = _ref1[id];
      if (!def.metadata) {
        def.metadata = {};
      }
      graph.addNode(id, def.component, def.metadata);
    }
    _ref2 = definition.connections;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      conn = _ref2[_i];
      metadata = conn.metadata ? conn.metadata : {};
      if (conn.data !== void 0) {
        if (typeof conn.tgt.index === 'number') {
          graph.addInitialIndex(conn.data, conn.tgt.process, conn.tgt.port.toLowerCase(), conn.tgt.index, metadata);
        } else {
          graph.addInitial(conn.data, conn.tgt.process, conn.tgt.port.toLowerCase(), metadata);
        }
        continue;
      }
      if (typeof conn.src.index === 'number' || typeof conn.tgt.index === 'number') {
        graph.addEdgeIndex(conn.src.process, conn.src.port.toLowerCase(), conn.src.index, conn.tgt.process, conn.tgt.port.toLowerCase(), conn.tgt.index, metadata);
        continue;
      }
      graph.addEdge(conn.src.process, conn.src.port.toLowerCase(), conn.tgt.process, conn.tgt.port.toLowerCase(), metadata);
    }
    if (definition.exports && definition.exports.length) {
      _ref3 = definition.exports;
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        exported = _ref3[_j];
        if (exported["private"]) {
          split = exported["private"].split('.');
          if (split.length !== 2) {
            continue;
          }
          processId = split[0];
          portId = split[1];
          for (id in definition.processes) {
            if (id.toLowerCase() === processId.toLowerCase()) {
              processId = id;
            }
          }
        } else {
          processId = exported.process;
          portId = exported.port;
        }
        graph.addExport(exported["public"], processId, portId, exported.metadata);
      }
    }
    if (definition.inports) {
      _ref4 = definition.inports;
      for (pub in _ref4) {
        priv = _ref4[pub];
        graph.addInport(pub, priv.process, priv.port, priv.metadata);
      }
    }
    if (definition.outports) {
      _ref5 = definition.outports;
      for (pub in _ref5) {
        priv = _ref5[pub];
        graph.addOutport(pub, priv.process, priv.port, priv.metadata);
      }
    }
    if (definition.groups) {
      _ref6 = definition.groups;
      for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
        group = _ref6[_k];
        graph.addGroup(group.name, group.nodes, group.metadata || {});
      }
    }
    graph.endTransaction('loadJSON');
    return success(graph);
  };

  exports.loadFBP = function(fbpData, success) {
    var definition;
    definition = require('fbp').parse(fbpData);
    return exports.loadJSON(definition, success);
  };

  exports.loadHTTP = function(url, success) {
    var req;
    req = new XMLHttpRequest;
    req.onreadystatechange = function() {
      if (req.readyState !== 4) {
        return;
      }
      if (req.status !== 200) {
        return success();
      }
      return success(req.responseText);
    };
    req.open('GET', url, true);
    return req.send();
  };

  exports.loadFile = function(file, success, metadata) {
    var definition, e;
    if (metadata == null) {
      metadata = {};
    }
    if (platform.isBrowser()) {
      try {
        definition = require(file);
      } catch (_error) {
        e = _error;
        exports.loadHTTP(file, function(data) {
          if (!data) {
            throw new Error("Failed to load graph " + file);
            return;
          }
          if (file.split('.').pop() === 'fbp') {
            return exports.loadFBP(data, success, metadata);
          }
          definition = JSON.parse(data);
          return exports.loadJSON(definition, success, metadata);
        });
        return;
      }
      exports.loadJSON(definition, success, metadata);
      return;
    }
    return require('fs').readFile(file, "utf-8", function(err, data) {
      if (err) {
        throw err;
      }
      if (file.split('.').pop() === 'fbp') {
        return exports.loadFBP(data, success);
      }
      definition = JSON.parse(data);
      return exports.loadJSON(definition, success);
    });
  };

  resetGraph = function(graph) {
    var edge, exp, group, iip, node, port, v, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
    _ref = (clone(graph.groups)).reverse();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      group = _ref[_i];
      if (group != null) {
        graph.removeGroup(group.name);
      }
    }
    _ref1 = clone(graph.outports);
    for (port in _ref1) {
      v = _ref1[port];
      graph.removeOutport(port);
    }
    _ref2 = clone(graph.inports);
    for (port in _ref2) {
      v = _ref2[port];
      graph.removeInport(port);
    }
    _ref3 = clone(graph.exports.reverse());
    for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
      exp = _ref3[_j];
      graph.removeExports(exp["public"]);
    }
    graph.setProperties({});
    _ref4 = (clone(graph.initializers)).reverse();
    for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
      iip = _ref4[_k];
      graph.removeInitial(iip.to.node, iip.to.port);
    }
    _ref5 = (clone(graph.edges)).reverse();
    for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
      edge = _ref5[_l];
      graph.removeEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port);
    }
    _ref6 = (clone(graph.nodes)).reverse();
    _results = [];
    for (_m = 0, _len4 = _ref6.length; _m < _len4; _m++) {
      node = _ref6[_m];
      _results.push(graph.removeNode(node.id));
    }
    return _results;
  };

  mergeResolveTheirsNaive = function(base, to) {
    var edge, exp, group, iip, node, priv, pub, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
    resetGraph(base);
    _ref = to.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      base.addNode(node.id, node.component, node.metadata);
    }
    _ref1 = to.edges;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      edge = _ref1[_j];
      base.addEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port, edge.metadata);
    }
    _ref2 = to.initializers;
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      iip = _ref2[_k];
      base.addInitial(iip.from.data, iip.to.node, iip.to.port, iip.metadata);
    }
    _ref3 = to.exports;
    for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
      exp = _ref3[_l];
      base.addExport(exp["public"], exp.node, exp.port, exp.metadata);
    }
    base.setProperties(to.properties);
    _ref4 = to.inports;
    for (pub in _ref4) {
      priv = _ref4[pub];
      base.addInport(pub, priv.process, priv.port, priv.metadata);
    }
    _ref5 = to.outports;
    for (pub in _ref5) {
      priv = _ref5[pub];
      base.addOutport(pub, priv.process, priv.port, priv.metadata);
    }
    _ref6 = to.groups;
    _results = [];
    for (_m = 0, _len4 = _ref6.length; _m < _len4; _m++) {
      group = _ref6[_m];
      _results.push(base.addGroup(group.name, group.nodes, group.metadata));
    }
    return _results;
  };

  exports.equivalent = function(a, b, options) {
    var A, B;
    if (options == null) {
      options = {};
    }
    A = JSON.stringify(a);
    B = JSON.stringify(b);
    return A === B;
  };

  exports.mergeResolveTheirs = mergeResolveTheirsNaive;

}).call(this);

},{"./Platform":36,"./Utils":40,"events":9,"fbp":53,"fs":2}],28:[function(require,module,exports){
(function() {
  var InternalSocket, StreamReceiver, StreamSender, isArray, _,
    __hasProp = {}.hasOwnProperty;

  _ = require('underscore');

  StreamSender = require('./Streams').StreamSender;

  StreamReceiver = require('./Streams').StreamReceiver;

  InternalSocket = require('./InternalSocket');

  isArray = function(obj) {
    if (Array.isArray) {
      return Array.isArray(obj);
    }
    return Object.prototype.toString.call(arg) === '[object Array]';
  };

  exports.MapComponent = function(component, func, config) {
    var groups, inPort, outPort;
    if (!config) {
      config = {};
    }
    if (!config.inPort) {
      config.inPort = 'in';
    }
    if (!config.outPort) {
      config.outPort = 'out';
    }
    inPort = component.inPorts[config.inPort];
    outPort = component.outPorts[config.outPort];
    groups = [];
    return inPort.process = function(event, payload) {
      switch (event) {
        case 'connect':
          return outPort.connect();
        case 'begingroup':
          groups.push(payload);
          return outPort.beginGroup(payload);
        case 'data':
          return func(payload, groups, outPort);
        case 'endgroup':
          groups.pop();
          return outPort.endGroup();
        case 'disconnect':
          groups = [];
          return outPort.disconnect();
      }
    };
  };

  exports.WirePattern = function(component, config, proc) {
    var baseShutdown, closeGroupOnOuts, collectGroups, disconnectOuts, gc, inPorts, name, outPorts, port, processQueue, resumeTaskQ, sendGroupToOuts, _fn, _fn1, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1;
    inPorts = 'in' in config ? config["in"] : 'in';
    if (!isArray(inPorts)) {
      inPorts = [inPorts];
    }
    outPorts = 'out' in config ? config.out : 'out';
    if (!isArray(outPorts)) {
      outPorts = [outPorts];
    }
    if (!('error' in config)) {
      config.error = 'error';
    }
    if (!('async' in config)) {
      config.async = false;
    }
    if (!('ordered' in config)) {
      config.ordered = true;
    }
    if (!('group' in config)) {
      config.group = false;
    }
    if (!('field' in config)) {
      config.field = null;
    }
    if (!('forwardGroups' in config)) {
      config.forwardGroups = false;
    }
    if (!('receiveStreams' in config)) {
      config.receiveStreams = false;
    }
    if (typeof config.receiveStreams === 'string') {
      config.receiveStreams = [config.receiveStreams];
    }
    if (!('sendStreams' in config)) {
      config.sendStreams = false;
    }
    if (typeof config.sendStreams === 'string') {
      config.sendStreams = [config.sendStreams];
    }
    if (config.async) {
      config.sendStreams = outPorts;
    }
    if (!('params' in config)) {
      config.params = [];
    }
    if (typeof config.params === 'string') {
      config.params = [config.params];
    }
    if (!('name' in config)) {
      config.name = '';
    }
    if (!('dropInput' in config)) {
      config.dropInput = false;
    }
    if (!('arrayPolicy' in config)) {
      config.arrayPolicy = {
        "in": 'any',
        params: 'all'
      };
    }
    if (!('gcFrequency' in config)) {
      config.gcFrequency = 100;
    }
    if (!('gcTimeout' in config)) {
      config.gcTimeout = 300;
    }
    collectGroups = config.forwardGroups;
    if (typeof collectGroups === 'boolean' && !config.group) {
      collectGroups = inPorts;
    }
    if (typeof collectGroups === 'string' && !config.group) {
      collectGroups = [collectGroups];
    }
    if (collectGroups !== false && config.group) {
      collectGroups = true;
    }
    for (_i = 0, _len = inPorts.length; _i < _len; _i++) {
      name = inPorts[_i];
      if (!component.inPorts[name]) {
        throw new Error("no inPort named '" + name + "'");
      }
    }
    for (_j = 0, _len1 = outPorts.length; _j < _len1; _j++) {
      name = outPorts[_j];
      if (!component.outPorts[name]) {
        throw new Error("no outPort named '" + name + "'");
      }
    }
    component.groupedData = {};
    component.groupedGroups = {};
    component.groupedDisconnects = {};
    disconnectOuts = function() {
      var p, _k, _len2, _results;
      _results = [];
      for (_k = 0, _len2 = outPorts.length; _k < _len2; _k++) {
        p = outPorts[_k];
        if (component.outPorts[p].isConnected()) {
          _results.push(component.outPorts[p].disconnect());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };
    sendGroupToOuts = function(grp) {
      var p, _k, _len2, _results;
      _results = [];
      for (_k = 0, _len2 = outPorts.length; _k < _len2; _k++) {
        p = outPorts[_k];
        _results.push(component.outPorts[p].beginGroup(grp));
      }
      return _results;
    };
    closeGroupOnOuts = function(grp) {
      var p, _k, _len2, _results;
      _results = [];
      for (_k = 0, _len2 = outPorts.length; _k < _len2; _k++) {
        p = outPorts[_k];
        _results.push(component.outPorts[p].endGroup(grp));
      }
      return _results;
    };
    component.outputQ = [];
    processQueue = function() {
      var flushed, key, stream, streams, tmp;
      while (component.outputQ.length > 0) {
        streams = component.outputQ[0];
        flushed = false;
        if (streams === null) {
          disconnectOuts();
          flushed = true;
        } else {
          if (outPorts.length === 1) {
            tmp = {};
            tmp[outPorts[0]] = streams;
            streams = tmp;
          }
          for (key in streams) {
            stream = streams[key];
            if (stream.resolved) {
              stream.flush();
              flushed = true;
            }
          }
        }
        if (flushed) {
          component.outputQ.shift();
        }
        if (!flushed) {
          return;
        }
      }
    };
    if (config.async) {
      if ('load' in component.outPorts) {
        component.load = 0;
      }
      component.beforeProcess = function(outs) {
        if (config.ordered) {
          component.outputQ.push(outs);
        }
        component.load++;
        if ('load' in component.outPorts && component.outPorts.load.isAttached()) {
          component.outPorts.load.send(component.load);
          return component.outPorts.load.disconnect();
        }
      };
      component.afterProcess = function(err, outs) {
        processQueue();
        component.load--;
        if ('load' in component.outPorts && component.outPorts.load.isAttached()) {
          component.outPorts.load.send(component.load);
          return component.outPorts.load.disconnect();
        }
      };
    }
    component.taskQ = [];
    component.params = {};
    component.requiredParams = [];
    component.completeParams = [];
    component.receivedParams = [];
    component.defaultedParams = [];
    component.defaultsSent = false;
    component.sendDefaults = function() {
      var param, tempSocket, _k, _len2, _ref;
      if (component.defaultedParams.length > 0) {
        _ref = component.defaultedParams;
        for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
          param = _ref[_k];
          if (component.receivedParams.indexOf(param) === -1) {
            tempSocket = InternalSocket.createSocket();
            component.inPorts[param].attach(tempSocket);
            tempSocket.send();
            tempSocket.disconnect();
            component.inPorts[param].detach(tempSocket);
          }
        }
      }
      return component.defaultsSent = true;
    };
    resumeTaskQ = function() {
      var task, temp, _results;
      if (component.completeParams.length === component.requiredParams.length && component.taskQ.length > 0) {
        temp = component.taskQ.slice(0);
        component.taskQ = [];
        _results = [];
        while (temp.length > 0) {
          task = temp.shift();
          _results.push(task());
        }
        return _results;
      }
    };
    _ref = config.params;
    for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
      port = _ref[_k];
      if (!component.inPorts[port]) {
        throw new Error("no inPort named '" + port + "'");
      }
      if (component.inPorts[port].isRequired()) {
        component.requiredParams.push(port);
      }
      if (component.inPorts[port].hasDefault()) {
        component.defaultedParams.push(port);
      }
    }
    _ref1 = config.params;
    _fn = function(port) {
      var inPort;
      inPort = component.inPorts[port];
      return inPort.process = function(event, payload, index) {
        if (event !== 'data') {
          return;
        }
        if (inPort.isAddressable()) {
          if (!(port in component.params)) {
            component.params[port] = {};
          }
          component.params[port][index] = payload;
          if (config.arrayPolicy.params === 'all' && Object.keys(component.params[port]).length < inPort.listAttached().length) {
            return;
          }
        } else {
          component.params[port] = payload;
        }
        if (component.completeParams.indexOf(port) === -1 && component.requiredParams.indexOf(port) > -1) {
          component.completeParams.push(port);
        }
        component.receivedParams.push(port);
        return resumeTaskQ();
      };
    };
    for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
      port = _ref1[_l];
      _fn(port);
    }
    component.disconnectData = {};
    component.disconnectQ = [];
    component.groupBuffers = {};
    component.keyBuffers = {};
    component.gcTimestamps = {};
    component.dropRequest = function(key) {
      if (key in component.disconnectData) {
        delete component.disconnectData[key];
      }
      if (key in component.groupedData) {
        delete component.groupedData[key];
      }
      if (key in component.groupedGroups) {
        return delete component.groupedGroups[key];
      }
    };
    component.gcCounter = 0;
    gc = function() {
      var current, key, val, _ref2, _results;
      component.gcCounter++;
      if (component.gcCounter % config.gcFrequency === 0) {
        current = new Date().getTime();
        _ref2 = component.gcTimestamps;
        _results = [];
        for (key in _ref2) {
          val = _ref2[key];
          if ((current - val) > (config.gcTimeout * 1000)) {
            component.dropRequest(key);
            _results.push(delete component.gcTimestamps[key]);
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };
    _fn1 = function(port) {
      var inPort, needPortGroups;
      component.groupBuffers[port] = [];
      component.keyBuffers[port] = null;
      if (config.receiveStreams && config.receiveStreams.indexOf(port) !== -1) {
        inPort = new StreamReceiver(component.inPorts[port]);
      } else {
        inPort = component.inPorts[port];
      }
      needPortGroups = collectGroups instanceof Array && collectGroups.indexOf(port) !== -1;
      return inPort.process = function(event, payload, index) {
        var data, foundGroup, g, groupLength, groups, grp, i, key, obj, out, outs, postpone, postponedToQ, reqId, requiredLength, resume, task, tmp, whenDone, whenDoneGroups, _len5, _len6, _len7, _len8, _n, _o, _p, _q, _r, _ref2, _ref3, _ref4, _s;
        if (!component.groupBuffers[port]) {
          component.groupBuffers[port] = [];
        }
        switch (event) {
          case 'begingroup':
            component.groupBuffers[port].push(payload);
            if (config.forwardGroups && (collectGroups === true || needPortGroups) && !config.async) {
              return sendGroupToOuts(payload);
            }
            break;
          case 'endgroup':
            component.groupBuffers[port] = component.groupBuffers[port].slice(0, component.groupBuffers[port].length - 1);
            if (config.forwardGroups && (collectGroups === true || needPortGroups) && !config.async) {
              return closeGroupOnOuts(payload);
            }
            break;
          case 'disconnect':
            if (inPorts.length === 1) {
              if (config.async || config.StreamSender) {
                if (config.ordered) {
                  component.outputQ.push(null);
                  return processQueue();
                } else {
                  return component.disconnectQ.push(true);
                }
              } else {
                return disconnectOuts();
              }
            } else {
              foundGroup = false;
              key = component.keyBuffers[port];
              if (!(key in component.disconnectData)) {
                component.disconnectData[key] = [];
              }
              for (i = _n = 0, _ref2 = component.disconnectData[key].length; 0 <= _ref2 ? _n < _ref2 : _n > _ref2; i = 0 <= _ref2 ? ++_n : --_n) {
                if (!(port in component.disconnectData[key][i])) {
                  foundGroup = true;
                  component.disconnectData[key][i][port] = true;
                  if (Object.keys(component.disconnectData[key][i]).length === inPorts.length) {
                    component.disconnectData[key].shift();
                    if (config.async || config.StreamSender) {
                      if (config.ordered) {
                        component.outputQ.push(null);
                        processQueue();
                      } else {
                        component.disconnectQ.push(true);
                      }
                    } else {
                      disconnectOuts();
                    }
                    if (component.disconnectData[key].length === 0) {
                      delete component.disconnectData[key];
                    }
                  }
                  break;
                }
              }
              if (!foundGroup) {
                obj = {};
                obj[port] = true;
                return component.disconnectData[key].push(obj);
              }
            }
            break;
          case 'data':
            if (inPorts.length === 1 && !inPort.isAddressable()) {
              data = payload;
              groups = component.groupBuffers[port];
            } else {
              key = '';
              if (config.group && component.groupBuffers[port].length > 0) {
                key = component.groupBuffers[port].toString();
                if (config.group instanceof RegExp) {
                  reqId = null;
                  _ref3 = component.groupBuffers[port];
                  for (_o = 0, _len5 = _ref3.length; _o < _len5; _o++) {
                    grp = _ref3[_o];
                    if (config.group.test(grp)) {
                      reqId = grp;
                      break;
                    }
                  }
                  key = reqId ? reqId : '';
                }
              } else if (config.field && typeof payload === 'object' && config.field in payload) {
                key = payload[config.field];
              }
              component.keyBuffers[port] = key;
              if (!(key in component.groupedData)) {
                component.groupedData[key] = [];
              }
              if (!(key in component.groupedGroups)) {
                component.groupedGroups[key] = [];
              }
              foundGroup = false;
              requiredLength = inPorts.length;
              if (config.field) {
                ++requiredLength;
              }
              for (i = _p = 0, _ref4 = component.groupedData[key].length; 0 <= _ref4 ? _p < _ref4 : _p > _ref4; i = 0 <= _ref4 ? ++_p : --_p) {
                if (!(port in component.groupedData[key][i]) || (component.inPorts[port].isAddressable() && config.arrayPolicy["in"] === 'all' && !(index in component.groupedData[key][i][port]))) {
                  foundGroup = true;
                  if (component.inPorts[port].isAddressable()) {
                    if (!(port in component.groupedData[key][i])) {
                      component.groupedData[key][i][port] = {};
                    }
                    component.groupedData[key][i][port][index] = payload;
                  } else {
                    component.groupedData[key][i][port] = payload;
                  }
                  if (needPortGroups) {
                    component.groupedGroups[key][i] = _.union(component.groupedGroups[key][i], component.groupBuffers[port]);
                  } else if (collectGroups === true) {
                    component.groupedGroups[key][i][port] = component.groupBuffers[port];
                  }
                  if (component.inPorts[port].isAddressable() && config.arrayPolicy["in"] === 'all' && Object.keys(component.groupedData[key][i][port]).length < component.inPorts[port].listAttached().length) {
                    return;
                  }
                  groupLength = Object.keys(component.groupedData[key][i]).length;
                  if (groupLength === requiredLength) {
                    data = (component.groupedData[key].splice(i, 1))[0];
                    if (inPorts.length === 1 && inPort.isAddressable()) {
                      data = data[port];
                    }
                    groups = (component.groupedGroups[key].splice(i, 1))[0];
                    if (collectGroups === true) {
                      groups = _.intersection.apply(null, _.values(groups));
                    }
                    if (component.groupedData[key].length === 0) {
                      delete component.groupedData[key];
                    }
                    if (component.groupedGroups[key].length === 0) {
                      delete component.groupedGroups[key];
                    }
                    if (config.group && key) {
                      delete component.gcTimestamps[key];
                    }
                    break;
                  } else {
                    return;
                  }
                }
              }
              if (!foundGroup) {
                obj = {};
                if (config.field) {
                  obj[config.field] = key;
                }
                if (component.inPorts[port].isAddressable()) {
                  obj[port] = {};
                  obj[port][index] = payload;
                } else {
                  obj[port] = payload;
                }
                if (inPorts.length === 1 && component.inPorts[port].isAddressable() && (config.arrayPolicy["in"] === 'any' || component.inPorts[port].listAttached().length === 1)) {
                  data = obj[port];
                  groups = component.groupBuffers[port];
                } else {
                  component.groupedData[key].push(obj);
                  if (needPortGroups) {
                    component.groupedGroups[key].push(component.groupBuffers[port]);
                  } else if (collectGroups === true) {
                    tmp = {};
                    tmp[port] = component.groupBuffers[port];
                    component.groupedGroups[key].push(tmp);
                  } else {
                    component.groupedGroups[key].push([]);
                  }
                  if (config.group && key) {
                    component.gcTimestamps[key] = new Date().getTime();
                  }
                  return;
                }
              }
            }
            if (config.dropInput && component.completeParams.length !== component.requiredParams.length) {
              return;
            }
            outs = {};
            for (_q = 0, _len6 = outPorts.length; _q < _len6; _q++) {
              name = outPorts[_q];
              if (config.async || config.sendStreams && config.sendStreams.indexOf(name) !== -1) {
                outs[name] = new StreamSender(component.outPorts[name], config.ordered);
              } else {
                outs[name] = component.outPorts[name];
              }
            }
            if (outPorts.length === 1) {
              outs = outs[outPorts[0]];
            }
            if (!groups) {
              groups = [];
            }
            whenDoneGroups = groups.slice(0);
            whenDone = function(err) {
              var disconnect, out, outputs, _len7, _r;
              if (err) {
                component.error(err, whenDoneGroups);
              }
              if (typeof component.fail === 'function' && component.hasErrors) {
                component.fail();
              }
              outputs = outPorts.length === 1 ? {
                port: outs
              } : outs;
              disconnect = false;
              if (component.disconnectQ.length > 0) {
                component.disconnectQ.shift();
                disconnect = true;
              }
              for (name in outputs) {
                out = outputs[name];
                if (config.forwardGroups && config.async) {
                  for (_r = 0, _len7 = whenDoneGroups.length; _r < _len7; _r++) {
                    i = whenDoneGroups[_r];
                    out.endGroup();
                  }
                }
                if (disconnect) {
                  out.disconnect();
                }
                if (config.async || config.StreamSender) {
                  out.done();
                }
              }
              if (typeof component.afterProcess === 'function') {
                return component.afterProcess(err || component.hasErrors, outs);
              }
            };
            if (typeof component.beforeProcess === 'function') {
              component.beforeProcess(outs);
            }
            if (config.forwardGroups && config.async) {
              if (outPorts.length === 1) {
                for (_r = 0, _len7 = groups.length; _r < _len7; _r++) {
                  g = groups[_r];
                  outs.beginGroup(g);
                }
              } else {
                for (name in outs) {
                  out = outs[name];
                  for (_s = 0, _len8 = groups.length; _s < _len8; _s++) {
                    g = groups[_s];
                    out.beginGroup(g);
                  }
                }
              }
            }
            exports.MultiError(component, config.name, config.error, groups);
            if (config.async) {
              postpone = function() {};
              resume = function() {};
              postponedToQ = false;
              task = function() {
                return proc.call(component, data, groups, outs, whenDone, postpone, resume);
              };
              postpone = function(backToQueue) {
                if (backToQueue == null) {
                  backToQueue = true;
                }
                postponedToQ = backToQueue;
                if (backToQueue) {
                  return component.taskQ.push(task);
                }
              };
              resume = function() {
                if (postponedToQ) {
                  return resumeTaskQ();
                } else {
                  return task();
                }
              };
            } else {
              task = function() {
                proc.call(component, data, groups, outs);
                return whenDone();
              };
            }
            component.taskQ.push(task);
            resumeTaskQ();
            return gc();
        }
      };
    };
    for (_m = 0, _len4 = inPorts.length; _m < _len4; _m++) {
      port = inPorts[_m];
      _fn1(port);
    }
    baseShutdown = component.shutdown;
    component.shutdown = function() {
      baseShutdown.call(component);
      component.groupedData = {};
      component.groupedGroups = {};
      component.outputQ = [];
      component.disconnectData = {};
      component.disconnectQ = [];
      component.taskQ = [];
      component.params = {};
      component.completeParams = [];
      component.receivedParams = [];
      component.defaultsSent = false;
      component.groupBuffers = {};
      component.keyBuffers = {};
      component.gcTimestamps = {};
      return component.gcCounter = 0;
    };
    return component;
  };

  exports.GroupedInput = exports.WirePattern;

  exports.CustomError = function(message, options) {
    var err;
    err = new Error(message);
    return exports.CustomizeError(err, options);
  };

  exports.CustomizeError = function(err, options) {
    var key, val;
    for (key in options) {
      if (!__hasProp.call(options, key)) continue;
      val = options[key];
      err[key] = val;
    }
    return err;
  };

  exports.MultiError = function(component, group, errorPort, forwardedGroups) {
    var baseShutdown;
    if (group == null) {
      group = '';
    }
    if (errorPort == null) {
      errorPort = 'error';
    }
    if (forwardedGroups == null) {
      forwardedGroups = [];
    }
    component.hasErrors = false;
    component.errors = [];
    component.error = function(e, groups) {
      if (groups == null) {
        groups = [];
      }
      component.errors.push({
        err: e,
        groups: forwardedGroups.concat(groups)
      });
      return component.hasErrors = true;
    };
    component.fail = function(e, groups) {
      var error, grp, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      if (e == null) {
        e = null;
      }
      if (groups == null) {
        groups = [];
      }
      if (e) {
        component.error(e, groups);
      }
      if (!component.hasErrors) {
        return;
      }
      if (!(errorPort in component.outPorts)) {
        return;
      }
      if (!component.outPorts[errorPort].isAttached()) {
        return;
      }
      if (group) {
        component.outPorts[errorPort].beginGroup(group);
      }
      _ref = component.errors;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        error = _ref[_i];
        _ref1 = error.groups;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          grp = _ref1[_j];
          component.outPorts[errorPort].beginGroup(grp);
        }
        component.outPorts[errorPort].send(error.err);
        _ref2 = error.groups;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          grp = _ref2[_k];
          component.outPorts[errorPort].endGroup();
        }
      }
      if (group) {
        component.outPorts[errorPort].endGroup();
      }
      component.outPorts[errorPort].disconnect();
      component.hasErrors = false;
      return component.errors = [];
    };
    baseShutdown = component.shutdown;
    component.shutdown = function() {
      baseShutdown.call(component);
      component.hasErrors = false;
      return component.errors = [];
    };
    return component;
  };

}).call(this);

},{"./InternalSocket":30,"./Streams":39,"underscore":98}],29:[function(require,module,exports){
(function() {
  var BasePort, InPort,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BasePort = require('./BasePort');

  InPort = (function(_super) {
    __extends(InPort, _super);

    function InPort(options, process) {
      this.process = null;
      if (!process && typeof options === 'function') {
        process = options;
        options = {};
      }
      if (options && options.buffered === void 0) {
        options.buffered = false;
      }
      if (!process && options && options.process) {
        process = options.process;
        delete options.process;
      }
      if (process) {
        if (typeof process !== 'function') {
          throw new Error('process must be a function');
        }
        this.process = process;
      }
      InPort.__super__.constructor.call(this, options);
      this.prepareBuffer();
    }

    InPort.prototype.attachSocket = function(socket, localId) {
      if (localId == null) {
        localId = null;
      }
      if (this.hasDefault()) {
        socket.setDataDelegate((function(_this) {
          return function() {
            return _this.options["default"];
          };
        })(this));
      }
      socket.on('connect', (function(_this) {
        return function() {
          return _this.handleSocketEvent('connect', socket, localId);
        };
      })(this));
      socket.on('begingroup', (function(_this) {
        return function(group) {
          return _this.handleSocketEvent('begingroup', group, localId);
        };
      })(this));
      socket.on('data', (function(_this) {
        return function(data) {
          _this.validateData(data);
          return _this.handleSocketEvent('data', data, localId);
        };
      })(this));
      socket.on('endgroup', (function(_this) {
        return function(group) {
          return _this.handleSocketEvent('endgroup', group, localId);
        };
      })(this));
      return socket.on('disconnect', (function(_this) {
        return function() {
          return _this.handleSocketEvent('disconnect', socket, localId);
        };
      })(this));
    };

    InPort.prototype.handleSocketEvent = function(event, payload, id) {
      if (this.isBuffered()) {
        this.buffer.push({
          event: event,
          payload: payload,
          id: id
        });
        if (this.isAddressable()) {
          if (this.process) {
            this.process(event, id, this.nodeInstance);
          }
          this.emit(event, id);
        } else {
          if (this.process) {
            this.process(event, this.nodeInstance);
          }
          this.emit(event);
        }
        return;
      }
      if (this.process) {
        if (this.isAddressable()) {
          this.process(event, payload, id, this.nodeInstance);
        } else {
          this.process(event, payload, this.nodeInstance);
        }
      }
      if (this.isAddressable()) {
        return this.emit(event, payload, id);
      }
      return this.emit(event, payload);
    };

    InPort.prototype.hasDefault = function() {
      return this.options["default"] !== void 0;
    };

    InPort.prototype.prepareBuffer = function() {
      if (!this.isBuffered()) {
        return;
      }
      return this.buffer = [];
    };

    InPort.prototype.validateData = function(data) {
      if (!this.options.values) {
        return;
      }
      if (this.options.values.indexOf(data) === -1) {
        throw new Error("Invalid data='" + data + "' received, not in [" + this.options.values + "]");
      }
    };

    InPort.prototype.receive = function() {
      if (!this.isBuffered()) {
        throw new Error('Receive is only possible on buffered ports');
      }
      return this.buffer.shift();
    };

    InPort.prototype.contains = function() {
      if (!this.isBuffered()) {
        throw new Error('Contains query is only possible on buffered ports');
      }
      return this.buffer.filter(function(packet) {
        if (packet.event === 'data') {
          return true;
        }
      }).length;
    };

    return InPort;

  })(BasePort);

  module.exports = InPort;

}).call(this);

},{"./BasePort":24}],30:[function(require,module,exports){
(function() {
  var EventEmitter, InternalSocket,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  InternalSocket = (function(_super) {
    __extends(InternalSocket, _super);

    InternalSocket.prototype.regularEmitEvent = function(event, data) {
      return this.emit(event, data);
    };

    InternalSocket.prototype.debugEmitEvent = function(event, data) {
      var error;
      try {
        return this.emit(event, data);
      } catch (_error) {
        error = _error;
        return this.emit('error', {
          id: this.to.process.id,
          error: error,
          metadata: this.metadata
        });
      }
    };

    function InternalSocket(metadata) {
      this.metadata = metadata != null ? metadata : {};
      this.connected = false;
      this.groups = [];
      this.dataDelegate = null;
      this.debug = false;
      this.emitEvent = this.regularEmitEvent;
    }

    InternalSocket.prototype.connect = function() {
      if (this.connected) {
        return;
      }
      this.connected = true;
      return this.emitEvent('connect', this);
    };

    InternalSocket.prototype.disconnect = function() {
      if (!this.connected) {
        return;
      }
      this.connected = false;
      return this.emitEvent('disconnect', this);
    };

    InternalSocket.prototype.isConnected = function() {
      return this.connected;
    };

    InternalSocket.prototype.send = function(data) {
      if (!this.connected) {
        this.connect();
      }
      if (data === void 0 && typeof this.dataDelegate === 'function') {
        data = this.dataDelegate();
      }
      return this.emitEvent('data', data);
    };

    InternalSocket.prototype.beginGroup = function(group) {
      this.groups.push(group);
      return this.emitEvent('begingroup', group);
    };

    InternalSocket.prototype.endGroup = function() {
      if (!this.groups.length) {
        return;
      }
      return this.emitEvent('endgroup', this.groups.pop());
    };

    InternalSocket.prototype.setDataDelegate = function(delegate) {
      if (typeof delegate !== 'function') {
        throw Error('A data delegate must be a function.');
      }
      return this.dataDelegate = delegate;
    };

    InternalSocket.prototype.setDebug = function(active) {
      this.debug = active;
      return this.emitEvent = this.debug ? this.debugEmitEvent : this.regularEmitEvent;
    };

    InternalSocket.prototype.getId = function() {
      var fromStr, toStr;
      fromStr = function(from) {
        return "" + from.process.id + "() " + (from.port.toUpperCase());
      };
      toStr = function(to) {
        return "" + (to.port.toUpperCase()) + " " + to.process.id + "()";
      };
      if (!(this.from || this.to)) {
        return "UNDEFINED";
      }
      if (this.from && !this.to) {
        return "" + (fromStr(this.from)) + " -> ANON";
      }
      if (!this.from) {
        return "DATA -> " + (toStr(this.to));
      }
      return "" + (fromStr(this.from)) + " -> " + (toStr(this.to));
    };

    return InternalSocket;

  })(EventEmitter);

  exports.InternalSocket = InternalSocket;

  exports.createSocket = function() {
    return new InternalSocket;
  };

}).call(this);

},{"events":9}],31:[function(require,module,exports){
(function() {
  var EventEmitter, Journal, JournalStore, MemoryJournalStore, calculateMeta, clone, entryToPrettyString,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  EventEmitter = require('events').EventEmitter;

  clone = require('./Utils').clone;

  entryToPrettyString = function(entry) {
    var a;
    a = entry.args;
    switch (entry.cmd) {
      case 'addNode':
        return "" + a.id + "(" + a.component + ")";
      case 'removeNode':
        return "DEL " + a.id + "(" + a.component + ")";
      case 'renameNode':
        return "RENAME " + a.oldId + " " + a.newId;
      case 'changeNode':
        return "META " + a.id;
      case 'addEdge':
        return "" + a.from.node + " " + a.from.port + " -> " + a.to.port + " " + a.to.node;
      case 'removeEdge':
        return "" + a.from.node + " " + a.from.port + " -X> " + a.to.port + " " + a.to.node;
      case 'changeEdge':
        return "META " + a.from.node + " " + a.from.port + " -> " + a.to.port + " " + a.to.node;
      case 'addInitial':
        return "'" + a.from.data + "' -> " + a.to.port + " " + a.to.node;
      case 'removeInitial':
        return "'" + a.from.data + "' -X> " + a.to.port + " " + a.to.node;
      case 'startTransaction':
        return ">>> " + entry.rev + ": " + a.id;
      case 'endTransaction':
        return "<<< " + entry.rev + ": " + a.id;
      case 'changeProperties':
        return "PROPERTIES";
      case 'addGroup':
        return "GROUP " + a.name;
      case 'renameGroup':
        return "RENAME GROUP " + a.oldName + " " + a.newName;
      case 'removeGroup':
        return "DEL GROUP " + a.name;
      case 'changeGroup':
        return "META GROUP " + a.name;
      case 'addInport':
        return "INPORT " + a.name;
      case 'removeInport':
        return "DEL INPORT " + a.name;
      case 'renameInport':
        return "RENAME INPORT " + a.oldId + " " + a.newId;
      case 'changeInport':
        return "META INPORT " + a.name;
      case 'addOutport':
        return "OUTPORT " + a.name;
      case 'removeOutport':
        return "DEL OUTPORT " + a.name;
      case 'renameOutport':
        return "RENAME OUTPORT " + a.oldId + " " + a.newId;
      case 'changeOutport':
        return "META OUTPORT " + a.name;
      default:
        throw new Error("Unknown journal entry: " + entry.cmd);
    }
  };

  calculateMeta = function(oldMeta, newMeta) {
    var k, setMeta, v;
    setMeta = {};
    for (k in oldMeta) {
      v = oldMeta[k];
      setMeta[k] = null;
    }
    for (k in newMeta) {
      v = newMeta[k];
      setMeta[k] = v;
    }
    return setMeta;
  };

  JournalStore = (function(_super) {
    __extends(JournalStore, _super);

    JournalStore.prototype.lastRevision = 0;

    function JournalStore(graph) {
      this.graph = graph;
      this.lastRevision = 0;
    }

    JournalStore.prototype.putTransaction = function(revId, entries) {
      if (revId > this.lastRevision) {
        this.lastRevision = revId;
      }
      return this.emit('transaction', revId);
    };

    JournalStore.prototype.fetchTransaction = function(revId, entries) {};

    return JournalStore;

  })(EventEmitter);

  MemoryJournalStore = (function(_super) {
    __extends(MemoryJournalStore, _super);

    function MemoryJournalStore(graph) {
      MemoryJournalStore.__super__.constructor.call(this, graph);
      this.transactions = [];
    }

    MemoryJournalStore.prototype.putTransaction = function(revId, entries) {
      MemoryJournalStore.__super__.putTransaction.call(this, revId, entries);
      return this.transactions[revId] = entries;
    };

    MemoryJournalStore.prototype.fetchTransaction = function(revId) {
      return this.transactions[revId];
    };

    return MemoryJournalStore;

  })(JournalStore);

  Journal = (function(_super) {
    __extends(Journal, _super);

    Journal.prototype.graph = null;

    Journal.prototype.entries = [];

    Journal.prototype.subscribed = true;

    function Journal(graph, metadata, store) {
      this.endTransaction = __bind(this.endTransaction, this);
      this.startTransaction = __bind(this.startTransaction, this);
      var edge, group, iip, k, node, v, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      this.graph = graph;
      this.entries = [];
      this.subscribed = true;
      this.store = store || new MemoryJournalStore(this.graph);
      if (this.store.transactions.length === 0) {
        this.currentRevision = -1;
        this.startTransaction('initial', metadata);
        _ref = this.graph.nodes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          this.appendCommand('addNode', node);
        }
        _ref1 = this.graph.edges;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          edge = _ref1[_j];
          this.appendCommand('addEdge', edge);
        }
        _ref2 = this.graph.initializers;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          iip = _ref2[_k];
          this.appendCommand('addInitial', iip);
        }
        if (Object.keys(this.graph.properties).length > 0) {
          this.appendCommand('changeProperties', this.graph.properties, {});
        }
        _ref3 = this.graph.inports;
        for (k in _ref3) {
          v = _ref3[k];
          this.appendCommand('addInport', {
            name: k,
            port: v
          });
        }
        _ref4 = this.graph.outports;
        for (k in _ref4) {
          v = _ref4[k];
          this.appendCommand('addOutport', {
            name: k,
            port: v
          });
        }
        _ref5 = this.graph.groups;
        for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
          group = _ref5[_l];
          this.appendCommand('addGroup', group);
        }
        this.endTransaction('initial', metadata);
      } else {
        this.currentRevision = this.store.lastRevision;
      }
      this.graph.on('addNode', (function(_this) {
        return function(node) {
          return _this.appendCommand('addNode', node);
        };
      })(this));
      this.graph.on('removeNode', (function(_this) {
        return function(node) {
          return _this.appendCommand('removeNode', node);
        };
      })(this));
      this.graph.on('renameNode', (function(_this) {
        return function(oldId, newId) {
          var args;
          args = {
            oldId: oldId,
            newId: newId
          };
          return _this.appendCommand('renameNode', args);
        };
      })(this));
      this.graph.on('changeNode', (function(_this) {
        return function(node, oldMeta) {
          return _this.appendCommand('changeNode', {
            id: node.id,
            "new": node.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('addEdge', (function(_this) {
        return function(edge) {
          return _this.appendCommand('addEdge', edge);
        };
      })(this));
      this.graph.on('removeEdge', (function(_this) {
        return function(edge) {
          return _this.appendCommand('removeEdge', edge);
        };
      })(this));
      this.graph.on('changeEdge', (function(_this) {
        return function(edge, oldMeta) {
          return _this.appendCommand('changeEdge', {
            from: edge.from,
            to: edge.to,
            "new": edge.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('addInitial', (function(_this) {
        return function(iip) {
          return _this.appendCommand('addInitial', iip);
        };
      })(this));
      this.graph.on('removeInitial', (function(_this) {
        return function(iip) {
          return _this.appendCommand('removeInitial', iip);
        };
      })(this));
      this.graph.on('changeProperties', (function(_this) {
        return function(newProps, oldProps) {
          return _this.appendCommand('changeProperties', {
            "new": newProps,
            old: oldProps
          });
        };
      })(this));
      this.graph.on('addGroup', (function(_this) {
        return function(group) {
          return _this.appendCommand('addGroup', group);
        };
      })(this));
      this.graph.on('renameGroup', (function(_this) {
        return function(oldName, newName) {
          return _this.appendCommand('renameGroup', {
            oldName: oldName,
            newName: newName
          });
        };
      })(this));
      this.graph.on('removeGroup', (function(_this) {
        return function(group) {
          return _this.appendCommand('removeGroup', group);
        };
      })(this));
      this.graph.on('changeGroup', (function(_this) {
        return function(group, oldMeta) {
          return _this.appendCommand('changeGroup', {
            name: group.name,
            "new": group.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('addExport', (function(_this) {
        return function(exported) {
          return _this.appendCommand('addExport', exported);
        };
      })(this));
      this.graph.on('removeExport', (function(_this) {
        return function(exported) {
          return _this.appendCommand('removeExport', exported);
        };
      })(this));
      this.graph.on('addInport', (function(_this) {
        return function(name, port) {
          return _this.appendCommand('addInport', {
            name: name,
            port: port
          });
        };
      })(this));
      this.graph.on('removeInport', (function(_this) {
        return function(name, port) {
          return _this.appendCommand('removeInport', {
            name: name,
            port: port
          });
        };
      })(this));
      this.graph.on('renameInport', (function(_this) {
        return function(oldId, newId) {
          return _this.appendCommand('renameInport', {
            oldId: oldId,
            newId: newId
          });
        };
      })(this));
      this.graph.on('changeInport', (function(_this) {
        return function(name, port, oldMeta) {
          return _this.appendCommand('changeInport', {
            name: name,
            "new": port.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('addOutport', (function(_this) {
        return function(name, port) {
          return _this.appendCommand('addOutport', {
            name: name,
            port: port
          });
        };
      })(this));
      this.graph.on('removeOutport', (function(_this) {
        return function(name, port) {
          return _this.appendCommand('removeOutport', {
            name: name,
            port: port
          });
        };
      })(this));
      this.graph.on('renameOutport', (function(_this) {
        return function(oldId, newId) {
          return _this.appendCommand('renameOutport', {
            oldId: oldId,
            newId: newId
          });
        };
      })(this));
      this.graph.on('changeOutport', (function(_this) {
        return function(name, port, oldMeta) {
          return _this.appendCommand('changeOutport', {
            name: name,
            "new": port.metadata,
            old: oldMeta
          });
        };
      })(this));
      this.graph.on('startTransaction', (function(_this) {
        return function(id, meta) {
          return _this.startTransaction(id, meta);
        };
      })(this));
      this.graph.on('endTransaction', (function(_this) {
        return function(id, meta) {
          return _this.endTransaction(id, meta);
        };
      })(this));
    }

    Journal.prototype.startTransaction = function(id, meta) {
      if (!this.subscribed) {
        return;
      }
      if (this.entries.length > 0) {
        throw Error("Inconsistent @entries");
      }
      this.currentRevision++;
      return this.appendCommand('startTransaction', {
        id: id,
        metadata: meta
      }, this.currentRevision);
    };

    Journal.prototype.endTransaction = function(id, meta) {
      if (!this.subscribed) {
        return;
      }
      this.appendCommand('endTransaction', {
        id: id,
        metadata: meta
      }, this.currentRevision);
      this.store.putTransaction(this.currentRevision, this.entries);
      return this.entries = [];
    };

    Journal.prototype.appendCommand = function(cmd, args, rev) {
      var entry;
      if (!this.subscribed) {
        return;
      }
      entry = {
        cmd: cmd,
        args: clone(args)
      };
      if (rev != null) {
        entry.rev = rev;
      }
      return this.entries.push(entry);
    };

    Journal.prototype.executeEntry = function(entry) {
      var a;
      a = entry.args;
      switch (entry.cmd) {
        case 'addNode':
          return this.graph.addNode(a.id, a.component);
        case 'removeNode':
          return this.graph.removeNode(a.id);
        case 'renameNode':
          return this.graph.renameNode(a.oldId, a.newId);
        case 'changeNode':
          return this.graph.setNodeMetadata(a.id, calculateMeta(a.old, a["new"]));
        case 'addEdge':
          return this.graph.addEdge(a.from.node, a.from.port, a.to.node, a.to.port);
        case 'removeEdge':
          return this.graph.removeEdge(a.from.node, a.from.port, a.to.node, a.to.port);
        case 'changeEdge':
          return this.graph.setEdgeMetadata(a.from.node, a.from.port, a.to.node, a.to.port, calculateMeta(a.old, a["new"]));
        case 'addInitial':
          return this.graph.addInitial(a.from.data, a.to.node, a.to.port);
        case 'removeInitial':
          return this.graph.removeInitial(a.to.node, a.to.port);
        case 'startTransaction':
          return null;
        case 'endTransaction':
          return null;
        case 'changeProperties':
          return this.graph.setProperties(a["new"]);
        case 'addGroup':
          return this.graph.addGroup(a.name, a.nodes, a.metadata);
        case 'renameGroup':
          return this.graph.renameGroup(a.oldName, a.newName);
        case 'removeGroup':
          return this.graph.removeGroup(a.name);
        case 'changeGroup':
          return this.graph.setGroupMetadata(a.name, calculateMeta(a.old, a["new"]));
        case 'addInport':
          return this.graph.addInport(a.name, a.port.process, a.port.port, a.port.metadata);
        case 'removeInport':
          return this.graph.removeInport(a.name);
        case 'renameInport':
          return this.graph.renameInport(a.oldId, a.newId);
        case 'changeInport':
          return this.graph.setInportMetadata(a.port, calculateMeta(a.old, a["new"]));
        case 'addOutport':
          return this.graph.addOutport(a.name, a.port.process, a.port.port, a.port.metadata(a.name));
        case 'removeOutport':
          return this.graph.removeOutport;
        case 'renameOutport':
          return this.graph.renameOutport(a.oldId, a.newId);
        case 'changeOutport':
          return this.graph.setOutportMetadata(a.port, calculateMeta(a.old, a["new"]));
        default:
          throw new Error("Unknown journal entry: " + entry.cmd);
      }
    };

    Journal.prototype.executeEntryInversed = function(entry) {
      var a;
      a = entry.args;
      switch (entry.cmd) {
        case 'addNode':
          return this.graph.removeNode(a.id);
        case 'removeNode':
          return this.graph.addNode(a.id, a.component);
        case 'renameNode':
          return this.graph.renameNode(a.newId, a.oldId);
        case 'changeNode':
          return this.graph.setNodeMetadata(a.id, calculateMeta(a["new"], a.old));
        case 'addEdge':
          return this.graph.removeEdge(a.from.node, a.from.port, a.to.node, a.to.port);
        case 'removeEdge':
          return this.graph.addEdge(a.from.node, a.from.port, a.to.node, a.to.port);
        case 'changeEdge':
          return this.graph.setEdgeMetadata(a.from.node, a.from.port, a.to.node, a.to.port, calculateMeta(a["new"], a.old));
        case 'addInitial':
          return this.graph.removeInitial(a.to.node, a.to.port);
        case 'removeInitial':
          return this.graph.addInitial(a.from.data, a.to.node, a.to.port);
        case 'startTransaction':
          return null;
        case 'endTransaction':
          return null;
        case 'changeProperties':
          return this.graph.setProperties(a.old);
        case 'addGroup':
          return this.graph.removeGroup(a.name);
        case 'renameGroup':
          return this.graph.renameGroup(a.newName, a.oldName);
        case 'removeGroup':
          return this.graph.addGroup(a.name, a.nodes, a.metadata);
        case 'changeGroup':
          return this.graph.setGroupMetadata(a.name, calculateMeta(a["new"], a.old));
        case 'addInport':
          return this.graph.removeInport(a.name);
        case 'removeInport':
          return this.graph.addInport(a.name, a.port.process, a.port.port, a.port.metadata);
        case 'renameInport':
          return this.graph.renameInport(a.newId, a.oldId);
        case 'changeInport':
          return this.graph.setInportMetadata(a.port, calculateMeta(a["new"], a.old));
        case 'addOutport':
          return this.graph.removeOutport(a.name);
        case 'removeOutport':
          return this.graph.addOutport(a.name, a.port.process, a.port.port, a.port.metadata);
        case 'renameOutport':
          return this.graph.renameOutport(a.newId, a.oldId);
        case 'changeOutport':
          return this.graph.setOutportMetadata(a.port, calculateMeta(a["new"], a.old));
        default:
          throw new Error("Unknown journal entry: " + entry.cmd);
      }
    };

    Journal.prototype.moveToRevision = function(revId) {
      var entries, entry, i, r, _i, _j, _k, _l, _len, _ref, _ref1, _ref2, _ref3, _ref4;
      if (revId === this.currentRevision) {
        return;
      }
      this.subscribed = false;
      if (revId > this.currentRevision) {
        for (r = _i = _ref = this.currentRevision + 1; _ref <= revId ? _i <= revId : _i >= revId; r = _ref <= revId ? ++_i : --_i) {
          _ref1 = this.store.fetchTransaction(r);
          for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
            entry = _ref1[_j];
            this.executeEntry(entry);
          }
        }
      } else {
        for (r = _k = _ref2 = this.currentRevision, _ref3 = revId + 1; _k >= _ref3; r = _k += -1) {
          entries = this.store.fetchTransaction(r);
          for (i = _l = _ref4 = entries.length - 1; _l >= 0; i = _l += -1) {
            this.executeEntryInversed(entries[i]);
          }
        }
      }
      this.currentRevision = revId;
      return this.subscribed = true;
    };

    Journal.prototype.undo = function() {
      if (!this.canUndo()) {
        return;
      }
      return this.moveToRevision(this.currentRevision - 1);
    };

    Journal.prototype.canUndo = function() {
      return this.currentRevision > 0;
    };

    Journal.prototype.redo = function() {
      if (!this.canRedo()) {
        return;
      }
      return this.moveToRevision(this.currentRevision + 1);
    };

    Journal.prototype.canRedo = function() {
      return this.currentRevision < this.store.lastRevision;
    };

    Journal.prototype.toPrettyString = function(startRev, endRev) {
      var e, entry, lines, r, _i, _j, _len;
      startRev |= 0;
      endRev |= this.store.lastRevision;
      lines = [];
      for (r = _i = startRev; startRev <= endRev ? _i < endRev : _i > endRev; r = startRev <= endRev ? ++_i : --_i) {
        e = this.store.fetchTransaction(r);
        for (_j = 0, _len = e.length; _j < _len; _j++) {
          entry = e[_j];
          lines.push(entryToPrettyString(entry));
        }
      }
      return lines.join('\n');
    };

    Journal.prototype.toJSON = function(startRev, endRev) {
      var entries, entry, r, _i, _j, _len, _ref;
      startRev |= 0;
      endRev |= this.store.lastRevision;
      entries = [];
      for (r = _i = startRev; _i < endRev; r = _i += 1) {
        _ref = this.store.fetchTransaction(r);
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          entry = _ref[_j];
          entries.push(entryToPrettyString(entry));
        }
      }
      return entries;
    };

    Journal.prototype.save = function(file, success) {
      var json;
      json = JSON.stringify(this.toJSON(), null, 4);
      return require('fs').writeFile("" + file + ".json", json, "utf-8", function(err, data) {
        if (err) {
          throw err;
        }
        return success(file);
      });
    };

    return Journal;

  })(EventEmitter);

  exports.Journal = Journal;

  exports.JournalStore = JournalStore;

  exports.MemoryJournalStore = MemoryJournalStore;

}).call(this);

},{"./Utils":40,"events":9,"fs":2}],32:[function(require,module,exports){
(function() {
  var Component, Port, util,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Component = require("./Component").Component;

  Port = require("./Port").Port;

  if (!require('./Platform').isBrowser()) {
    util = require("util");
  } else {
    util = {
      inspect: function(data) {
        return data;
      }
    };
  }

  exports.LoggingComponent = (function(_super) {
    __extends(LoggingComponent, _super);

    function LoggingComponent() {
      this.sendLog = __bind(this.sendLog, this);
      this.outPorts = {
        log: new Port()
      };
    }

    LoggingComponent.prototype.sendLog = function(message) {
      if (typeof message === "object") {
        message.when = new Date;
        message.source = this.constructor.name;
        if (this.nodeId != null) {
          message.nodeID = this.nodeId;
        }
      }
      if ((this.outPorts.log != null) && this.outPorts.log.isAttached()) {
        return this.outPorts.log.send(message);
      } else {
        return console.log(util.inspect(message, 4, true, true));
      }
    };

    return LoggingComponent;

  })(Component);

}).call(this);

},{"./Component":25,"./Platform":36,"./Port":37,"util":19}],33:[function(require,module,exports){
(function (process){
(function() {
  var EventEmitter, Network, componentLoader, graph, internalSocket, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require("underscore");

  internalSocket = require("./InternalSocket");

  graph = require("./Graph");

  EventEmitter = require('events').EventEmitter;

  if (!require('./Platform').isBrowser()) {
    componentLoader = require("./nodejs/ComponentLoader");
  } else {
    componentLoader = require('./ComponentLoader');
  }

  Network = (function(_super) {
    __extends(Network, _super);

    Network.prototype.processes = {};

    Network.prototype.connections = [];

    Network.prototype.initials = [];

    Network.prototype.defaults = [];

    Network.prototype.graph = null;

    Network.prototype.startupDate = null;

    Network.prototype.portBuffer = {};

    function Network(graph, options) {
      this.options = options != null ? options : {};
      this.processes = {};
      this.connections = [];
      this.initials = [];
      this.nextInitials = [];
      this.defaults = [];
      this.graph = graph;
      this.started = false;
      this.debug = false;
      if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
        this.baseDir = graph.baseDir || process.cwd();
      } else {
        this.baseDir = graph.baseDir || '/';
      }
      this.startupDate = new Date();
      if (graph.componentLoader) {
        this.loader = graph.componentLoader;
      } else {
        this.loader = new componentLoader.ComponentLoader(this.baseDir, this.options);
      }
    }

    Network.prototype.uptime = function() {
      return new Date() - this.startupDate;
    };

    Network.prototype.connectionCount = 0;

    Network.prototype.increaseConnections = function() {
      if (this.connectionCount === 0) {
        this.emit('start', {
          start: this.startupDate
        });
      }
      return this.connectionCount++;
    };

    Network.prototype.decreaseConnections = function() {
      var ender;
      this.connectionCount--;
      if (this.connectionCount === 0) {
        ender = _.debounce((function(_this) {
          return function() {
            if (_this.connectionCount) {
              return;
            }
            return _this.emit('end', {
              start: _this.startupDate,
              end: new Date,
              uptime: _this.uptime()
            });
          };
        })(this), 10);
        return ender();
      }
    };

    Network.prototype.load = function(component, metadata, callback) {
      return this.loader.load(component, callback, metadata);
    };

    Network.prototype.addNode = function(node, callback) {
      var process;
      if (this.processes[node.id]) {
        if (callback) {
          callback(null, this.processes[node.id]);
        }
        return;
      }
      process = {
        id: node.id
      };
      if (!node.component) {
        this.processes[process.id] = process;
        if (callback) {
          callback(null, process);
        }
        return;
      }
      return this.load(node.component, node.metadata, (function(_this) {
        return function(err, instance) {
          var name, port, _ref, _ref1;
          if (err) {
            return callback(err);
          }
          instance.nodeId = node.id;
          process.component = instance;
          _ref = process.component.inPorts;
          for (name in _ref) {
            port = _ref[name];
            if (!port || typeof port === 'function' || !port.canAttach) {
              continue;
            }
            port.node = node.id;
            port.nodeInstance = instance;
            port.name = name;
          }
          _ref1 = process.component.outPorts;
          for (name in _ref1) {
            port = _ref1[name];
            if (!port || typeof port === 'function' || !port.canAttach) {
              continue;
            }
            port.node = node.id;
            port.nodeInstance = instance;
            port.name = name;
          }
          if (instance.isSubgraph()) {
            _this.subscribeSubgraph(process);
          }
          _this.subscribeNode(process);
          _this.processes[process.id] = process;
          if (callback) {
            return callback(null, process);
          }
        };
      })(this));
    };

    Network.prototype.removeNode = function(node, callback) {
      if (!this.processes[node.id]) {
        return callback(new Error("Node " + node.id + " not found"));
      }
      this.processes[node.id].component.shutdown();
      delete this.processes[node.id];
      if (callback) {
        return callback(null);
      }
    };

    Network.prototype.renameNode = function(oldId, newId, callback) {
      var name, port, process, _ref, _ref1;
      process = this.getNode(oldId);
      if (!process) {
        return callback(new Error("Process " + oldId + " not found"));
      }
      process.id = newId;
      _ref = process.component.inPorts;
      for (name in _ref) {
        port = _ref[name];
        port.node = newId;
      }
      _ref1 = process.component.outPorts;
      for (name in _ref1) {
        port = _ref1[name];
        port.node = newId;
      }
      this.processes[newId] = process;
      delete this.processes[oldId];
      if (callback) {
        return callback(null);
      }
    };

    Network.prototype.getNode = function(id) {
      return this.processes[id];
    };

    Network.prototype.connect = function(done) {
      var callStack, edges, initializers, nodes, serialize, setDefaults, subscribeGraph;
      if (done == null) {
        done = function() {};
      }
      callStack = 0;
      serialize = (function(_this) {
        return function(next, add) {
          return function(type) {
            return _this["add" + type](add, function() {
              callStack++;
              if (callStack % 100 === 0) {
                setTimeout(function() {
                  return next(type);
                }, 0);
                return;
              }
              return next(type);
            });
          };
        };
      })(this);
      subscribeGraph = (function(_this) {
        return function() {
          _this.subscribeGraph();
          return done();
        };
      })(this);
      setDefaults = _.reduceRight(this.graph.nodes, serialize, subscribeGraph);
      initializers = _.reduceRight(this.graph.initializers, serialize, function() {
        return setDefaults("Defaults");
      });
      edges = _.reduceRight(this.graph.edges, serialize, function() {
        return initializers("Initial");
      });
      nodes = _.reduceRight(this.graph.nodes, serialize, function() {
        return edges("Edge");
      });
      return nodes("Node");
    };

    Network.prototype.connectPort = function(socket, process, port, index, inbound) {
      if (inbound) {
        socket.to = {
          process: process,
          port: port,
          index: index
        };
        if (!(process.component.inPorts && process.component.inPorts[port])) {
          throw new Error("No inport '" + port + "' defined in process " + process.id + " (" + (socket.getId()) + ")");
          return;
        }
        if (process.component.inPorts[port].isAddressable()) {
          return process.component.inPorts[port].attach(socket, index);
        }
        return process.component.inPorts[port].attach(socket);
      }
      socket.from = {
        process: process,
        port: port,
        index: index
      };
      if (!(process.component.outPorts && process.component.outPorts[port])) {
        throw new Error("No outport '" + port + "' defined in process " + process.id + " (" + (socket.getId()) + ")");
        return;
      }
      if (process.component.outPorts[port].isAddressable()) {
        return process.component.outPorts[port].attach(socket, index);
      }
      return process.component.outPorts[port].attach(socket);
    };

    Network.prototype.subscribeGraph = function() {
      var graphOps, processOps, processing, registerOp;
      graphOps = [];
      processing = false;
      registerOp = function(op, details) {
        return graphOps.push({
          op: op,
          details: details
        });
      };
      processOps = (function(_this) {
        return function() {
          var cb, op;
          if (!graphOps.length) {
            processing = false;
            return;
          }
          processing = true;
          op = graphOps.shift();
          cb = processOps;
          switch (op.op) {
            case 'renameNode':
              return _this.renameNode(op.details.from, op.details.to, cb);
            default:
              return _this[op.op](op.details, cb);
          }
        };
      })(this);
      this.graph.on('addNode', (function(_this) {
        return function(node) {
          registerOp('addNode', node);
          if (!processing) {
            return processOps();
          }
        };
      })(this));
      this.graph.on('removeNode', (function(_this) {
        return function(node) {
          registerOp('removeNode', node);
          if (!processing) {
            return processOps();
          }
        };
      })(this));
      this.graph.on('renameNode', (function(_this) {
        return function(oldId, newId) {
          registerOp('renameNode', {
            from: oldId,
            to: newId
          });
          if (!processing) {
            return processOps();
          }
        };
      })(this));
      this.graph.on('addEdge', (function(_this) {
        return function(edge) {
          registerOp('addEdge', edge);
          if (!processing) {
            return processOps();
          }
        };
      })(this));
      this.graph.on('removeEdge', (function(_this) {
        return function(edge) {
          registerOp('removeEdge', edge);
          if (!processing) {
            return processOps();
          }
        };
      })(this));
      this.graph.on('addInitial', (function(_this) {
        return function(iip) {
          registerOp('addInitial', iip);
          if (!processing) {
            return processOps();
          }
        };
      })(this));
      return this.graph.on('removeInitial', (function(_this) {
        return function(iip) {
          registerOp('removeInitial', iip);
          if (!processing) {
            return processOps();
          }
        };
      })(this));
    };

    Network.prototype.subscribeSubgraph = function(node) {
      var emitSub;
      if (!node.component.isReady()) {
        node.component.once('ready', (function(_this) {
          return function() {
            return _this.subscribeSubgraph(node);
          };
        })(this));
        return;
      }
      if (!node.component.network) {
        return;
      }
      emitSub = (function(_this) {
        return function(type, data) {
          if (type === 'connect') {
            _this.increaseConnections();
          }
          if (type === 'disconnect') {
            _this.decreaseConnections();
          }
          if (!data) {
            data = {};
          }
          if (data.subgraph) {
            if (!data.subgraph.unshift) {
              data.subgraph = [data.subgraph];
            }
            data.subgraph = data.subgraph.unshift(node.id);
          } else {
            data.subgraph = [node.id];
          }
          return _this.emit(type, data);
        };
      })(this);
      node.component.network.on('connect', function(data) {
        return emitSub('connect', data);
      });
      node.component.network.on('begingroup', function(data) {
        return emitSub('begingroup', data);
      });
      node.component.network.on('data', function(data) {
        return emitSub('data', data);
      });
      node.component.network.on('endgroup', function(data) {
        return emitSub('endgroup', data);
      });
      node.component.network.on('disconnect', function(data) {
        return emitSub('disconnect', data);
      });
      return node.component.network.on('process-error', function(data) {
        return emitSub('process-error', data);
      });
    };

    Network.prototype.subscribeSocket = function(socket) {
      socket.on('connect', (function(_this) {
        return function() {
          _this.increaseConnections();
          return _this.emit('connect', {
            id: socket.getId(),
            socket: socket,
            metadata: socket.metadata
          });
        };
      })(this));
      socket.on('begingroup', (function(_this) {
        return function(group) {
          return _this.emit('begingroup', {
            id: socket.getId(),
            socket: socket,
            group: group,
            metadata: socket.metadata
          });
        };
      })(this));
      socket.on('data', (function(_this) {
        return function(data) {
          return _this.emit('data', {
            id: socket.getId(),
            socket: socket,
            data: data,
            metadata: socket.metadata
          });
        };
      })(this));
      socket.on('endgroup', (function(_this) {
        return function(group) {
          return _this.emit('endgroup', {
            id: socket.getId(),
            socket: socket,
            group: group,
            metadata: socket.metadata
          });
        };
      })(this));
      socket.on('disconnect', (function(_this) {
        return function() {
          _this.decreaseConnections();
          return _this.emit('disconnect', {
            id: socket.getId(),
            socket: socket,
            metadata: socket.metadata
          });
        };
      })(this));
      return socket.on('error', (function(_this) {
        return function(event) {
          return _this.emit('process-error', event);
        };
      })(this));
    };

    Network.prototype.subscribeNode = function(node) {
      if (!node.component.getIcon) {
        return;
      }
      return node.component.on('icon', (function(_this) {
        return function() {
          return _this.emit('icon', {
            id: node.id,
            icon: node.component.getIcon()
          });
        };
      })(this));
    };

    Network.prototype.addEdge = function(edge, callback) {
      var from, socket, to;
      socket = internalSocket.createSocket(edge.metadata);
      from = this.getNode(edge.from.node);
      if (!from) {
        throw new Error("No process defined for outbound node " + edge.from.node);
      }
      if (!from.component) {
        throw new Error("No component defined for outbound node " + edge.from.node);
      }
      if (!from.component.isReady()) {
        from.component.once("ready", (function(_this) {
          return function() {
            return _this.addEdge(edge, callback);
          };
        })(this));
        return;
      }
      to = this.getNode(edge.to.node);
      if (!to) {
        throw new Error("No process defined for inbound node " + edge.to.node);
      }
      if (!to.component) {
        throw new Error("No component defined for inbound node " + edge.to.node);
      }
      if (!to.component.isReady()) {
        to.component.once("ready", (function(_this) {
          return function() {
            return _this.addEdge(edge, callback);
          };
        })(this));
        return;
      }
      this.subscribeSocket(socket);
      this.connectPort(socket, to, edge.to.port, edge.to.index, true);
      this.connectPort(socket, from, edge.from.port, edge.from.index, false);
      this.connections.push(socket);
      if (callback) {
        return callback();
      }
    };

    Network.prototype.removeEdge = function(edge, callback) {
      var connection, _i, _len, _ref, _results;
      _ref = this.connections;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        connection = _ref[_i];
        if (!connection) {
          continue;
        }
        if (!(edge.to.node === connection.to.process.id && edge.to.port === connection.to.port)) {
          continue;
        }
        connection.to.process.component.inPorts[connection.to.port].detach(connection);
        if (edge.from.node) {
          if (connection.from && edge.from.node === connection.from.process.id && edge.from.port === connection.from.port) {
            connection.from.process.component.outPorts[connection.from.port].detach(connection);
          }
        }
        this.connections.splice(this.connections.indexOf(connection), 1);
        if (callback) {
          _results.push(callback());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Network.prototype.addDefaults = function(node, callback) {
      var key, port, process, socket, _ref;
      process = this.processes[node.id];
      if (!process.component.isReady()) {
        if (process.component.setMaxListeners) {
          process.component.setMaxListeners(0);
        }
        process.component.once("ready", (function(_this) {
          return function() {
            return _this.addDefaults(process, callback);
          };
        })(this));
        return;
      }
      _ref = process.component.inPorts.ports;
      for (key in _ref) {
        port = _ref[key];
        if (typeof port.hasDefault === 'function' && port.hasDefault() && !port.isAttached()) {
          socket = internalSocket.createSocket();
          this.subscribeSocket(socket);
          this.connectPort(socket, process, key, void 0, true);
          this.connections.push(socket);
          this.defaults.push(socket);
        }
      }
      if (callback) {
        return callback();
      }
    };

    Network.prototype.addInitial = function(initializer, callback) {
      var init, socket, to;
      socket = internalSocket.createSocket(initializer.metadata);
      this.subscribeSocket(socket);
      to = this.getNode(initializer.to.node);
      if (!to) {
        throw new Error("No process defined for inbound node " + initializer.to.node);
      }
      if (!(to.component.isReady() || to.component.inPorts[initializer.to.port])) {
        if (to.component.setMaxListeners) {
          to.component.setMaxListeners(0);
        }
        to.component.once("ready", (function(_this) {
          return function() {
            return _this.addInitial(initializer, callback);
          };
        })(this));
        return;
      }
      this.connectPort(socket, to, initializer.to.port, initializer.to.index, true);
      this.connections.push(socket);
      init = {
        socket: socket,
        data: initializer.from.data
      };
      this.initials.push(init);
      this.nextInitials.push(init);
      if (this.isStarted()) {
        this.sendInitials();
      }
      if (callback) {
        return callback();
      }
    };

    Network.prototype.removeInitial = function(initializer, callback) {
      var connection, init, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
      _ref = this.connections;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        connection = _ref[_i];
        if (!connection) {
          continue;
        }
        if (!(initializer.to.node === connection.to.process.id && initializer.to.port === connection.to.port)) {
          continue;
        }
        connection.to.process.component.inPorts[connection.to.port].detach(connection);
        this.connections.splice(this.connections.indexOf(connection), 1);
        _ref1 = this.initials;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          init = _ref1[_j];
          if (!init) {
            continue;
          }
          if (init.socket !== connection) {
            continue;
          }
          this.initials.splice(this.initials.indexOf(init), 1);
        }
        _ref2 = this.nextInitials;
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          init = _ref2[_k];
          if (!init) {
            continue;
          }
          if (init.socket !== connection) {
            continue;
          }
          this.nextInitials.splice(this.nextInitials.indexOf(init), 1);
        }
      }
      if (callback) {
        return callback();
      }
    };

    Network.prototype.sendInitial = function(initial) {
      initial.socket.connect();
      initial.socket.send(initial.data);
      return initial.socket.disconnect();
    };

    Network.prototype.sendInitials = function() {
      var send;
      send = (function(_this) {
        return function() {
          var initial, _i, _len, _ref;
          _ref = _this.initials;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            initial = _ref[_i];
            _this.sendInitial(initial);
          }
          return _this.initials = [];
        };
      })(this);
      if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
        return process.nextTick(send);
      } else {
        return setTimeout(send, 0);
      }
    };

    Network.prototype.isStarted = function() {
      return this.started;
    };

    Network.prototype.isRunning = function() {
      if (!this.started) {
        return false;
      }
      return this.connectionCount > 0;
    };

    Network.prototype.startComponents = function() {
      var id, process, _ref, _results;
      _ref = this.processes;
      _results = [];
      for (id in _ref) {
        process = _ref[id];
        _results.push(process.component.start());
      }
      return _results;
    };

    Network.prototype.sendDefaults = function() {
      var socket, _i, _len, _ref, _results;
      _ref = this.defaults;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        socket = _ref[_i];
        if (socket.to.process.component.inPorts[socket.to.port].sockets.length !== 1) {
          continue;
        }
        socket.connect();
        socket.send();
        _results.push(socket.disconnect());
      }
      return _results;
    };

    Network.prototype.start = function() {
      if (this.started) {
        this.stop();
      }
      this.started = true;
      this.initials = this.nextInitials.slice(0);
      this.startComponents();
      this.sendInitials();
      return this.sendDefaults();
    };

    Network.prototype.stop = function() {
      var connection, id, process, _i, _len, _ref, _ref1;
      _ref = this.connections;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        connection = _ref[_i];
        if (!connection.isConnected()) {
          continue;
        }
        connection.disconnect();
      }
      _ref1 = this.processes;
      for (id in _ref1) {
        process = _ref1[id];
        process.component.shutdown();
      }
      return this.started = false;
    };

    Network.prototype.getDebug = function() {
      return this.debug;
    };

    Network.prototype.setDebug = function(active) {
      var instance, process, processId, socket, _i, _len, _ref, _ref1, _results;
      if (active === this.debug) {
        return;
      }
      this.debug = active;
      _ref = this.connections;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        socket = _ref[_i];
        socket.setDebug(active);
      }
      _ref1 = this.processes;
      _results = [];
      for (processId in _ref1) {
        process = _ref1[processId];
        instance = process.component;
        if (instance.isSubgraph()) {
          _results.push(instance.network.setDebug(active));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Network;

  })(EventEmitter);

  exports.Network = Network;

}).call(this);

}).call(this,require('_process'))
},{"./ComponentLoader":26,"./Graph":27,"./InternalSocket":30,"./Platform":36,"./nodejs/ComponentLoader":41,"_process":12,"events":9,"underscore":98}],34:[function(require,module,exports){
(function() {
  var ports;

  exports.graph = require('./Graph');

  exports.Graph = exports.graph.Graph;

  exports.journal = require('./Journal');

  exports.Journal = exports.journal.Journal;

  exports.Network = require('./Network').Network;

  exports.isBrowser = require('./Platform').isBrowser;

  if (!exports.isBrowser()) {
    exports.ComponentLoader = require('./nodejs/ComponentLoader').ComponentLoader;
  } else {
    exports.ComponentLoader = require('./ComponentLoader').ComponentLoader;
  }

  exports.Component = require('./Component').Component;

  exports.AsyncComponent = require('./AsyncComponent').AsyncComponent;

  exports.LoggingComponent = require('./LoggingComponent').LoggingComponent;

  exports.helpers = require('./Helpers');

  ports = require('./Ports');

  exports.InPorts = ports.InPorts;

  exports.OutPorts = ports.OutPorts;

  exports.InPort = require('./InPort');

  exports.OutPort = require('./OutPort');

  exports.Port = require('./Port').Port;

  exports.ArrayPort = require('./ArrayPort').ArrayPort;

  exports.internalSocket = require('./InternalSocket');

  exports.createNetwork = function(graph, callback, options) {
    var network, networkReady;
    if (typeof options !== 'object') {
      options = {
        delay: options
      };
    }
    network = new exports.Network(graph, options);
    networkReady = function(network) {
      if (callback != null) {
        callback(network);
      }
      return network.start();
    };
    network.loader.listComponents(function() {
      if (graph.nodes.length === 0) {
        return networkReady(network);
      }
      if (options.delay) {
        if (callback != null) {
          callback(network);
        }
        return;
      }
      return network.connect(function() {
        return networkReady(network);
      });
    });
    return network;
  };

  exports.loadFile = function(file, options, callback) {
    var baseDir;
    if (!callback) {
      callback = options;
      baseDir = null;
    }
    if (callback && typeof options !== 'object') {
      options = {
        baseDir: options
      };
    }
    return exports.graph.loadFile(file, function(net) {
      if (options.baseDir) {
        net.baseDir = options.baseDir;
      }
      return exports.createNetwork(net, callback, options);
    });
  };

  exports.saveFile = function(graph, file, callback) {
    return exports.graph.save(file, function() {
      return callback(file);
    });
  };

}).call(this);

},{"./ArrayPort":22,"./AsyncComponent":23,"./Component":25,"./ComponentLoader":26,"./Graph":27,"./Helpers":28,"./InPort":29,"./InternalSocket":30,"./Journal":31,"./LoggingComponent":32,"./Network":33,"./OutPort":35,"./Platform":36,"./Port":37,"./Ports":38,"./nodejs/ComponentLoader":41}],35:[function(require,module,exports){
(function() {
  var BasePort, OutPort,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  BasePort = require('./BasePort');

  OutPort = (function(_super) {
    __extends(OutPort, _super);

    function OutPort(options) {
      this.cache = {};
      OutPort.__super__.constructor.call(this, options);
    }

    OutPort.prototype.attach = function(socket, index) {
      if (index == null) {
        index = null;
      }
      OutPort.__super__.attach.call(this, socket, index);
      if (this.isCaching() && (this.cache[index] != null)) {
        return this.send(this.cache[index], index);
      }
    };

    OutPort.prototype.connect = function(socketId) {
      var socket, sockets, _i, _len, _results;
      if (socketId == null) {
        socketId = null;
      }
      sockets = this.getSockets(socketId);
      this.checkRequired(sockets);
      _results = [];
      for (_i = 0, _len = sockets.length; _i < _len; _i++) {
        socket = sockets[_i];
        if (!socket) {
          continue;
        }
        _results.push(socket.connect());
      }
      return _results;
    };

    OutPort.prototype.beginGroup = function(group, socketId) {
      var sockets;
      if (socketId == null) {
        socketId = null;
      }
      sockets = this.getSockets(socketId);
      this.checkRequired(sockets);
      return sockets.forEach(function(socket) {
        if (!socket) {
          return;
        }
        if (socket.isConnected()) {
          return socket.beginGroup(group);
        }
        socket.once('connect', function() {
          return socket.beginGroup(group);
        });
        return socket.connect();
      });
    };

    OutPort.prototype.send = function(data, socketId) {
      var sockets;
      if (socketId == null) {
        socketId = null;
      }
      sockets = this.getSockets(socketId);
      this.checkRequired(sockets);
      if (this.isCaching() && data !== this.cache[socketId]) {
        this.cache[socketId] = data;
      }
      return sockets.forEach(function(socket) {
        if (!socket) {
          return;
        }
        if (socket.isConnected()) {
          return socket.send(data);
        }
        socket.once('connect', function() {
          return socket.send(data);
        });
        return socket.connect();
      });
    };

    OutPort.prototype.endGroup = function(socketId) {
      var socket, sockets, _i, _len, _results;
      if (socketId == null) {
        socketId = null;
      }
      sockets = this.getSockets(socketId);
      this.checkRequired(sockets);
      _results = [];
      for (_i = 0, _len = sockets.length; _i < _len; _i++) {
        socket = sockets[_i];
        if (!socket) {
          continue;
        }
        _results.push(socket.endGroup());
      }
      return _results;
    };

    OutPort.prototype.disconnect = function(socketId) {
      var socket, sockets, _i, _len, _results;
      if (socketId == null) {
        socketId = null;
      }
      sockets = this.getSockets(socketId);
      this.checkRequired(sockets);
      _results = [];
      for (_i = 0, _len = sockets.length; _i < _len; _i++) {
        socket = sockets[_i];
        if (!socket) {
          continue;
        }
        _results.push(socket.disconnect());
      }
      return _results;
    };

    OutPort.prototype.checkRequired = function(sockets) {
      if (sockets.length === 0 && this.isRequired()) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
    };

    OutPort.prototype.getSockets = function(socketId) {
      if (this.isAddressable()) {
        if (socketId === null) {
          throw new Error("" + (this.getId()) + " Socket ID required");
        }
        if (!this.sockets[socketId]) {
          return [];
        }
        return [this.sockets[socketId]];
      }
      return this.sockets;
    };

    OutPort.prototype.isCaching = function() {
      if (this.options.caching) {
        return true;
      }
      return false;
    };

    return OutPort;

  })(BasePort);

  module.exports = OutPort;

}).call(this);

},{"./BasePort":24}],36:[function(require,module,exports){
(function (process){
(function() {
  exports.isBrowser = function() {
    if (typeof process !== 'undefined' && process.execPath && process.execPath.match(/node|iojs/)) {
      return false;
    }
    return true;
  };

}).call(this);

}).call(this,require('_process'))
},{"_process":12}],37:[function(require,module,exports){
(function() {
  var EventEmitter, Port,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  Port = (function(_super) {
    __extends(Port, _super);

    Port.prototype.description = '';

    Port.prototype.required = true;

    function Port(type) {
      this.type = type;
      if (!this.type) {
        this.type = 'all';
      }
      if (this.type === 'integer') {
        this.type = 'int';
      }
      this.sockets = [];
      this.from = null;
      this.node = null;
      this.name = null;
    }

    Port.prototype.getId = function() {
      if (!(this.node && this.name)) {
        return 'Port';
      }
      return "" + this.node + " " + (this.name.toUpperCase());
    };

    Port.prototype.getDataType = function() {
      return this.type;
    };

    Port.prototype.getDescription = function() {
      return this.description;
    };

    Port.prototype.attach = function(socket) {
      this.sockets.push(socket);
      return this.attachSocket(socket);
    };

    Port.prototype.attachSocket = function(socket, localId) {
      if (localId == null) {
        localId = null;
      }
      this.emit("attach", socket, localId);
      this.from = socket.from;
      if (socket.setMaxListeners) {
        socket.setMaxListeners(0);
      }
      socket.on("connect", (function(_this) {
        return function() {
          return _this.emit("connect", socket, localId);
        };
      })(this));
      socket.on("begingroup", (function(_this) {
        return function(group) {
          return _this.emit("begingroup", group, localId);
        };
      })(this));
      socket.on("data", (function(_this) {
        return function(data) {
          return _this.emit("data", data, localId);
        };
      })(this));
      socket.on("endgroup", (function(_this) {
        return function(group) {
          return _this.emit("endgroup", group, localId);
        };
      })(this));
      return socket.on("disconnect", (function(_this) {
        return function() {
          return _this.emit("disconnect", socket, localId);
        };
      })(this));
    };

    Port.prototype.connect = function() {
      var socket, _i, _len, _ref, _results;
      if (this.sockets.length === 0) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      _ref = this.sockets;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        socket = _ref[_i];
        _results.push(socket.connect());
      }
      return _results;
    };

    Port.prototype.beginGroup = function(group) {
      if (this.sockets.length === 0) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      return this.sockets.forEach(function(socket) {
        if (socket.isConnected()) {
          return socket.beginGroup(group);
        }
        socket.once('connect', function() {
          return socket.beginGroup(group);
        });
        return socket.connect();
      });
    };

    Port.prototype.send = function(data) {
      if (this.sockets.length === 0) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      return this.sockets.forEach(function(socket) {
        if (socket.isConnected()) {
          return socket.send(data);
        }
        socket.once('connect', function() {
          return socket.send(data);
        });
        return socket.connect();
      });
    };

    Port.prototype.endGroup = function() {
      var socket, _i, _len, _ref, _results;
      if (this.sockets.length === 0) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      _ref = this.sockets;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        socket = _ref[_i];
        _results.push(socket.endGroup());
      }
      return _results;
    };

    Port.prototype.disconnect = function() {
      var socket, _i, _len, _ref, _results;
      if (this.sockets.length === 0) {
        throw new Error("" + (this.getId()) + ": No connections available");
      }
      _ref = this.sockets;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        socket = _ref[_i];
        _results.push(socket.disconnect());
      }
      return _results;
    };

    Port.prototype.detach = function(socket) {
      var index;
      if (this.sockets.length === 0) {
        return;
      }
      if (!socket) {
        socket = this.sockets[0];
      }
      index = this.sockets.indexOf(socket);
      if (index === -1) {
        return;
      }
      if (this.isAddressable()) {
        this.sockets[index] = void 0;
        this.emit('detach', socket, index);
        return;
      }
      this.sockets.splice(index, 1);
      return this.emit("detach", socket);
    };

    Port.prototype.isConnected = function() {
      var connected;
      connected = false;
      this.sockets.forEach((function(_this) {
        return function(socket) {
          if (socket.isConnected()) {
            return connected = true;
          }
        };
      })(this));
      return connected;
    };

    Port.prototype.isAddressable = function() {
      return false;
    };

    Port.prototype.isRequired = function() {
      return this.required;
    };

    Port.prototype.isAttached = function() {
      if (this.sockets.length > 0) {
        return true;
      }
      return false;
    };

    Port.prototype.listAttached = function() {
      var attached, idx, socket, _i, _len, _ref;
      attached = [];
      _ref = this.sockets;
      for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
        socket = _ref[idx];
        if (!socket) {
          continue;
        }
        attached.push(idx);
      }
      return attached;
    };

    Port.prototype.canAttach = function() {
      return true;
    };

    return Port;

  })(EventEmitter);

  exports.Port = Port;

}).call(this);

},{"events":9}],38:[function(require,module,exports){
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

},{"./InPort":29,"./OutPort":35,"events":9}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
(function (__filename,__dirname){
(function() {
  var CoffeeScript, ComponentLoader, fs, internalSocket, loader, log, nofloGraph, path, reader, utils, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  reader = require('read-installed');

  _ = require('underscore')._;

  path = require('path');

  fs = require('fs');

  loader = require('../ComponentLoader');

  internalSocket = require('../InternalSocket');

  utils = require('../Utils');

  nofloGraph = require('../Graph');

  CoffeeScript = require('coffee-script');

  if (typeof CoffeeScript.register !== 'undefined') {
    CoffeeScript.register();
  }

  log = require('npmlog');

  log.pause();

  ComponentLoader = (function(_super) {
    __extends(ComponentLoader, _super);

    function ComponentLoader() {
      return ComponentLoader.__super__.constructor.apply(this, arguments);
    }

    ComponentLoader.prototype.getModuleComponents = function(moduleDef, callback) {
      var checkOwn, components, depCount, done;
      components = {};
      this.checked.push(moduleDef.name);
      depCount = _.keys(moduleDef.dependencies).length;
      done = _.after(depCount + 1, (function(_this) {
        return function() {
          return callback(components);
        };
      })(this));
      _.each(moduleDef.dependencies, (function(_this) {
        return function(def) {
          if (def.name == null) {
            return done();
          }
          if (_this.checked.indexOf(def.name) !== -1) {
            return done();
          }
          return _this.getModuleComponents(def, function(depComponents) {
            var cPath, name;
            if (_.isEmpty(depComponents)) {
              return done();
            }
            for (name in depComponents) {
              cPath = depComponents[name];
              components[name] = cPath;
            }
            return done();
          });
        };
      })(this));
      if (!moduleDef.noflo) {
        return done();
      }
      checkOwn = (function(_this) {
        return function(def) {
          var cPath, gPath, loaderPath, name, prefix, _ref, _ref1;
          prefix = _this.getModulePrefix(def.name);
          if (def.noflo.icon) {
            _this.libraryIcons[prefix] = def.noflo.icon;
          }
          if (def.noflo.components) {
            _ref = def.noflo.components;
            for (name in _ref) {
              cPath = _ref[name];
              _this.registerComponent(prefix, name, path.resolve(def.realPath, cPath));
            }
          }
          if (moduleDef.noflo.graphs) {
            _ref1 = def.noflo.graphs;
            for (name in _ref1) {
              gPath = _ref1[name];
              _this.registerGraph(prefix, name, path.resolve(def.realPath, gPath));
            }
          }
          if (def.noflo.loader) {
            loaderPath = path.resolve(def.realPath, def.noflo.loader);
            if (!_this.componentLoaders) {
              _this.componentLoaders = [];
            }
            _this.componentLoaders.push(loaderPath);
            loader = require(loaderPath);
            return _this.registerLoader(loader, done);
          } else {
            return done();
          }
        };
      })(this);
      if (!this.revalidate) {
        return checkOwn(moduleDef);
      }
      return this.readPackageFile("" + moduleDef.realPath + "/package.json", function(err, data) {
        if (err) {
          return done();
        }
        return checkOwn(data);
      });
    };

    ComponentLoader.prototype.getCoreComponents = function(callback) {
      var corePath;
      corePath = path.resolve(__dirname, '../../src/components');
      if (path.extname(__filename) === '.coffee') {
        corePath = path.resolve(__dirname, '../../components');
      }
      return fs.readdir(corePath, (function(_this) {
        return function(err, components) {
          var component, componentExtension, componentName, coreComponents, _i, _len, _ref;
          coreComponents = {};
          if (err) {
            return callback(coreComponents);
          }
          for (_i = 0, _len = components.length; _i < _len; _i++) {
            component = components[_i];
            if (component.substr(0, 1) === '.') {
              continue;
            }
            _ref = component.split('.'), componentName = _ref[0], componentExtension = _ref[1];
            if (componentExtension !== 'coffee') {
              continue;
            }
            coreComponents[componentName] = "" + corePath + "/" + component;
          }
          return callback(coreComponents);
        };
      })(this));
    };

    ComponentLoader.prototype.cachePath = function() {
      return path.resolve(this.baseDir, './.noflo.json');
    };

    ComponentLoader.prototype.writeCache = function() {
      var cPath, cacheData, filePath, name, _ref;
      cacheData = {
        components: {},
        loaders: this.componentLoaders || []
      };
      _ref = this.components;
      for (name in _ref) {
        cPath = _ref[name];
        if (typeof cPath !== 'string') {
          continue;
        }
        cacheData.components[name] = cPath;
      }
      filePath = this.cachePath();
      return fs.writeFile(filePath, JSON.stringify(cacheData, null, 2), {
        encoding: 'utf-8'
      }, function() {});
    };

    ComponentLoader.prototype.readCache = function(callback) {
      var filePath;
      filePath = this.cachePath();
      return fs.readFile(filePath, {
        encoding: 'utf-8'
      }, (function(_this) {
        return function(err, cached) {
          var cacheData, done, e, _ref;
          if (err) {
            return callback(err);
          }
          if (!cached) {
            return callback(new Error('No cached components found'));
          }
          try {
            cacheData = JSON.parse(cached);
          } catch (_error) {
            e = _error;
            callback(e);
          }
          if (!cacheData.components) {
            return callback(new Error('No components in cache'));
          }
          _this.components = cacheData.components;
          if (!((_ref = cacheData.loaders) != null ? _ref.length : void 0)) {
            callback(null);
            return;
          }
          done = _.after(cacheData.loaders.length, function() {
            return callback(null);
          });
          return cacheData.loaders.forEach(function(loaderPath) {
            loader = require(loaderPath);
            return _this.registerLoader(loader, done);
          });
        };
      })(this));
    };

    ComponentLoader.prototype.listComponents = function(callback) {
      var done;
      if (this.processing) {
        this.once('ready', (function(_this) {
          return function() {
            return callback(_this.components);
          };
        })(this));
        return;
      }
      if (this.components) {
        return callback(this.components);
      }
      this.ready = false;
      this.processing = true;
      if (this.options.cache && !this.failedCache) {
        this.readCache((function(_this) {
          return function(err) {
            if (err) {
              _this.failedCache = true;
              _this.processing = false;
              _this.listComponents(callback);
              return;
            }
            _this.ready = true;
            _this.processing = false;
            _this.emit('ready', true);
            if (callback) {
              return callback(_this.components);
            }
          };
        })(this));
        return;
      }
      this.components = {};
      done = _.after(2, (function(_this) {
        return function() {
          _this.ready = true;
          _this.processing = false;
          _this.emit('ready', true);
          if (callback) {
            callback(_this.components);
          }
          if (_this.options.cache) {
            return _this.writeCache();
          }
        };
      })(this));
      this.getCoreComponents((function(_this) {
        return function(coreComponents) {
          var cPath, name;
          for (name in coreComponents) {
            cPath = coreComponents[name];
            _this.components[name] = cPath;
          }
          return done();
        };
      })(this));
      return reader(this.baseDir, (function(_this) {
        return function(err, data) {
          if (err) {
            return done();
          }
          return _this.getModuleComponents(data, function(components) {
            var cPath, name;
            for (name in components) {
              cPath = components[name];
              _this.components[name] = cPath;
            }
            return done();
          });
        };
      })(this));
    };

    ComponentLoader.prototype.getPackagePath = function(packageId, callback) {
      var find, found, seen;
      found = null;
      seen = [];
      find = function(packageData) {
        if (seen.indexOf(packageData.name) !== -1) {
          return;
        }
        seen.push(packageData.name);
        if (packageData.name === packageId) {
          found = path.resolve(packageData.realPath, './package.json');
          return;
        }
        return _.each(packageData.dependencies, find);
      };
      return reader(this.baseDir, function(err, data) {
        if (err) {
          return callback(err);
        }
        find(data);
        return callback(null, found);
      });
    };

    ComponentLoader.prototype.setSource = function(packageId, name, source, language, callback) {
      var e, implementation, _eval;
      if (!this.ready) {
        this.listComponents((function(_this) {
          return function() {
            return _this.setSource(packageId, name, source, language, callback);
          };
        })(this));
        return;
      }
      _eval = require('eval');
      if (language === 'coffeescript') {
        try {
          source = CoffeeScript.compile(source, {
            bare: true
          });
        } catch (_error) {
          e = _error;
          return callback(e);
        }
      }
      try {
        implementation = _eval(source, path.resolve(this.baseDir, "./components/" + name + ".js"), {}, true);
      } catch (_error) {
        e = _error;
        return callback(e);
      }
      if (!(implementation || implementation.getComponent)) {
        return callback(new Error('Provided source failed to create a runnable component'));
      }
      return this.registerComponent(packageId, name, implementation, function() {
        return callback(null);
      });
    };

    ComponentLoader.prototype.getSource = function(name, callback) {
      var component, componentName, nameParts;
      if (!this.ready) {
        this.listComponents((function(_this) {
          return function() {
            return _this.getSource(name, callback);
          };
        })(this));
        return;
      }
      component = this.components[name];
      if (!component) {
        for (componentName in this.components) {
          if (componentName.split('/')[1] === name) {
            component = this.components[componentName];
            name = componentName;
            break;
          }
        }
        if (!component) {
          return callback(new Error("Component " + name + " not installed"));
        }
      }
      if (typeof component !== 'string') {
        return callback(new Error("Can't provide source for " + name + ". Not a file"));
      }
      nameParts = name.split('/');
      if (nameParts.length === 1) {
        nameParts[1] = nameParts[0];
        nameParts[0] = '';
      }
      if (this.isGraph(component)) {
        nofloGraph.loadFile(component, function(graph) {
          if (!graph) {
            return callback(new Error('Unable to load graph'));
          }
          return callback(null, {
            name: nameParts[1],
            library: nameParts[0],
            code: JSON.stringify(graph.toJSON()),
            language: 'json'
          });
        });
        return;
      }
      return fs.readFile(component, 'utf-8', function(err, code) {
        if (err) {
          return callback(err);
        }
        return callback(null, {
          name: nameParts[1],
          library: nameParts[0],
          language: utils.guessLanguageFromFilename(component),
          code: code
        });
      });
    };

    ComponentLoader.prototype.readPackage = function(packageId, callback) {
      return this.getPackagePath(packageId, (function(_this) {
        return function(err, packageFile) {
          if (err) {
            return callback(err);
          }
          if (!packageFile) {
            return callback(new Error('no package found'));
          }
          return _this.readPackageFile(packageFile, callback);
        };
      })(this));
    };

    ComponentLoader.prototype.readPackageFile = function(packageFile, callback) {
      return fs.readFile(packageFile, 'utf-8', function(err, packageData) {
        var data;
        if (err) {
          return callback(err);
        }
        data = JSON.parse(packageData);
        data.realPath = path.dirname(packageFile);
        return callback(null, data);
      });
    };

    ComponentLoader.prototype.writePackage = function(packageId, data, callback) {
      return this.getPackagePath(packageId, function(err, packageFile) {
        var packageData;
        if (err) {
          return callback(err);
        }
        if (!packageFile) {
          return callback(new Error('no package found'));
        }
        if (data.realPath) {
          delete data.realPath;
        }
        packageData = JSON.stringify(data, null, 2);
        return fs.writeFile(packageFile, packageData, callback);
      });
    };

    ComponentLoader.prototype.registerComponentToDisk = function(packageId, name, cPath, callback) {
      if (callback == null) {
        callback = function() {};
      }
      return this.readPackage(packageId, (function(_this) {
        return function(err, packageData) {
          if (err) {
            return callback(err);
          }
          if (!packageData.noflo) {
            packageData.noflo = {};
          }
          if (!packageData.noflo.components) {
            packageData.noflo.components = {};
          }
          packageData.noflo.components[name] = cPath;
          _this.clear();
          return _this.writePackage(packageId, packageData, callback);
        };
      })(this));
    };

    ComponentLoader.prototype.registerGraphToDisk = function(packageId, name, cPath, callback) {
      if (callback == null) {
        callback = function() {};
      }
      return this.readPackage(packageId, (function(_this) {
        return function(err, packageData) {
          if (err) {
            return callback(err);
          }
          if (!packageData.noflo) {
            packageData.noflo = {};
          }
          if (!packageData.noflo.graphs) {
            packageData.noflo.graphs = {};
          }
          packageData.noflo.graphs[name] = cPath;
          _this.clear();
          return _this.writePackage(packageId, packageData, callback);
        };
      })(this));
    };

    return ComponentLoader;

  })(loader.ComponentLoader);

  exports.ComponentLoader = ComponentLoader;

}).call(this);

}).call(this,"/node_modules/noflo/lib/nodejs/ComponentLoader.js","/node_modules/noflo/lib/nodejs")
},{"../ComponentLoader":26,"../Graph":27,"../InternalSocket":30,"../Utils":40,"coffee-script":42,"eval":51,"fs":2,"npmlog":54,"path":11,"read-installed":97,"underscore":98}],42:[function(require,module,exports){
(function (process,global){
// Generated by CoffeeScript 1.9.3
(function() {
  var Lexer, SourceMap, base, compile, ext, formatSourcePosition, fs, getSourceMap, helpers, i, len, lexer, parser, path, ref, sourceMaps, vm, withPrettyErrors,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  fs = require('fs');

  vm = require('vm');

  path = require('path');

  Lexer = require('./lexer').Lexer;

  parser = require('./parser').parser;

  helpers = require('./helpers');

  SourceMap = require('./sourcemap');

  exports.VERSION = '1.9.3';

  exports.FILE_EXTENSIONS = ['.coffee', '.litcoffee', '.coffee.md'];

  exports.helpers = helpers;

  withPrettyErrors = function(fn) {
    return function(code, options) {
      var err;
      if (options == null) {
        options = {};
      }
      try {
        return fn.call(this, code, options);
      } catch (_error) {
        err = _error;
        if (typeof code !== 'string') {
          throw err;
        }
        throw helpers.updateSyntaxError(err, code, options.filename);
      }
    };
  };

  exports.compile = compile = withPrettyErrors(function(code, options) {
    var answer, currentColumn, currentLine, extend, fragment, fragments, header, i, js, len, map, merge, newLines, token, tokens;
    merge = helpers.merge, extend = helpers.extend;
    options = extend({}, options);
    if (options.sourceMap) {
      map = new SourceMap;
    }
    tokens = lexer.tokenize(code, options);
    options.referencedVars = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = tokens.length; i < len; i++) {
        token = tokens[i];
        if (token.variable) {
          results.push(token[1]);
        }
      }
      return results;
    })();
    fragments = parser.parse(tokens).compileToFragments(options);
    currentLine = 0;
    if (options.header) {
      currentLine += 1;
    }
    if (options.shiftLine) {
      currentLine += 1;
    }
    currentColumn = 0;
    js = "";
    for (i = 0, len = fragments.length; i < len; i++) {
      fragment = fragments[i];
      if (options.sourceMap) {
        if (fragment.locationData && !/^[;\s]*$/.test(fragment.code)) {
          map.add([fragment.locationData.first_line, fragment.locationData.first_column], [currentLine, currentColumn], {
            noReplace: true
          });
        }
        newLines = helpers.count(fragment.code, "\n");
        currentLine += newLines;
        if (newLines) {
          currentColumn = fragment.code.length - (fragment.code.lastIndexOf("\n") + 1);
        } else {
          currentColumn += fragment.code.length;
        }
      }
      js += fragment.code;
    }
    if (options.header) {
      header = "Generated by CoffeeScript " + this.VERSION;
      js = "// " + header + "\n" + js;
    }
    if (options.sourceMap) {
      answer = {
        js: js
      };
      answer.sourceMap = map;
      answer.v3SourceMap = map.generate(options, code);
      return answer;
    } else {
      return js;
    }
  });

  exports.tokens = withPrettyErrors(function(code, options) {
    return lexer.tokenize(code, options);
  });

  exports.nodes = withPrettyErrors(function(source, options) {
    if (typeof source === 'string') {
      return parser.parse(lexer.tokenize(source, options));
    } else {
      return parser.parse(source);
    }
  });

  exports.run = function(code, options) {
    var answer, dir, mainModule, ref;
    if (options == null) {
      options = {};
    }
    mainModule = require.main;
    mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : '.';
    mainModule.moduleCache && (mainModule.moduleCache = {});
    dir = options.filename ? path.dirname(fs.realpathSync(options.filename)) : fs.realpathSync('.');
    mainModule.paths = require('module')._nodeModulePaths(dir);
    if (!helpers.isCoffee(mainModule.filename) || require.extensions) {
      answer = compile(code, options);
      code = (ref = answer.js) != null ? ref : answer;
    }
    return mainModule._compile(code, mainModule.filename);
  };

  exports["eval"] = function(code, options) {
    var Module, _module, _require, createContext, i, isContext, js, k, len, o, r, ref, ref1, ref2, ref3, sandbox, v;
    if (options == null) {
      options = {};
    }
    if (!(code = code.trim())) {
      return;
    }
    createContext = (ref = vm.Script.createContext) != null ? ref : vm.createContext;
    isContext = (ref1 = vm.isContext) != null ? ref1 : function(ctx) {
      return options.sandbox instanceof createContext().constructor;
    };
    if (createContext) {
      if (options.sandbox != null) {
        if (isContext(options.sandbox)) {
          sandbox = options.sandbox;
        } else {
          sandbox = createContext();
          ref2 = options.sandbox;
          for (k in ref2) {
            if (!hasProp.call(ref2, k)) continue;
            v = ref2[k];
            sandbox[k] = v;
          }
        }
        sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox;
      } else {
        sandbox = global;
      }
      sandbox.__filename = options.filename || 'eval';
      sandbox.__dirname = path.dirname(sandbox.__filename);
      if (!(sandbox !== global || sandbox.module || sandbox.require)) {
        Module = require('module');
        sandbox.module = _module = new Module(options.modulename || 'eval');
        sandbox.require = _require = function(path) {
          return Module._load(path, _module, true);
        };
        _module.filename = sandbox.__filename;
        ref3 = Object.getOwnPropertyNames(require);
        for (i = 0, len = ref3.length; i < len; i++) {
          r = ref3[i];
          if (r !== 'paths') {
            _require[r] = require[r];
          }
        }
        _require.paths = _module.paths = Module._nodeModulePaths(process.cwd());
        _require.resolve = function(request) {
          return Module._resolveFilename(request, _module);
        };
      }
    }
    o = {};
    for (k in options) {
      if (!hasProp.call(options, k)) continue;
      v = options[k];
      o[k] = v;
    }
    o.bare = true;
    js = compile(code, o);
    if (sandbox === global) {
      return vm.runInThisContext(js);
    } else {
      return vm.runInContext(js, sandbox);
    }
  };

  exports.register = function() {
    return require('./register');
  };

  if (require.extensions) {
    ref = this.FILE_EXTENSIONS;
    for (i = 0, len = ref.length; i < len; i++) {
      ext = ref[i];
      if ((base = require.extensions)[ext] == null) {
        base[ext] = function() {
          throw new Error("Use CoffeeScript.register() or require the coffee-script/register module to require " + ext + " files.");
        };
      }
    }
  }

  exports._compileFile = function(filename, sourceMap) {
    var answer, err, raw, stripped;
    if (sourceMap == null) {
      sourceMap = false;
    }
    raw = fs.readFileSync(filename, 'utf8');
    stripped = raw.charCodeAt(0) === 0xFEFF ? raw.substring(1) : raw;
    try {
      answer = compile(stripped, {
        filename: filename,
        sourceMap: sourceMap,
        literate: helpers.isLiterate(filename)
      });
    } catch (_error) {
      err = _error;
      throw helpers.updateSyntaxError(err, stripped, filename);
    }
    return answer;
  };

  lexer = new Lexer;

  parser.lexer = {
    lex: function() {
      var tag, token;
      token = parser.tokens[this.pos++];
      if (token) {
        tag = token[0], this.yytext = token[1], this.yylloc = token[2];
        parser.errorToken = token.origin || token;
        this.yylineno = this.yylloc.first_line;
      } else {
        tag = '';
      }
      return tag;
    },
    setInput: function(tokens) {
      parser.tokens = tokens;
      return this.pos = 0;
    },
    upcomingInput: function() {
      return "";
    }
  };

  parser.yy = require('./nodes');

  parser.yy.parseError = function(message, arg) {
    var errorLoc, errorTag, errorText, errorToken, token, tokens;
    token = arg.token;
    errorToken = parser.errorToken, tokens = parser.tokens;
    errorTag = errorToken[0], errorText = errorToken[1], errorLoc = errorToken[2];
    errorText = (function() {
      switch (false) {
        case errorToken !== tokens[tokens.length - 1]:
          return 'end of input';
        case errorTag !== 'INDENT' && errorTag !== 'OUTDENT':
          return 'indentation';
        case errorTag !== 'IDENTIFIER' && errorTag !== 'NUMBER' && errorTag !== 'STRING' && errorTag !== 'STRING_START' && errorTag !== 'REGEX' && errorTag !== 'REGEX_START':
          return errorTag.replace(/_START$/, '').toLowerCase();
        default:
          return helpers.nameWhitespaceCharacter(errorText);
      }
    })();
    return helpers.throwSyntaxError("unexpected " + errorText, errorLoc);
  };

  formatSourcePosition = function(frame, getSourceMapping) {
    var as, column, fileLocation, fileName, functionName, isConstructor, isMethodCall, line, methodName, source, tp, typeName;
    fileName = void 0;
    fileLocation = '';
    if (frame.isNative()) {
      fileLocation = "native";
    } else {
      if (frame.isEval()) {
        fileName = frame.getScriptNameOrSourceURL();
        if (!fileName) {
          fileLocation = (frame.getEvalOrigin()) + ", ";
        }
      } else {
        fileName = frame.getFileName();
      }
      fileName || (fileName = "<anonymous>");
      line = frame.getLineNumber();
      column = frame.getColumnNumber();
      source = getSourceMapping(fileName, line, column);
      fileLocation = source ? fileName + ":" + source[0] + ":" + source[1] : fileName + ":" + line + ":" + column;
    }
    functionName = frame.getFunctionName();
    isConstructor = frame.isConstructor();
    isMethodCall = !(frame.isToplevel() || isConstructor);
    if (isMethodCall) {
      methodName = frame.getMethodName();
      typeName = frame.getTypeName();
      if (functionName) {
        tp = as = '';
        if (typeName && functionName.indexOf(typeName)) {
          tp = typeName + ".";
        }
        if (methodName && functionName.indexOf("." + methodName) !== functionName.length - methodName.length - 1) {
          as = " [as " + methodName + "]";
        }
        return "" + tp + functionName + as + " (" + fileLocation + ")";
      } else {
        return typeName + "." + (methodName || '<anonymous>') + " (" + fileLocation + ")";
      }
    } else if (isConstructor) {
      return "new " + (functionName || '<anonymous>') + " (" + fileLocation + ")";
    } else if (functionName) {
      return functionName + " (" + fileLocation + ")";
    } else {
      return fileLocation;
    }
  };

  sourceMaps = {};

  getSourceMap = function(filename) {
    var answer, ref1;
    if (sourceMaps[filename]) {
      return sourceMaps[filename];
    }
    if (ref1 = path != null ? path.extname(filename) : void 0, indexOf.call(exports.FILE_EXTENSIONS, ref1) < 0) {
      return;
    }
    answer = exports._compileFile(filename, true);
    return sourceMaps[filename] = answer.sourceMap;
  };

  Error.prepareStackTrace = function(err, stack) {
    var frame, frames, getSourceMapping;
    getSourceMapping = function(filename, line, column) {
      var answer, sourceMap;
      sourceMap = getSourceMap(filename);
      if (sourceMap) {
        answer = sourceMap.sourceLocation([line - 1, column - 1]);
      }
      if (answer) {
        return [answer[0] + 1, answer[1] + 1];
      } else {
        return null;
      }
    };
    frames = (function() {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = stack.length; j < len1; j++) {
        frame = stack[j];
        if (frame.getFunction() === exports.run) {
          break;
        }
        results.push("  at " + (formatSourcePosition(frame, getSourceMapping)));
      }
      return results;
    })();
    return (err.toString()) + "\n" + (frames.join('\n')) + "\n";
  };

}).call(this);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./helpers":43,"./lexer":44,"./nodes":45,"./parser":46,"./register":47,"./sourcemap":50,"_process":12,"fs":2,"module":2,"path":11,"vm":20}],43:[function(require,module,exports){
(function (process){
// Generated by CoffeeScript 1.9.3
(function() {
  var buildLocationData, extend, flatten, ref, repeat, syntaxErrorToString;

  exports.starts = function(string, literal, start) {
    return literal === string.substr(start, literal.length);
  };

  exports.ends = function(string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
  };

  exports.repeat = repeat = function(str, n) {
    var res;
    res = '';
    while (n > 0) {
      if (n & 1) {
        res += str;
      }
      n >>>= 1;
      str += str;
    }
    return res;
  };

  exports.compact = function(array) {
    var i, item, len1, results;
    results = [];
    for (i = 0, len1 = array.length; i < len1; i++) {
      item = array[i];
      if (item) {
        results.push(item);
      }
    }
    return results;
  };

  exports.count = function(string, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) {
      return 1 / 0;
    }
    while (pos = 1 + string.indexOf(substr, pos)) {
      num++;
    }
    return num;
  };

  exports.merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
  };

  extend = exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };

  exports.flatten = flatten = function(array) {
    var element, flattened, i, len1;
    flattened = [];
    for (i = 0, len1 = array.length; i < len1; i++) {
      element = array[i];
      if (element instanceof Array) {
        flattened = flattened.concat(flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
  };

  exports.del = function(obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
  };

  exports.some = (ref = Array.prototype.some) != null ? ref : function(fn) {
    var e, i, len1;
    for (i = 0, len1 = this.length; i < len1; i++) {
      e = this[i];
      if (fn(e)) {
        return true;
      }
    }
    return false;
  };

  exports.invertLiterate = function(code) {
    var line, lines, maybe_code;
    maybe_code = true;
    lines = (function() {
      var i, len1, ref1, results;
      ref1 = code.split('\n');
      results = [];
      for (i = 0, len1 = ref1.length; i < len1; i++) {
        line = ref1[i];
        if (maybe_code && /^([ ]{4}|[ ]{0,3}\t)/.test(line)) {
          results.push(line);
        } else if (maybe_code = /^\s*$/.test(line)) {
          results.push(line);
        } else {
          results.push('# ' + line);
        }
      }
      return results;
    })();
    return lines.join('\n');
  };

  buildLocationData = function(first, last) {
    if (!last) {
      return first;
    } else {
      return {
        first_line: first.first_line,
        first_column: first.first_column,
        last_line: last.last_line,
        last_column: last.last_column
      };
    }
  };

  exports.addLocationDataFn = function(first, last) {
    return function(obj) {
      if (((typeof obj) === 'object') && (!!obj['updateLocationDataIfMissing'])) {
        obj.updateLocationDataIfMissing(buildLocationData(first, last));
      }
      return obj;
    };
  };

  exports.locationDataToString = function(obj) {
    var locationData;
    if (("2" in obj) && ("first_line" in obj[2])) {
      locationData = obj[2];
    } else if ("first_line" in obj) {
      locationData = obj;
    }
    if (locationData) {
      return ((locationData.first_line + 1) + ":" + (locationData.first_column + 1) + "-") + ((locationData.last_line + 1) + ":" + (locationData.last_column + 1));
    } else {
      return "No location data";
    }
  };

  exports.baseFileName = function(file, stripExt, useWinPathSep) {
    var parts, pathSep;
    if (stripExt == null) {
      stripExt = false;
    }
    if (useWinPathSep == null) {
      useWinPathSep = false;
    }
    pathSep = useWinPathSep ? /\\|\// : /\//;
    parts = file.split(pathSep);
    file = parts[parts.length - 1];
    if (!(stripExt && file.indexOf('.') >= 0)) {
      return file;
    }
    parts = file.split('.');
    parts.pop();
    if (parts[parts.length - 1] === 'coffee' && parts.length > 1) {
      parts.pop();
    }
    return parts.join('.');
  };

  exports.isCoffee = function(file) {
    return /\.((lit)?coffee|coffee\.md)$/.test(file);
  };

  exports.isLiterate = function(file) {
    return /\.(litcoffee|coffee\.md)$/.test(file);
  };

  exports.throwSyntaxError = function(message, location) {
    var error;
    error = new SyntaxError(message);
    error.location = location;
    error.toString = syntaxErrorToString;
    error.stack = error.toString();
    throw error;
  };

  exports.updateSyntaxError = function(error, code, filename) {
    if (error.toString === syntaxErrorToString) {
      error.code || (error.code = code);
      error.filename || (error.filename = filename);
      error.stack = error.toString();
    }
    return error;
  };

  syntaxErrorToString = function() {
    var codeLine, colorize, colorsEnabled, end, filename, first_column, first_line, last_column, last_line, marker, ref1, ref2, ref3, ref4, start;
    if (!(this.code && this.location)) {
      return Error.prototype.toString.call(this);
    }
    ref1 = this.location, first_line = ref1.first_line, first_column = ref1.first_column, last_line = ref1.last_line, last_column = ref1.last_column;
    if (last_line == null) {
      last_line = first_line;
    }
    if (last_column == null) {
      last_column = first_column;
    }
    filename = this.filename || '[stdin]';
    codeLine = this.code.split('\n')[first_line];
    start = first_column;
    end = first_line === last_line ? last_column + 1 : codeLine.length;
    marker = codeLine.slice(0, start).replace(/[^\s]/g, ' ') + repeat('^', end - start);
    if (typeof process !== "undefined" && process !== null) {
      colorsEnabled = ((ref2 = process.stdout) != null ? ref2.isTTY : void 0) && !((ref3 = process.env) != null ? ref3.NODE_DISABLE_COLORS : void 0);
    }
    if ((ref4 = this.colorful) != null ? ref4 : colorsEnabled) {
      colorize = function(str) {
        return "\x1B[1;31m" + str + "\x1B[0m";
      };
      codeLine = codeLine.slice(0, start) + colorize(codeLine.slice(start, end)) + codeLine.slice(end);
      marker = colorize(marker);
    }
    return filename + ":" + (first_line + 1) + ":" + (first_column + 1) + ": error: " + this.message + "\n" + codeLine + "\n" + marker;
  };

  exports.nameWhitespaceCharacter = function(string) {
    switch (string) {
      case ' ':
        return 'space';
      case '\n':
        return 'newline';
      case '\r':
        return 'carriage return';
      case '\t':
        return 'tab';
      default:
        return string;
    }
  };

}).call(this);

}).call(this,require('_process'))
},{"_process":12}],44:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var BOM, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HERECOMMENT_ILLEGAL, HEREDOC_DOUBLE, HEREDOC_INDENT, HEREDOC_SINGLE, HEREGEX, HEREGEX_OMIT, IDENTIFIER, INDENTABLE_CLOSERS, INDEXABLE, INVALID_ESCAPE, INVERSES, JSTOKEN, JS_FORBIDDEN, JS_KEYWORDS, LEADING_BLANK_LINE, LINE_BREAK, LINE_CONTINUER, LOGIC, Lexer, MATH, MULTI_DENT, NOT_REGEX, NUMBER, OPERATOR, POSSIBLY_DIVISION, REGEX, REGEX_FLAGS, REGEX_ILLEGAL, RELATION, RESERVED, Rewriter, SHIFT, SIMPLE_STRING_OMIT, STRICT_PROSCRIBED, STRING_DOUBLE, STRING_OMIT, STRING_SINGLE, STRING_START, TRAILING_BLANK_LINE, TRAILING_SPACES, UNARY, UNARY_MATH, VALID_FLAGS, WHITESPACE, compact, count, invertLiterate, key, locationDataToString, ref, ref1, repeat, starts, throwSyntaxError,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('./rewriter'), Rewriter = ref.Rewriter, INVERSES = ref.INVERSES;

  ref1 = require('./helpers'), count = ref1.count, starts = ref1.starts, compact = ref1.compact, repeat = ref1.repeat, invertLiterate = ref1.invertLiterate, locationDataToString = ref1.locationDataToString, throwSyntaxError = ref1.throwSyntaxError;

  exports.Lexer = Lexer = (function() {
    function Lexer() {}

    Lexer.prototype.tokenize = function(code, opts) {
      var consumed, end, i, ref2;
      if (opts == null) {
        opts = {};
      }
      this.literate = opts.literate;
      this.indent = 0;
      this.baseIndent = 0;
      this.indebt = 0;
      this.outdebt = 0;
      this.indents = [];
      this.ends = [];
      this.tokens = [];
      this.chunkLine = opts.line || 0;
      this.chunkColumn = opts.column || 0;
      code = this.clean(code);
      i = 0;
      while (this.chunk = code.slice(i)) {
        consumed = this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
        ref2 = this.getLineAndColumnFromChunk(consumed), this.chunkLine = ref2[0], this.chunkColumn = ref2[1];
        i += consumed;
        if (opts.untilBalanced && this.ends.length === 0) {
          return {
            tokens: this.tokens,
            index: i
          };
        }
      }
      this.closeIndentation();
      if (end = this.ends.pop()) {
        this.error("missing " + end.tag, end.origin[2]);
      }
      if (opts.rewrite === false) {
        return this.tokens;
      }
      return (new Rewriter).rewrite(this.tokens);
    };

    Lexer.prototype.clean = function(code) {
      if (code.charCodeAt(0) === BOM) {
        code = code.slice(1);
      }
      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
      if (WHITESPACE.test(code)) {
        code = "\n" + code;
        this.chunkLine--;
      }
      if (this.literate) {
        code = invertLiterate(code);
      }
      return code;
    };

    Lexer.prototype.identifierToken = function() {
      var alias, colon, colonOffset, forcedIdentifier, id, idLength, input, match, poppedToken, prev, ref2, ref3, ref4, ref5, tag, tagToken;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      idLength = id.length;
      poppedToken = void 0;
      if (id === 'own' && this.tag() === 'FOR') {
        this.token('OWN', id);
        return id.length;
      }
      if (id === 'from' && this.tag() === 'YIELD') {
        this.token('FROM', id);
        return id.length;
      }
      ref2 = this.tokens, prev = ref2[ref2.length - 1];
      forcedIdentifier = colon || (prev != null) && (((ref3 = prev[0]) === '.' || ref3 === '?.' || ref3 === '::' || ref3 === '?::') || !prev.spaced && prev[0] === '@');
      tag = 'IDENTIFIER';
      if (!forcedIdentifier && (indexOf.call(JS_KEYWORDS, id) >= 0 || indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
        tag = id.toUpperCase();
        if (tag === 'WHEN' && (ref4 = this.tag(), indexOf.call(LINE_BREAK, ref4) >= 0)) {
          tag = 'LEADING_WHEN';
        } else if (tag === 'FOR') {
          this.seenFor = true;
        } else if (tag === 'UNLESS') {
          tag = 'IF';
        } else if (indexOf.call(UNARY, tag) >= 0) {
          tag = 'UNARY';
        } else if (indexOf.call(RELATION, tag) >= 0) {
          if (tag !== 'INSTANCEOF' && this.seenFor) {
            tag = 'FOR' + tag;
            this.seenFor = false;
          } else {
            tag = 'RELATION';
            if (this.value() === '!') {
              poppedToken = this.tokens.pop();
              id = '!' + id;
            }
          }
        }
      }
      if (indexOf.call(JS_FORBIDDEN, id) >= 0) {
        if (forcedIdentifier) {
          tag = 'IDENTIFIER';
          id = new String(id);
          id.reserved = true;
        } else if (indexOf.call(RESERVED, id) >= 0) {
          this.error("reserved word '" + id + "'", {
            length: id.length
          });
        }
      }
      if (!forcedIdentifier) {
        if (indexOf.call(COFFEE_ALIASES, id) >= 0) {
          alias = id;
          id = COFFEE_ALIAS_MAP[id];
        }
        tag = (function() {
          switch (id) {
            case '!':
              return 'UNARY';
            case '==':
            case '!=':
              return 'COMPARE';
            case '&&':
            case '||':
              return 'LOGIC';
            case 'true':
            case 'false':
              return 'BOOL';
            case 'break':
            case 'continue':
              return 'STATEMENT';
            default:
              return tag;
          }
        })();
      }
      tagToken = this.token(tag, id, 0, idLength);
      if (alias) {
        tagToken.origin = [tag, alias, tagToken[2]];
      }
      tagToken.variable = !forcedIdentifier;
      if (poppedToken) {
        ref5 = [poppedToken[2].first_line, poppedToken[2].first_column], tagToken[2].first_line = ref5[0], tagToken[2].first_column = ref5[1];
      }
      if (colon) {
        colonOffset = input.lastIndexOf(':');
        this.token(':', ':', colonOffset, colon.length);
      }
      return input.length;
    };

    Lexer.prototype.numberToken = function() {
      var binaryLiteral, lexedLength, match, number, octalLiteral;
      if (!(match = NUMBER.exec(this.chunk))) {
        return 0;
      }
      number = match[0];
      lexedLength = number.length;
      if (/^0[BOX]/.test(number)) {
        this.error("radix prefix in '" + number + "' must be lowercase", {
          offset: 1
        });
      } else if (/E/.test(number) && !/^0x/.test(number)) {
        this.error("exponential notation in '" + number + "' must be indicated with a lowercase 'e'", {
          offset: number.indexOf('E')
        });
      } else if (/^0\d*[89]/.test(number)) {
        this.error("decimal literal '" + number + "' must not be prefixed with '0'", {
          length: lexedLength
        });
      } else if (/^0\d+/.test(number)) {
        this.error("octal literal '" + number + "' must be prefixed with '0o'", {
          length: lexedLength
        });
      }
      if (octalLiteral = /^0o([0-7]+)/.exec(number)) {
        number = '0x' + parseInt(octalLiteral[1], 8).toString(16);
      }
      if (binaryLiteral = /^0b([01]+)/.exec(number)) {
        number = '0x' + parseInt(binaryLiteral[1], 2).toString(16);
      }
      this.token('NUMBER', number, 0, lexedLength);
      return lexedLength;
    };

    Lexer.prototype.stringToken = function() {
      var $, attempt, delimiter, doc, end, heredoc, i, indent, indentRegex, match, quote, ref2, ref3, regex, token, tokens;
      quote = (STRING_START.exec(this.chunk) || [])[0];
      if (!quote) {
        return 0;
      }
      regex = (function() {
        switch (quote) {
          case "'":
            return STRING_SINGLE;
          case '"':
            return STRING_DOUBLE;
          case "'''":
            return HEREDOC_SINGLE;
          case '"""':
            return HEREDOC_DOUBLE;
        }
      })();
      heredoc = quote.length === 3;
      ref2 = this.matchWithInterpolations(regex, quote), tokens = ref2.tokens, end = ref2.index;
      $ = tokens.length - 1;
      delimiter = quote.charAt(0);
      if (heredoc) {
        indent = null;
        doc = ((function() {
          var j, len, results;
          results = [];
          for (i = j = 0, len = tokens.length; j < len; i = ++j) {
            token = tokens[i];
            if (token[0] === 'NEOSTRING') {
              results.push(token[1]);
            }
          }
          return results;
        })()).join('#{}');
        while (match = HEREDOC_INDENT.exec(doc)) {
          attempt = match[1];
          if (indent === null || (0 < (ref3 = attempt.length) && ref3 < indent.length)) {
            indent = attempt;
          }
        }
        if (indent) {
          indentRegex = RegExp("^" + indent, "gm");
        }
        this.mergeInterpolationTokens(tokens, {
          delimiter: delimiter
        }, (function(_this) {
          return function(value, i) {
            value = _this.formatString(value);
            if (i === 0) {
              value = value.replace(LEADING_BLANK_LINE, '');
            }
            if (i === $) {
              value = value.replace(TRAILING_BLANK_LINE, '');
            }
            if (indentRegex) {
              value = value.replace(indentRegex, '');
            }
            return value;
          };
        })(this));
      } else {
        this.mergeInterpolationTokens(tokens, {
          delimiter: delimiter
        }, (function(_this) {
          return function(value, i) {
            value = _this.formatString(value);
            value = value.replace(SIMPLE_STRING_OMIT, function(match, offset) {
              if ((i === 0 && offset === 0) || (i === $ && offset + match.length === value.length)) {
                return '';
              } else {
                return ' ';
              }
            });
            return value;
          };
        })(this));
      }
      return end;
    };

    Lexer.prototype.commentToken = function() {
      var comment, here, match;
      if (!(match = this.chunk.match(COMMENT))) {
        return 0;
      }
      comment = match[0], here = match[1];
      if (here) {
        if (match = HERECOMMENT_ILLEGAL.exec(comment)) {
          this.error("block comments cannot contain " + match[0], {
            offset: match.index,
            length: match[0].length
          });
        }
        if (here.indexOf('\n') >= 0) {
          here = here.replace(RegExp("\\n" + (repeat(' ', this.indent)), "g"), '\n');
        }
        this.token('HERECOMMENT', here, 0, comment.length);
      }
      return comment.length;
    };

    Lexer.prototype.jsToken = function() {
      var match, script;
      if (!(this.chunk.charAt(0) === '`' && (match = JSTOKEN.exec(this.chunk)))) {
        return 0;
      }
      this.token('JS', (script = match[0]).slice(1, -1), 0, script.length);
      return script.length;
    };

    Lexer.prototype.regexToken = function() {
      var body, closed, end, flags, index, match, origin, prev, ref2, ref3, ref4, regex, tokens;
      switch (false) {
        case !(match = REGEX_ILLEGAL.exec(this.chunk)):
          this.error("regular expressions cannot begin with " + match[2], {
            offset: match.index + match[1].length
          });
          break;
        case !(match = this.matchWithInterpolations(HEREGEX, '///')):
          tokens = match.tokens, index = match.index;
          break;
        case !(match = REGEX.exec(this.chunk)):
          regex = match[0], body = match[1], closed = match[2];
          this.validateEscapes(body, {
            isRegex: true,
            offsetInChunk: 1
          });
          index = regex.length;
          ref2 = this.tokens, prev = ref2[ref2.length - 1];
          if (prev) {
            if (prev.spaced && (ref3 = prev[0], indexOf.call(CALLABLE, ref3) >= 0)) {
              if (!closed || POSSIBLY_DIVISION.test(regex)) {
                return 0;
              }
            } else if (ref4 = prev[0], indexOf.call(NOT_REGEX, ref4) >= 0) {
              return 0;
            }
          }
          if (!closed) {
            this.error('missing / (unclosed regex)');
          }
          break;
        default:
          return 0;
      }
      flags = REGEX_FLAGS.exec(this.chunk.slice(index))[0];
      end = index + flags.length;
      origin = this.makeToken('REGEX', null, 0, end);
      switch (false) {
        case !!VALID_FLAGS.test(flags):
          this.error("invalid regular expression flags " + flags, {
            offset: index,
            length: flags.length
          });
          break;
        case !(regex || tokens.length === 1):
          if (body == null) {
            body = this.formatHeregex(tokens[0][1]);
          }
          this.token('REGEX', "" + (this.makeDelimitedLiteral(body, {
            delimiter: '/'
          })) + flags, 0, end, origin);
          break;
        default:
          this.token('REGEX_START', '(', 0, 0, origin);
          this.token('IDENTIFIER', 'RegExp', 0, 0);
          this.token('CALL_START', '(', 0, 0);
          this.mergeInterpolationTokens(tokens, {
            delimiter: '"',
            double: true
          }, this.formatHeregex);
          if (flags) {
            this.token(',', ',', index, 0);
            this.token('STRING', '"' + flags + '"', index, flags.length);
          }
          this.token(')', ')', end, 0);
          this.token('REGEX_END', ')', end, 0);
      }
      return end;
    };

    Lexer.prototype.lineToken = function() {
      var diff, indent, match, noNewlines, size;
      if (!(match = MULTI_DENT.exec(this.chunk))) {
        return 0;
      }
      indent = match[0];
      this.seenFor = false;
      size = indent.length - 1 - indent.lastIndexOf('\n');
      noNewlines = this.unfinished();
      if (size - this.indebt === this.indent) {
        if (noNewlines) {
          this.suppressNewlines();
        } else {
          this.newlineToken(0);
        }
        return indent.length;
      }
      if (size > this.indent) {
        if (noNewlines) {
          this.indebt = size - this.indent;
          this.suppressNewlines();
          return indent.length;
        }
        if (!this.tokens.length) {
          this.baseIndent = this.indent = size;
          return indent.length;
        }
        diff = size - this.indent + this.outdebt;
        this.token('INDENT', diff, indent.length - size, size);
        this.indents.push(diff);
        this.ends.push({
          tag: 'OUTDENT'
        });
        this.outdebt = this.indebt = 0;
        this.indent = size;
      } else if (size < this.baseIndent) {
        this.error('missing indentation', {
          offset: indent.length
        });
      } else {
        this.indebt = 0;
        this.outdentToken(this.indent - size, noNewlines, indent.length);
      }
      return indent.length;
    };

    Lexer.prototype.outdentToken = function(moveOut, noNewlines, outdentLength) {
      var decreasedIndent, dent, lastIndent, ref2;
      decreasedIndent = this.indent - moveOut;
      while (moveOut > 0) {
        lastIndent = this.indents[this.indents.length - 1];
        if (!lastIndent) {
          moveOut = 0;
        } else if (lastIndent === this.outdebt) {
          moveOut -= this.outdebt;
          this.outdebt = 0;
        } else if (lastIndent < this.outdebt) {
          this.outdebt -= lastIndent;
          moveOut -= lastIndent;
        } else {
          dent = this.indents.pop() + this.outdebt;
          if (outdentLength && (ref2 = this.chunk[outdentLength], indexOf.call(INDENTABLE_CLOSERS, ref2) >= 0)) {
            decreasedIndent -= dent - moveOut;
            moveOut = dent;
          }
          this.outdebt = 0;
          this.pair('OUTDENT');
          this.token('OUTDENT', moveOut, 0, outdentLength);
          moveOut -= dent;
        }
      }
      if (dent) {
        this.outdebt -= moveOut;
      }
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
        this.token('TERMINATOR', '\n', outdentLength, 0);
      }
      this.indent = decreasedIndent;
      return this;
    };

    Lexer.prototype.whitespaceToken = function() {
      var match, nline, prev, ref2;
      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
        return 0;
      }
      ref2 = this.tokens, prev = ref2[ref2.length - 1];
      if (prev) {
        prev[match ? 'spaced' : 'newLine'] = true;
      }
      if (match) {
        return match[0].length;
      } else {
        return 0;
      }
    };

    Lexer.prototype.newlineToken = function(offset) {
      while (this.value() === ';') {
        this.tokens.pop();
      }
      if (this.tag() !== 'TERMINATOR') {
        this.token('TERMINATOR', '\n', offset, 0);
      }
      return this;
    };

    Lexer.prototype.suppressNewlines = function() {
      if (this.value() === '\\') {
        this.tokens.pop();
      }
      return this;
    };

    Lexer.prototype.literalToken = function() {
      var match, prev, ref2, ref3, ref4, ref5, ref6, tag, token, value;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
        if (CODE.test(value)) {
          this.tagParameters();
        }
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      ref2 = this.tokens, prev = ref2[ref2.length - 1];
      if (value === '=' && prev) {
        if (!prev[1].reserved && (ref3 = prev[1], indexOf.call(JS_FORBIDDEN, ref3) >= 0)) {
          if (prev.origin) {
            prev = prev.origin;
          }
          this.error("reserved word '" + prev[1] + "' can't be assigned", prev[2]);
        }
        if ((ref4 = prev[1]) === '||' || ref4 === '&&') {
          prev[0] = 'COMPOUND_ASSIGN';
          prev[1] += '=';
          return value.length;
        }
      }
      if (value === ';') {
        this.seenFor = false;
        tag = 'TERMINATOR';
      } else if (indexOf.call(MATH, value) >= 0) {
        tag = 'MATH';
      } else if (indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
        tag = 'COMPOUND_ASSIGN';
      } else if (indexOf.call(UNARY, value) >= 0) {
        tag = 'UNARY';
      } else if (indexOf.call(UNARY_MATH, value) >= 0) {
        tag = 'UNARY_MATH';
      } else if (indexOf.call(SHIFT, value) >= 0) {
        tag = 'SHIFT';
      } else if (indexOf.call(LOGIC, value) >= 0 || value === '?' && (prev != null ? prev.spaced : void 0)) {
        tag = 'LOGIC';
      } else if (prev && !prev.spaced) {
        if (value === '(' && (ref5 = prev[0], indexOf.call(CALLABLE, ref5) >= 0)) {
          if (prev[0] === '?') {
            prev[0] = 'FUNC_EXIST';
          }
          tag = 'CALL_START';
        } else if (value === '[' && (ref6 = prev[0], indexOf.call(INDEXABLE, ref6) >= 0)) {
          tag = 'INDEX_START';
          switch (prev[0]) {
            case '?':
              prev[0] = 'INDEX_SOAK';
          }
        }
      }
      token = this.makeToken(tag, value);
      switch (value) {
        case '(':
        case '{':
        case '[':
          this.ends.push({
            tag: INVERSES[value],
            origin: token
          });
          break;
        case ')':
        case '}':
        case ']':
          this.pair(value);
      }
      this.tokens.push(token);
      return value.length;
    };

    Lexer.prototype.tagParameters = function() {
      var i, stack, tok, tokens;
      if (this.tag() !== ')') {
        return this;
      }
      stack = [];
      tokens = this.tokens;
      i = tokens.length;
      tokens[--i][0] = 'PARAM_END';
      while (tok = tokens[--i]) {
        switch (tok[0]) {
          case ')':
            stack.push(tok);
            break;
          case '(':
          case 'CALL_START':
            if (stack.length) {
              stack.pop();
            } else if (tok[0] === '(') {
              tok[0] = 'PARAM_START';
              return this;
            } else {
              return this;
            }
        }
      }
      return this;
    };

    Lexer.prototype.closeIndentation = function() {
      return this.outdentToken(this.indent);
    };

    Lexer.prototype.matchWithInterpolations = function(regex, delimiter) {
      var close, column, firstToken, index, lastToken, line, nested, offsetInChunk, open, ref2, ref3, ref4, str, strPart, tokens;
      tokens = [];
      offsetInChunk = delimiter.length;
      if (this.chunk.slice(0, offsetInChunk) !== delimiter) {
        return null;
      }
      str = this.chunk.slice(offsetInChunk);
      while (true) {
        strPart = regex.exec(str)[0];
        this.validateEscapes(strPart, {
          isRegex: delimiter.charAt(0) === '/',
          offsetInChunk: offsetInChunk
        });
        tokens.push(this.makeToken('NEOSTRING', strPart, offsetInChunk));
        str = str.slice(strPart.length);
        offsetInChunk += strPart.length;
        if (str.slice(0, 2) !== '#{') {
          break;
        }
        ref2 = this.getLineAndColumnFromChunk(offsetInChunk + 1), line = ref2[0], column = ref2[1];
        ref3 = new Lexer().tokenize(str.slice(1), {
          line: line,
          column: column,
          untilBalanced: true
        }), nested = ref3.tokens, index = ref3.index;
        index += 1;
        open = nested[0], close = nested[nested.length - 1];
        open[0] = open[1] = '(';
        close[0] = close[1] = ')';
        close.origin = ['', 'end of interpolation', close[2]];
        if (((ref4 = nested[1]) != null ? ref4[0] : void 0) === 'TERMINATOR') {
          nested.splice(1, 1);
        }
        tokens.push(['TOKENS', nested]);
        str = str.slice(index);
        offsetInChunk += index;
      }
      if (str.slice(0, delimiter.length) !== delimiter) {
        this.error("missing " + delimiter, {
          length: delimiter.length
        });
      }
      firstToken = tokens[0], lastToken = tokens[tokens.length - 1];
      firstToken[2].first_column -= delimiter.length;
      lastToken[2].last_column += delimiter.length;
      if (lastToken[1].length === 0) {
        lastToken[2].last_column -= 1;
      }
      return {
        tokens: tokens,
        index: offsetInChunk + delimiter.length
      };
    };

    Lexer.prototype.mergeInterpolationTokens = function(tokens, options, fn) {
      var converted, firstEmptyStringIndex, firstIndex, i, j, lastToken, len, locationToken, lparen, plusToken, ref2, rparen, tag, token, tokensToPush, value;
      if (tokens.length > 1) {
        lparen = this.token('STRING_START', '(', 0, 0);
      }
      firstIndex = this.tokens.length;
      for (i = j = 0, len = tokens.length; j < len; i = ++j) {
        token = tokens[i];
        tag = token[0], value = token[1];
        switch (tag) {
          case 'TOKENS':
            if (value.length === 2) {
              continue;
            }
            locationToken = value[0];
            tokensToPush = value;
            break;
          case 'NEOSTRING':
            converted = fn(token[1], i);
            if (converted.length === 0) {
              if (i === 0) {
                firstEmptyStringIndex = this.tokens.length;
              } else {
                continue;
              }
            }
            if (i === 2 && (firstEmptyStringIndex != null)) {
              this.tokens.splice(firstEmptyStringIndex, 2);
            }
            token[0] = 'STRING';
            token[1] = this.makeDelimitedLiteral(converted, options);
            locationToken = token;
            tokensToPush = [token];
        }
        if (this.tokens.length > firstIndex) {
          plusToken = this.token('+', '+');
          plusToken[2] = {
            first_line: locationToken[2].first_line,
            first_column: locationToken[2].first_column,
            last_line: locationToken[2].first_line,
            last_column: locationToken[2].first_column
          };
        }
        (ref2 = this.tokens).push.apply(ref2, tokensToPush);
      }
      if (lparen) {
        lastToken = tokens[tokens.length - 1];
        lparen.origin = [
          'STRING', null, {
            first_line: lparen[2].first_line,
            first_column: lparen[2].first_column,
            last_line: lastToken[2].last_line,
            last_column: lastToken[2].last_column
          }
        ];
        rparen = this.token('STRING_END', ')');
        return rparen[2] = {
          first_line: lastToken[2].last_line,
          first_column: lastToken[2].last_column,
          last_line: lastToken[2].last_line,
          last_column: lastToken[2].last_column
        };
      }
    };

    Lexer.prototype.pair = function(tag) {
      var lastIndent, prev, ref2, ref3, wanted;
      ref2 = this.ends, prev = ref2[ref2.length - 1];
      if (tag !== (wanted = prev != null ? prev.tag : void 0)) {
        if ('OUTDENT' !== wanted) {
          this.error("unmatched " + tag);
        }
        ref3 = this.indents, lastIndent = ref3[ref3.length - 1];
        this.outdentToken(lastIndent, true);
        return this.pair(tag);
      }
      return this.ends.pop();
    };

    Lexer.prototype.getLineAndColumnFromChunk = function(offset) {
      var column, lastLine, lineCount, ref2, string;
      if (offset === 0) {
        return [this.chunkLine, this.chunkColumn];
      }
      if (offset >= this.chunk.length) {
        string = this.chunk;
      } else {
        string = this.chunk.slice(0, +(offset - 1) + 1 || 9e9);
      }
      lineCount = count(string, '\n');
      column = this.chunkColumn;
      if (lineCount > 0) {
        ref2 = string.split('\n'), lastLine = ref2[ref2.length - 1];
        column = lastLine.length;
      } else {
        column += string.length;
      }
      return [this.chunkLine + lineCount, column];
    };

    Lexer.prototype.makeToken = function(tag, value, offsetInChunk, length) {
      var lastCharacter, locationData, ref2, ref3, token;
      if (offsetInChunk == null) {
        offsetInChunk = 0;
      }
      if (length == null) {
        length = value.length;
      }
      locationData = {};
      ref2 = this.getLineAndColumnFromChunk(offsetInChunk), locationData.first_line = ref2[0], locationData.first_column = ref2[1];
      lastCharacter = Math.max(0, length - 1);
      ref3 = this.getLineAndColumnFromChunk(offsetInChunk + lastCharacter), locationData.last_line = ref3[0], locationData.last_column = ref3[1];
      token = [tag, value, locationData];
      return token;
    };

    Lexer.prototype.token = function(tag, value, offsetInChunk, length, origin) {
      var token;
      token = this.makeToken(tag, value, offsetInChunk, length);
      if (origin) {
        token.origin = origin;
      }
      this.tokens.push(token);
      return token;
    };

    Lexer.prototype.tag = function() {
      var ref2, token;
      ref2 = this.tokens, token = ref2[ref2.length - 1];
      return token != null ? token[0] : void 0;
    };

    Lexer.prototype.value = function() {
      var ref2, token;
      ref2 = this.tokens, token = ref2[ref2.length - 1];
      return token != null ? token[1] : void 0;
    };

    Lexer.prototype.unfinished = function() {
      var ref2;
      return LINE_CONTINUER.test(this.chunk) || ((ref2 = this.tag()) === '\\' || ref2 === '.' || ref2 === '?.' || ref2 === '?::' || ref2 === 'UNARY' || ref2 === 'MATH' || ref2 === 'UNARY_MATH' || ref2 === '+' || ref2 === '-' || ref2 === 'YIELD' || ref2 === '**' || ref2 === 'SHIFT' || ref2 === 'RELATION' || ref2 === 'COMPARE' || ref2 === 'LOGIC' || ref2 === 'THROW' || ref2 === 'EXTENDS');
    };

    Lexer.prototype.formatString = function(str) {
      return str.replace(STRING_OMIT, '$1');
    };

    Lexer.prototype.formatHeregex = function(str) {
      return str.replace(HEREGEX_OMIT, '$1$2');
    };

    Lexer.prototype.validateEscapes = function(str, options) {
      var before, hex, invalidEscape, match, message, octal, ref2, unicode;
      if (options == null) {
        options = {};
      }
      match = INVALID_ESCAPE.exec(str);
      if (!match) {
        return;
      }
      match[0], before = match[1], octal = match[2], hex = match[3], unicode = match[4];
      if (options.isRegex && octal && octal.charAt(0) !== '0') {
        return;
      }
      message = octal ? "octal escape sequences are not allowed" : "invalid escape sequence";
      invalidEscape = "\\" + (octal || hex || unicode);
      return this.error(message + " " + invalidEscape, {
        offset: ((ref2 = options.offsetInChunk) != null ? ref2 : 0) + match.index + before.length,
        length: invalidEscape.length
      });
    };

    Lexer.prototype.makeDelimitedLiteral = function(body, options) {
      var regex;
      if (options == null) {
        options = {};
      }
      if (body === '' && options.delimiter === '/') {
        body = '(?:)';
      }
      regex = RegExp("(\\\\\\\\)|(\\\\0(?=[1-7]))|\\\\?(" + options.delimiter + ")|\\\\?(?:(\\n)|(\\r)|(\\u2028)|(\\u2029))|(\\\\.)", "g");
      body = body.replace(regex, function(match, backslash, nul, delimiter, lf, cr, ls, ps, other) {
        switch (false) {
          case !backslash:
            if (options.double) {
              return backslash + backslash;
            } else {
              return backslash;
            }
          case !nul:
            return '\\x00';
          case !delimiter:
            return "\\" + delimiter;
          case !lf:
            return '\\n';
          case !cr:
            return '\\r';
          case !ls:
            return '\\u2028';
          case !ps:
            return '\\u2029';
          case !other:
            if (options.double) {
              return "\\" + other;
            } else {
              return other;
            }
        }
      });
      return "" + options.delimiter + body + options.delimiter;
    };

    Lexer.prototype.error = function(message, options) {
      var first_column, first_line, location, ref2, ref3, ref4;
      if (options == null) {
        options = {};
      }
      location = 'first_line' in options ? options : ((ref3 = this.getLineAndColumnFromChunk((ref2 = options.offset) != null ? ref2 : 0), first_line = ref3[0], first_column = ref3[1], ref3), {
        first_line: first_line,
        first_column: first_column,
        last_column: first_column + ((ref4 = options.length) != null ? ref4 : 1) - 1
      });
      return throwSyntaxError(message, location);
    };

    return Lexer;

  })();

  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'yield', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];

  COFFEE_KEYWORDS = ['undefined', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when'];

  COFFEE_ALIAS_MAP = {
    and: '&&',
    or: '||',
    is: '==',
    isnt: '!=',
    not: '!',
    yes: 'true',
    no: 'false',
    on: 'true',
    off: 'false'
  };

  COFFEE_ALIASES = (function() {
    var results;
    results = [];
    for (key in COFFEE_ALIAS_MAP) {
      results.push(key);
    }
    return results;
  })();

  COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);

  RESERVED = ['case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 'native', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static'];

  STRICT_PROSCRIBED = ['arguments', 'eval', 'yield*'];

  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED).concat(STRICT_PROSCRIBED);

  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS).concat(STRICT_PROSCRIBED);

  exports.STRICT_PROSCRIBED = STRICT_PROSCRIBED;

  BOM = 65279;

  IDENTIFIER = /^(?!\d)((?:(?!\s)[$\w\x7f-\uffff])+)([^\n\S]*:(?!:))?/;

  NUMBER = /^0b[01]+|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>*\/%])\2=?|\?(\.|::)|\.{2,3})/;

  WHITESPACE = /^[^\n\S]+/;

  COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|###$)|^(?:\s*#(?!##[^#]).*)+/;

  CODE = /^[-=]>/;

  MULTI_DENT = /^(?:\n[^\n\S]*)+/;

  JSTOKEN = /^`[^\\`]*(?:\\.[^\\`]*)*`/;

  STRING_START = /^(?:'''|"""|'|")/;

  STRING_SINGLE = /^(?:[^\\']|\\[\s\S])*/;

  STRING_DOUBLE = /^(?:[^\\"#]|\\[\s\S]|\#(?!\{))*/;

  HEREDOC_SINGLE = /^(?:[^\\']|\\[\s\S]|'(?!''))*/;

  HEREDOC_DOUBLE = /^(?:[^\\"#]|\\[\s\S]|"(?!"")|\#(?!\{))*/;

  STRING_OMIT = /((?:\\\\)+)|\\[^\S\n]*\n\s*/g;

  SIMPLE_STRING_OMIT = /\s*\n\s*/g;

  HEREDOC_INDENT = /\n+([^\n\S]*)(?=\S)/g;

  REGEX = /^\/(?!\/)((?:[^[\/\n\\]|\\[^\n]|\[(?:\\[^\n]|[^\]\n\\])*\])*)(\/)?/;

  REGEX_FLAGS = /^\w*/;

  VALID_FLAGS = /^(?!.*(.).*\1)[imgy]*$/;

  HEREGEX = /^(?:[^\\\/#]|\\[\s\S]|\/(?!\/\/)|\#(?!\{))*/;

  HEREGEX_OMIT = /((?:\\\\)+)|\\(\s)|\s+(?:#.*)?/g;

  REGEX_ILLEGAL = /^(\/|\/{3}\s*)(\*)/;

  POSSIBLY_DIVISION = /^\/=?\s/;

  HERECOMMENT_ILLEGAL = /\*\//;

  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;

  INVALID_ESCAPE = /((?:^|[^\\])(?:\\\\)*)\\(?:(0[0-7]|[1-7])|(x(?![\da-fA-F]{2}).{0,2})|(u(?![\da-fA-F]{4}).{0,4}))/;

  LEADING_BLANK_LINE = /^[^\n\S]*\n/;

  TRAILING_BLANK_LINE = /\n[^\n\S]*$/;

  TRAILING_SPACES = /\s+$/;

  COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|=', '**=', '//=', '%%='];

  UNARY = ['NEW', 'TYPEOF', 'DELETE', 'DO'];

  UNARY_MATH = ['!', '~'];

  LOGIC = ['&&', '||', '&', '|', '^'];

  SHIFT = ['<<', '>>', '>>>'];

  COMPARE = ['==', '!=', '<', '>', '<=', '>='];

  MATH = ['*', '/', '%', '//', '%%'];

  RELATION = ['IN', 'OF', 'INSTANCEOF'];

  BOOL = ['TRUE', 'FALSE'];

  CALLABLE = ['IDENTIFIER', ')', ']', '?', '@', 'THIS', 'SUPER'];

  INDEXABLE = CALLABLE.concat(['NUMBER', 'STRING', 'STRING_END', 'REGEX', 'REGEX_END', 'BOOL', 'NULL', 'UNDEFINED', '}', '::']);

  NOT_REGEX = INDEXABLE.concat(['++', '--']);

  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];

  INDENTABLE_CLOSERS = [')', '}', ']'];

}).call(this);

},{"./helpers":43,"./rewriter":48}],45:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var Access, Arr, Assign, Base, Block, Call, Class, Code, CodeFragment, Comment, Existence, Expansion, Extends, For, HEXNUM, IDENTIFIER, IS_REGEX, IS_STRING, If, In, Index, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, NEGATE, NO, NUMBER, Obj, Op, Param, Parens, RESERVED, Range, Return, SIMPLENUM, STRICT_PROSCRIBED, Scope, Slice, Splat, Switch, TAB, THIS, Throw, Try, UTILITIES, Value, While, YES, addLocationDataFn, compact, del, ends, extend, flatten, fragmentsToText, isComplexOrAssignable, isLiteralArguments, isLiteralThis, locationDataToString, merge, multident, parseNum, ref1, ref2, some, starts, throwSyntaxError, unfoldSoak, utility,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  Error.stackTraceLimit = Infinity;

  Scope = require('./scope').Scope;

  ref1 = require('./lexer'), RESERVED = ref1.RESERVED, STRICT_PROSCRIBED = ref1.STRICT_PROSCRIBED;

  ref2 = require('./helpers'), compact = ref2.compact, flatten = ref2.flatten, extend = ref2.extend, merge = ref2.merge, del = ref2.del, starts = ref2.starts, ends = ref2.ends, some = ref2.some, addLocationDataFn = ref2.addLocationDataFn, locationDataToString = ref2.locationDataToString, throwSyntaxError = ref2.throwSyntaxError;

  exports.extend = extend;

  exports.addLocationDataFn = addLocationDataFn;

  YES = function() {
    return true;
  };

  NO = function() {
    return false;
  };

  THIS = function() {
    return this;
  };

  NEGATE = function() {
    this.negated = !this.negated;
    return this;
  };

  exports.CodeFragment = CodeFragment = (function() {
    function CodeFragment(parent, code) {
      var ref3;
      this.code = "" + code;
      this.locationData = parent != null ? parent.locationData : void 0;
      this.type = (parent != null ? (ref3 = parent.constructor) != null ? ref3.name : void 0 : void 0) || 'unknown';
    }

    CodeFragment.prototype.toString = function() {
      return "" + this.code + (this.locationData ? ": " + locationDataToString(this.locationData) : '');
    };

    return CodeFragment;

  })();

  fragmentsToText = function(fragments) {
    var fragment;
    return ((function() {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = fragments.length; j < len1; j++) {
        fragment = fragments[j];
        results.push(fragment.code);
      }
      return results;
    })()).join('');
  };

  exports.Base = Base = (function() {
    function Base() {}

    Base.prototype.compile = function(o, lvl) {
      return fragmentsToText(this.compileToFragments(o, lvl));
    };

    Base.prototype.compileToFragments = function(o, lvl) {
      var node;
      o = extend({}, o);
      if (lvl) {
        o.level = lvl;
      }
      node = this.unfoldSoak(o) || this;
      node.tab = o.indent;
      if (o.level === LEVEL_TOP || !node.isStatement(o)) {
        return node.compileNode(o);
      } else {
        return node.compileClosure(o);
      }
    };

    Base.prototype.compileClosure = function(o) {
      var args, argumentsNode, func, jumpNode, meth, parts, ref3;
      if (jumpNode = this.jumps()) {
        jumpNode.error('cannot use a pure statement in an expression');
      }
      o.sharedScope = true;
      func = new Code([], Block.wrap([this]));
      args = [];
      if ((argumentsNode = this.contains(isLiteralArguments)) || this.contains(isLiteralThis)) {
        args = [new Literal('this')];
        if (argumentsNode) {
          meth = 'apply';
          args.push(new Literal('arguments'));
        } else {
          meth = 'call';
        }
        func = new Value(func, [new Access(new Literal(meth))]);
      }
      parts = (new Call(func, args)).compileNode(o);
      if (func.isGenerator || ((ref3 = func.base) != null ? ref3.isGenerator : void 0)) {
        parts.unshift(this.makeCode("(yield* "));
        parts.push(this.makeCode(")"));
      }
      return parts;
    };

    Base.prototype.cache = function(o, level, isComplex) {
      var complex, ref, sub;
      complex = isComplex != null ? isComplex(this) : this.isComplex();
      if (complex) {
        ref = new Literal(o.scope.freeVariable('ref'));
        sub = new Assign(ref, this);
        if (level) {
          return [sub.compileToFragments(o, level), [this.makeCode(ref.value)]];
        } else {
          return [sub, ref];
        }
      } else {
        ref = level ? this.compileToFragments(o, level) : this;
        return [ref, ref];
      }
    };

    Base.prototype.cacheToCodeFragments = function(cacheValues) {
      return [fragmentsToText(cacheValues[0]), fragmentsToText(cacheValues[1])];
    };

    Base.prototype.makeReturn = function(res) {
      var me;
      me = this.unwrapAll();
      if (res) {
        return new Call(new Literal(res + ".push"), [me]);
      } else {
        return new Return(me);
      }
    };

    Base.prototype.contains = function(pred) {
      var node;
      node = void 0;
      this.traverseChildren(false, function(n) {
        if (pred(n)) {
          node = n;
          return false;
        }
      });
      return node;
    };

    Base.prototype.lastNonComment = function(list) {
      var i;
      i = list.length;
      while (i--) {
        if (!(list[i] instanceof Comment)) {
          return list[i];
        }
      }
      return null;
    };

    Base.prototype.toString = function(idt, name) {
      var tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.soak) {
        tree += '?';
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };

    Base.prototype.eachChild = function(func) {
      var attr, child, j, k, len1, len2, ref3, ref4;
      if (!this.children) {
        return this;
      }
      ref3 = this.children;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        attr = ref3[j];
        if (this[attr]) {
          ref4 = flatten([this[attr]]);
          for (k = 0, len2 = ref4.length; k < len2; k++) {
            child = ref4[k];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };

    Base.prototype.traverseChildren = function(crossScope, func) {
      return this.eachChild(function(child) {
        var recur;
        recur = func(child);
        if (recur !== false) {
          return child.traverseChildren(crossScope, func);
        }
      });
    };

    Base.prototype.invert = function() {
      return new Op('!', this);
    };

    Base.prototype.unwrapAll = function() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };

    Base.prototype.children = [];

    Base.prototype.isStatement = NO;

    Base.prototype.jumps = NO;

    Base.prototype.isComplex = YES;

    Base.prototype.isChainable = NO;

    Base.prototype.isAssignable = NO;

    Base.prototype.unwrap = THIS;

    Base.prototype.unfoldSoak = NO;

    Base.prototype.assigns = NO;

    Base.prototype.updateLocationDataIfMissing = function(locationData) {
      if (this.locationData) {
        return this;
      }
      this.locationData = locationData;
      return this.eachChild(function(child) {
        return child.updateLocationDataIfMissing(locationData);
      });
    };

    Base.prototype.error = function(message) {
      return throwSyntaxError(message, this.locationData);
    };

    Base.prototype.makeCode = function(code) {
      return new CodeFragment(this, code);
    };

    Base.prototype.wrapInBraces = function(fragments) {
      return [].concat(this.makeCode('('), fragments, this.makeCode(')'));
    };

    Base.prototype.joinFragmentArrays = function(fragmentsList, joinStr) {
      var answer, fragments, i, j, len1;
      answer = [];
      for (i = j = 0, len1 = fragmentsList.length; j < len1; i = ++j) {
        fragments = fragmentsList[i];
        if (i) {
          answer.push(this.makeCode(joinStr));
        }
        answer = answer.concat(fragments);
      }
      return answer;
    };

    return Base;

  })();

  exports.Block = Block = (function(superClass1) {
    extend1(Block, superClass1);

    function Block(nodes) {
      this.expressions = compact(flatten(nodes || []));
    }

    Block.prototype.children = ['expressions'];

    Block.prototype.push = function(node) {
      this.expressions.push(node);
      return this;
    };

    Block.prototype.pop = function() {
      return this.expressions.pop();
    };

    Block.prototype.unshift = function(node) {
      this.expressions.unshift(node);
      return this;
    };

    Block.prototype.unwrap = function() {
      if (this.expressions.length === 1) {
        return this.expressions[0];
      } else {
        return this;
      }
    };

    Block.prototype.isEmpty = function() {
      return !this.expressions.length;
    };

    Block.prototype.isStatement = function(o) {
      var exp, j, len1, ref3;
      ref3 = this.expressions;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        exp = ref3[j];
        if (exp.isStatement(o)) {
          return true;
        }
      }
      return false;
    };

    Block.prototype.jumps = function(o) {
      var exp, j, jumpNode, len1, ref3;
      ref3 = this.expressions;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        exp = ref3[j];
        if (jumpNode = exp.jumps(o)) {
          return jumpNode;
        }
      }
    };

    Block.prototype.makeReturn = function(res) {
      var expr, len;
      len = this.expressions.length;
      while (len--) {
        expr = this.expressions[len];
        if (!(expr instanceof Comment)) {
          this.expressions[len] = expr.makeReturn(res);
          if (expr instanceof Return && !expr.expression) {
            this.expressions.splice(len, 1);
          }
          break;
        }
      }
      return this;
    };

    Block.prototype.compileToFragments = function(o, level) {
      if (o == null) {
        o = {};
      }
      if (o.scope) {
        return Block.__super__.compileToFragments.call(this, o, level);
      } else {
        return this.compileRoot(o);
      }
    };

    Block.prototype.compileNode = function(o) {
      var answer, compiledNodes, fragments, index, j, len1, node, ref3, top;
      this.tab = o.indent;
      top = o.level === LEVEL_TOP;
      compiledNodes = [];
      ref3 = this.expressions;
      for (index = j = 0, len1 = ref3.length; j < len1; index = ++j) {
        node = ref3[index];
        node = node.unwrapAll();
        node = node.unfoldSoak(o) || node;
        if (node instanceof Block) {
          compiledNodes.push(node.compileNode(o));
        } else if (top) {
          node.front = true;
          fragments = node.compileToFragments(o);
          if (!node.isStatement(o)) {
            fragments.unshift(this.makeCode("" + this.tab));
            fragments.push(this.makeCode(";"));
          }
          compiledNodes.push(fragments);
        } else {
          compiledNodes.push(node.compileToFragments(o, LEVEL_LIST));
        }
      }
      if (top) {
        if (this.spaced) {
          return [].concat(this.joinFragmentArrays(compiledNodes, '\n\n'), this.makeCode("\n"));
        } else {
          return this.joinFragmentArrays(compiledNodes, '\n');
        }
      }
      if (compiledNodes.length) {
        answer = this.joinFragmentArrays(compiledNodes, ', ');
      } else {
        answer = [this.makeCode("void 0")];
      }
      if (compiledNodes.length > 1 && o.level >= LEVEL_LIST) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Block.prototype.compileRoot = function(o) {
      var exp, fragments, i, j, len1, name, prelude, preludeExps, ref3, ref4, rest;
      o.indent = o.bare ? '' : TAB;
      o.level = LEVEL_TOP;
      this.spaced = true;
      o.scope = new Scope(null, this, null, (ref3 = o.referencedVars) != null ? ref3 : []);
      ref4 = o.locals || [];
      for (j = 0, len1 = ref4.length; j < len1; j++) {
        name = ref4[j];
        o.scope.parameter(name);
      }
      prelude = [];
      if (!o.bare) {
        preludeExps = (function() {
          var k, len2, ref5, results;
          ref5 = this.expressions;
          results = [];
          for (i = k = 0, len2 = ref5.length; k < len2; i = ++k) {
            exp = ref5[i];
            if (!(exp.unwrap() instanceof Comment)) {
              break;
            }
            results.push(exp);
          }
          return results;
        }).call(this);
        rest = this.expressions.slice(preludeExps.length);
        this.expressions = preludeExps;
        if (preludeExps.length) {
          prelude = this.compileNode(merge(o, {
            indent: ''
          }));
          prelude.push(this.makeCode("\n"));
        }
        this.expressions = rest;
      }
      fragments = this.compileWithDeclarations(o);
      if (o.bare) {
        return fragments;
      }
      return [].concat(prelude, this.makeCode("(function() {\n"), fragments, this.makeCode("\n}).call(this);\n"));
    };

    Block.prototype.compileWithDeclarations = function(o) {
      var assigns, declars, exp, fragments, i, j, len1, post, ref3, ref4, ref5, rest, scope, spaced;
      fragments = [];
      post = [];
      ref3 = this.expressions;
      for (i = j = 0, len1 = ref3.length; j < len1; i = ++j) {
        exp = ref3[i];
        exp = exp.unwrap();
        if (!(exp instanceof Comment || exp instanceof Literal)) {
          break;
        }
      }
      o = merge(o, {
        level: LEVEL_TOP
      });
      if (i) {
        rest = this.expressions.splice(i, 9e9);
        ref4 = [this.spaced, false], spaced = ref4[0], this.spaced = ref4[1];
        ref5 = [this.compileNode(o), spaced], fragments = ref5[0], this.spaced = ref5[1];
        this.expressions = rest;
      }
      post = this.compileNode(o);
      scope = o.scope;
      if (scope.expressions === this) {
        declars = o.scope.hasDeclarations();
        assigns = scope.hasAssignments;
        if (declars || assigns) {
          if (i) {
            fragments.push(this.makeCode('\n'));
          }
          fragments.push(this.makeCode(this.tab + "var "));
          if (declars) {
            fragments.push(this.makeCode(scope.declaredVariables().join(', ')));
          }
          if (assigns) {
            if (declars) {
              fragments.push(this.makeCode(",\n" + (this.tab + TAB)));
            }
            fragments.push(this.makeCode(scope.assignedVariables().join(",\n" + (this.tab + TAB))));
          }
          fragments.push(this.makeCode(";\n" + (this.spaced ? '\n' : '')));
        } else if (fragments.length && post.length) {
          fragments.push(this.makeCode("\n"));
        }
      }
      return fragments.concat(post);
    };

    Block.wrap = function(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    };

    return Block;

  })(Base);

  exports.Literal = Literal = (function(superClass1) {
    extend1(Literal, superClass1);

    function Literal(value1) {
      this.value = value1;
    }

    Literal.prototype.makeReturn = function() {
      if (this.isStatement()) {
        return this;
      } else {
        return Literal.__super__.makeReturn.apply(this, arguments);
      }
    };

    Literal.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.value);
    };

    Literal.prototype.isStatement = function() {
      var ref3;
      return (ref3 = this.value) === 'break' || ref3 === 'continue' || ref3 === 'debugger';
    };

    Literal.prototype.isComplex = NO;

    Literal.prototype.assigns = function(name) {
      return name === this.value;
    };

    Literal.prototype.jumps = function(o) {
      if (this.value === 'break' && !((o != null ? o.loop : void 0) || (o != null ? o.block : void 0))) {
        return this;
      }
      if (this.value === 'continue' && !(o != null ? o.loop : void 0)) {
        return this;
      }
    };

    Literal.prototype.compileNode = function(o) {
      var answer, code, ref3;
      code = this.value === 'this' ? ((ref3 = o.scope.method) != null ? ref3.bound : void 0) ? o.scope.method.context : this.value : this.value.reserved ? "\"" + this.value + "\"" : this.value;
      answer = this.isStatement() ? "" + this.tab + code + ";" : code;
      return [this.makeCode(answer)];
    };

    Literal.prototype.toString = function() {
      return ' "' + this.value + '"';
    };

    return Literal;

  })(Base);

  exports.Undefined = (function(superClass1) {
    extend1(Undefined, superClass1);

    function Undefined() {
      return Undefined.__super__.constructor.apply(this, arguments);
    }

    Undefined.prototype.isAssignable = NO;

    Undefined.prototype.isComplex = NO;

    Undefined.prototype.compileNode = function(o) {
      return [this.makeCode(o.level >= LEVEL_ACCESS ? '(void 0)' : 'void 0')];
    };

    return Undefined;

  })(Base);

  exports.Null = (function(superClass1) {
    extend1(Null, superClass1);

    function Null() {
      return Null.__super__.constructor.apply(this, arguments);
    }

    Null.prototype.isAssignable = NO;

    Null.prototype.isComplex = NO;

    Null.prototype.compileNode = function() {
      return [this.makeCode("null")];
    };

    return Null;

  })(Base);

  exports.Bool = (function(superClass1) {
    extend1(Bool, superClass1);

    Bool.prototype.isAssignable = NO;

    Bool.prototype.isComplex = NO;

    Bool.prototype.compileNode = function() {
      return [this.makeCode(this.val)];
    };

    function Bool(val1) {
      this.val = val1;
    }

    return Bool;

  })(Base);

  exports.Return = Return = (function(superClass1) {
    extend1(Return, superClass1);

    function Return(expression) {
      this.expression = expression;
    }

    Return.prototype.children = ['expression'];

    Return.prototype.isStatement = YES;

    Return.prototype.makeReturn = THIS;

    Return.prototype.jumps = THIS;

    Return.prototype.compileToFragments = function(o, level) {
      var expr, ref3;
      expr = (ref3 = this.expression) != null ? ref3.makeReturn() : void 0;
      if (expr && !(expr instanceof Return)) {
        return expr.compileToFragments(o, level);
      } else {
        return Return.__super__.compileToFragments.call(this, o, level);
      }
    };

    Return.prototype.compileNode = function(o) {
      var answer, exprIsYieldReturn, ref3;
      answer = [];
      exprIsYieldReturn = (ref3 = this.expression) != null ? typeof ref3.isYieldReturn === "function" ? ref3.isYieldReturn() : void 0 : void 0;
      if (!exprIsYieldReturn) {
        answer.push(this.makeCode(this.tab + ("return" + (this.expression ? " " : ""))));
      }
      if (this.expression) {
        answer = answer.concat(this.expression.compileToFragments(o, LEVEL_PAREN));
      }
      if (!exprIsYieldReturn) {
        answer.push(this.makeCode(";"));
      }
      return answer;
    };

    return Return;

  })(Base);

  exports.Value = Value = (function(superClass1) {
    extend1(Value, superClass1);

    function Value(base, props, tag) {
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      if (tag) {
        this[tag] = true;
      }
      return this;
    }

    Value.prototype.children = ['base', 'properties'];

    Value.prototype.add = function(props) {
      this.properties = this.properties.concat(props);
      return this;
    };

    Value.prototype.hasProperties = function() {
      return !!this.properties.length;
    };

    Value.prototype.bareLiteral = function(type) {
      return !this.properties.length && this.base instanceof type;
    };

    Value.prototype.isArray = function() {
      return this.bareLiteral(Arr);
    };

    Value.prototype.isRange = function() {
      return this.bareLiteral(Range);
    };

    Value.prototype.isComplex = function() {
      return this.hasProperties() || this.base.isComplex();
    };

    Value.prototype.isAssignable = function() {
      return this.hasProperties() || this.base.isAssignable();
    };

    Value.prototype.isSimpleNumber = function() {
      return this.bareLiteral(Literal) && SIMPLENUM.test(this.base.value);
    };

    Value.prototype.isString = function() {
      return this.bareLiteral(Literal) && IS_STRING.test(this.base.value);
    };

    Value.prototype.isRegex = function() {
      return this.bareLiteral(Literal) && IS_REGEX.test(this.base.value);
    };

    Value.prototype.isAtomic = function() {
      var j, len1, node, ref3;
      ref3 = this.properties.concat(this.base);
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        node = ref3[j];
        if (node.soak || node instanceof Call) {
          return false;
        }
      }
      return true;
    };

    Value.prototype.isNotCallable = function() {
      return this.isSimpleNumber() || this.isString() || this.isRegex() || this.isArray() || this.isRange() || this.isSplice() || this.isObject();
    };

    Value.prototype.isStatement = function(o) {
      return !this.properties.length && this.base.isStatement(o);
    };

    Value.prototype.assigns = function(name) {
      return !this.properties.length && this.base.assigns(name);
    };

    Value.prototype.jumps = function(o) {
      return !this.properties.length && this.base.jumps(o);
    };

    Value.prototype.isObject = function(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };

    Value.prototype.isSplice = function() {
      var lastProp, ref3;
      ref3 = this.properties, lastProp = ref3[ref3.length - 1];
      return lastProp instanceof Slice;
    };

    Value.prototype.looksStatic = function(className) {
      var ref3;
      return this.base.value === className && this.properties.length === 1 && ((ref3 = this.properties[0].name) != null ? ref3.value : void 0) !== 'prototype';
    };

    Value.prototype.unwrap = function() {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    };

    Value.prototype.cacheReference = function(o) {
      var base, bref, name, nref, ref3;
      ref3 = this.properties, name = ref3[ref3.length - 1];
      if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
        return [this, this];
      }
      base = new Value(this.base, this.properties.slice(0, -1));
      if (base.isComplex()) {
        bref = new Literal(o.scope.freeVariable('base'));
        base = new Value(new Parens(new Assign(bref, base)));
      }
      if (!name) {
        return [base, bref];
      }
      if (name.isComplex()) {
        nref = new Literal(o.scope.freeVariable('name'));
        name = new Index(new Assign(nref, name.index));
        nref = new Index(nref);
      }
      return [base.add(name), new Value(bref || base.base, [nref || name])];
    };

    Value.prototype.compileNode = function(o) {
      var fragments, j, len1, prop, props;
      this.base.front = this.front;
      props = this.properties;
      fragments = this.base.compileToFragments(o, (props.length ? LEVEL_ACCESS : null));
      if ((this.base instanceof Parens || props.length) && SIMPLENUM.test(fragmentsToText(fragments))) {
        fragments.push(this.makeCode('.'));
      }
      for (j = 0, len1 = props.length; j < len1; j++) {
        prop = props[j];
        fragments.push.apply(fragments, prop.compileToFragments(o));
      }
      return fragments;
    };

    Value.prototype.unfoldSoak = function(o) {
      return this.unfoldedSoak != null ? this.unfoldedSoak : this.unfoldedSoak = (function(_this) {
        return function() {
          var fst, i, ifn, j, len1, prop, ref, ref3, ref4, snd;
          if (ifn = _this.base.unfoldSoak(o)) {
            (ref3 = ifn.body.properties).push.apply(ref3, _this.properties);
            return ifn;
          }
          ref4 = _this.properties;
          for (i = j = 0, len1 = ref4.length; j < len1; i = ++j) {
            prop = ref4[i];
            if (!prop.soak) {
              continue;
            }
            prop.soak = false;
            fst = new Value(_this.base, _this.properties.slice(0, i));
            snd = new Value(_this.base, _this.properties.slice(i));
            if (fst.isComplex()) {
              ref = new Literal(o.scope.freeVariable('ref'));
              fst = new Parens(new Assign(ref, fst));
              snd.base = ref;
            }
            return new If(new Existence(fst), snd, {
              soak: true
            });
          }
          return false;
        };
      })(this)();
    };

    return Value;

  })(Base);

  exports.Comment = Comment = (function(superClass1) {
    extend1(Comment, superClass1);

    function Comment(comment1) {
      this.comment = comment1;
    }

    Comment.prototype.isStatement = YES;

    Comment.prototype.makeReturn = THIS;

    Comment.prototype.compileNode = function(o, level) {
      var code, comment;
      comment = this.comment.replace(/^(\s*)#(?=\s)/gm, "$1 *");
      code = "/*" + (multident(comment, this.tab)) + (indexOf.call(comment, '\n') >= 0 ? "\n" + this.tab : '') + " */";
      if ((level || o.level) === LEVEL_TOP) {
        code = o.indent + code;
      }
      return [this.makeCode("\n"), this.makeCode(code)];
    };

    return Comment;

  })(Base);

  exports.Call = Call = (function(superClass1) {
    extend1(Call, superClass1);

    function Call(variable, args1, soak) {
      this.args = args1 != null ? args1 : [];
      this.soak = soak;
      this.isNew = false;
      this.isSuper = variable === 'super';
      this.variable = this.isSuper ? null : variable;
      if (variable instanceof Value && variable.isNotCallable()) {
        variable.error("literal is not a function");
      }
    }

    Call.prototype.children = ['variable', 'args'];

    Call.prototype.newInstance = function() {
      var base, ref3;
      base = ((ref3 = this.variable) != null ? ref3.base : void 0) || this.variable;
      if (base instanceof Call && !base.isNew) {
        base.newInstance();
      } else {
        this.isNew = true;
      }
      return this;
    };

    Call.prototype.superReference = function(o) {
      var accesses, base, bref, klass, method, name, nref, variable;
      method = o.scope.namedMethod();
      if (method != null ? method.klass : void 0) {
        klass = method.klass, name = method.name, variable = method.variable;
        if (klass.isComplex()) {
          bref = new Literal(o.scope.parent.freeVariable('base'));
          base = new Value(new Parens(new Assign(bref, klass)));
          variable.base = base;
          variable.properties.splice(0, klass.properties.length);
        }
        if (name.isComplex() || (name instanceof Index && name.index.isAssignable())) {
          nref = new Literal(o.scope.parent.freeVariable('name'));
          name = new Index(new Assign(nref, name.index));
          variable.properties.pop();
          variable.properties.push(name);
        }
        accesses = [new Access(new Literal('__super__'))];
        if (method["static"]) {
          accesses.push(new Access(new Literal('constructor')));
        }
        accesses.push(nref != null ? new Index(nref) : name);
        return (new Value(bref != null ? bref : klass, accesses)).compile(o);
      } else if (method != null ? method.ctor : void 0) {
        return method.name + ".__super__.constructor";
      } else {
        return this.error('cannot call super outside of an instance method.');
      }
    };

    Call.prototype.superThis = function(o) {
      var method;
      method = o.scope.method;
      return (method && !method.klass && method.context) || "this";
    };

    Call.prototype.unfoldSoak = function(o) {
      var call, ifn, j, left, len1, list, ref3, ref4, rite;
      if (this.soak) {
        if (this.variable) {
          if (ifn = unfoldSoak(o, this, 'variable')) {
            return ifn;
          }
          ref3 = new Value(this.variable).cacheReference(o), left = ref3[0], rite = ref3[1];
        } else {
          left = new Literal(this.superReference(o));
          rite = new Value(left);
        }
        rite = new Call(rite, this.args);
        rite.isNew = this.isNew;
        left = new Literal("typeof " + (left.compile(o)) + " === \"function\"");
        return new If(left, new Value(rite), {
          soak: true
        });
      }
      call = this;
      list = [];
      while (true) {
        if (call.variable instanceof Call) {
          list.push(call);
          call = call.variable;
          continue;
        }
        if (!(call.variable instanceof Value)) {
          break;
        }
        list.push(call);
        if (!((call = call.variable.base) instanceof Call)) {
          break;
        }
      }
      ref4 = list.reverse();
      for (j = 0, len1 = ref4.length; j < len1; j++) {
        call = ref4[j];
        if (ifn) {
          if (call.variable instanceof Call) {
            call.variable = ifn;
          } else {
            call.variable.base = ifn;
          }
        }
        ifn = unfoldSoak(o, call, 'variable');
      }
      return ifn;
    };

    Call.prototype.compileNode = function(o) {
      var arg, argIndex, compiledArgs, compiledArray, fragments, j, len1, preface, ref3, ref4;
      if ((ref3 = this.variable) != null) {
        ref3.front = this.front;
      }
      compiledArray = Splat.compileSplattedArray(o, this.args, true);
      if (compiledArray.length) {
        return this.compileSplat(o, compiledArray);
      }
      compiledArgs = [];
      ref4 = this.args;
      for (argIndex = j = 0, len1 = ref4.length; j < len1; argIndex = ++j) {
        arg = ref4[argIndex];
        if (argIndex) {
          compiledArgs.push(this.makeCode(", "));
        }
        compiledArgs.push.apply(compiledArgs, arg.compileToFragments(o, LEVEL_LIST));
      }
      fragments = [];
      if (this.isSuper) {
        preface = this.superReference(o) + (".call(" + (this.superThis(o)));
        if (compiledArgs.length) {
          preface += ", ";
        }
        fragments.push(this.makeCode(preface));
      } else {
        if (this.isNew) {
          fragments.push(this.makeCode('new '));
        }
        fragments.push.apply(fragments, this.variable.compileToFragments(o, LEVEL_ACCESS));
        fragments.push(this.makeCode("("));
      }
      fragments.push.apply(fragments, compiledArgs);
      fragments.push(this.makeCode(")"));
      return fragments;
    };

    Call.prototype.compileSplat = function(o, splatArgs) {
      var answer, base, fun, idt, name, ref;
      if (this.isSuper) {
        return [].concat(this.makeCode((this.superReference(o)) + ".apply(" + (this.superThis(o)) + ", "), splatArgs, this.makeCode(")"));
      }
      if (this.isNew) {
        idt = this.tab + TAB;
        return [].concat(this.makeCode("(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return Object(result) === result ? result : child;\n" + this.tab + "})("), this.variable.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), splatArgs, this.makeCode(", function(){})"));
      }
      answer = [];
      base = new Value(this.variable);
      if ((name = base.properties.pop()) && base.isComplex()) {
        ref = o.scope.freeVariable('ref');
        answer = answer.concat(this.makeCode("(" + ref + " = "), base.compileToFragments(o, LEVEL_LIST), this.makeCode(")"), name.compileToFragments(o));
      } else {
        fun = base.compileToFragments(o, LEVEL_ACCESS);
        if (SIMPLENUM.test(fragmentsToText(fun))) {
          fun = this.wrapInBraces(fun);
        }
        if (name) {
          ref = fragmentsToText(fun);
          fun.push.apply(fun, name.compileToFragments(o));
        } else {
          ref = 'null';
        }
        answer = answer.concat(fun);
      }
      return answer = answer.concat(this.makeCode(".apply(" + ref + ", "), splatArgs, this.makeCode(")"));
    };

    return Call;

  })(Base);

  exports.Extends = Extends = (function(superClass1) {
    extend1(Extends, superClass1);

    function Extends(child1, parent1) {
      this.child = child1;
      this.parent = parent1;
    }

    Extends.prototype.children = ['child', 'parent'];

    Extends.prototype.compileToFragments = function(o) {
      return new Call(new Value(new Literal(utility('extend', o))), [this.child, this.parent]).compileToFragments(o);
    };

    return Extends;

  })(Base);

  exports.Access = Access = (function(superClass1) {
    extend1(Access, superClass1);

    function Access(name1, tag) {
      this.name = name1;
      this.name.asKey = true;
      this.soak = tag === 'soak';
    }

    Access.prototype.children = ['name'];

    Access.prototype.compileToFragments = function(o) {
      var name;
      name = this.name.compileToFragments(o);
      if (IDENTIFIER.test(fragmentsToText(name))) {
        name.unshift(this.makeCode("."));
      } else {
        name.unshift(this.makeCode("["));
        name.push(this.makeCode("]"));
      }
      return name;
    };

    Access.prototype.isComplex = NO;

    return Access;

  })(Base);

  exports.Index = Index = (function(superClass1) {
    extend1(Index, superClass1);

    function Index(index1) {
      this.index = index1;
    }

    Index.prototype.children = ['index'];

    Index.prototype.compileToFragments = function(o) {
      return [].concat(this.makeCode("["), this.index.compileToFragments(o, LEVEL_PAREN), this.makeCode("]"));
    };

    Index.prototype.isComplex = function() {
      return this.index.isComplex();
    };

    return Index;

  })(Base);

  exports.Range = Range = (function(superClass1) {
    extend1(Range, superClass1);

    Range.prototype.children = ['from', 'to'];

    function Range(from1, to1, tag) {
      this.from = from1;
      this.to = to1;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }

    Range.prototype.compileVariables = function(o) {
      var isComplex, ref3, ref4, ref5, ref6, step;
      o = merge(o, {
        top: true
      });
      isComplex = del(o, 'isComplex');
      ref3 = this.cacheToCodeFragments(this.from.cache(o, LEVEL_LIST, isComplex)), this.fromC = ref3[0], this.fromVar = ref3[1];
      ref4 = this.cacheToCodeFragments(this.to.cache(o, LEVEL_LIST, isComplex)), this.toC = ref4[0], this.toVar = ref4[1];
      if (step = del(o, 'step')) {
        ref5 = this.cacheToCodeFragments(step.cache(o, LEVEL_LIST, isComplex)), this.step = ref5[0], this.stepVar = ref5[1];
      }
      ref6 = [this.fromVar.match(NUMBER), this.toVar.match(NUMBER)], this.fromNum = ref6[0], this.toNum = ref6[1];
      if (this.stepVar) {
        return this.stepNum = this.stepVar.match(NUMBER);
      }
    };

    Range.prototype.compileNode = function(o) {
      var cond, condPart, from, gt, idx, idxName, known, lt, namedIndex, ref3, ref4, stepPart, to, varPart;
      if (!this.fromVar) {
        this.compileVariables(o);
      }
      if (!o.index) {
        return this.compileArray(o);
      }
      known = this.fromNum && this.toNum;
      idx = del(o, 'index');
      idxName = del(o, 'name');
      namedIndex = idxName && idxName !== idx;
      varPart = idx + " = " + this.fromC;
      if (this.toC !== this.toVar) {
        varPart += ", " + this.toC;
      }
      if (this.step !== this.stepVar) {
        varPart += ", " + this.step;
      }
      ref3 = [idx + " <" + this.equals, idx + " >" + this.equals], lt = ref3[0], gt = ref3[1];
      condPart = this.stepNum ? parseNum(this.stepNum[0]) > 0 ? lt + " " + this.toVar : gt + " " + this.toVar : known ? ((ref4 = [parseNum(this.fromNum[0]), parseNum(this.toNum[0])], from = ref4[0], to = ref4[1], ref4), from <= to ? lt + " " + to : gt + " " + to) : (cond = this.stepVar ? this.stepVar + " > 0" : this.fromVar + " <= " + this.toVar, cond + " ? " + lt + " " + this.toVar + " : " + gt + " " + this.toVar);
      stepPart = this.stepVar ? idx + " += " + this.stepVar : known ? namedIndex ? from <= to ? "++" + idx : "--" + idx : from <= to ? idx + "++" : idx + "--" : namedIndex ? cond + " ? ++" + idx + " : --" + idx : cond + " ? " + idx + "++ : " + idx + "--";
      if (namedIndex) {
        varPart = idxName + " = " + varPart;
      }
      if (namedIndex) {
        stepPart = idxName + " = " + stepPart;
      }
      return [this.makeCode(varPart + "; " + condPart + "; " + stepPart)];
    };

    Range.prototype.compileArray = function(o) {
      var args, body, cond, hasArgs, i, idt, j, post, pre, range, ref3, ref4, result, results, vars;
      if (this.fromNum && this.toNum && Math.abs(this.fromNum - this.toNum) <= 20) {
        range = (function() {
          results = [];
          for (var j = ref3 = +this.fromNum, ref4 = +this.toNum; ref3 <= ref4 ? j <= ref4 : j >= ref4; ref3 <= ref4 ? j++ : j--){ results.push(j); }
          return results;
        }).apply(this);
        if (this.exclusive) {
          range.pop();
        }
        return [this.makeCode("[" + (range.join(', ')) + "]")];
      }
      idt = this.tab + TAB;
      i = o.scope.freeVariable('i', {
        single: true
      });
      result = o.scope.freeVariable('results');
      pre = "\n" + idt + result + " = [];";
      if (this.fromNum && this.toNum) {
        o.index = i;
        body = fragmentsToText(this.compileNode(o));
      } else {
        vars = (i + " = " + this.fromC) + (this.toC !== this.toVar ? ", " + this.toC : '');
        cond = this.fromVar + " <= " + this.toVar;
        body = "var " + vars + "; " + cond + " ? " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + cond + " ? " + i + "++ : " + i + "--";
      }
      post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
      hasArgs = function(node) {
        return node != null ? node.contains(isLiteralArguments) : void 0;
      };
      if (hasArgs(this.from) || hasArgs(this.to)) {
        args = ', arguments';
      }
      return [this.makeCode("(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).apply(this" + (args != null ? args : '') + ")")];
    };

    return Range;

  })(Base);

  exports.Slice = Slice = (function(superClass1) {
    extend1(Slice, superClass1);

    Slice.prototype.children = ['range'];

    function Slice(range1) {
      this.range = range1;
      Slice.__super__.constructor.call(this);
    }

    Slice.prototype.compileNode = function(o) {
      var compiled, compiledText, from, fromCompiled, ref3, to, toStr;
      ref3 = this.range, to = ref3.to, from = ref3.from;
      fromCompiled = from && from.compileToFragments(o, LEVEL_PAREN) || [this.makeCode('0')];
      if (to) {
        compiled = to.compileToFragments(o, LEVEL_PAREN);
        compiledText = fragmentsToText(compiled);
        if (!(!this.range.exclusive && +compiledText === -1)) {
          toStr = ', ' + (this.range.exclusive ? compiledText : SIMPLENUM.test(compiledText) ? "" + (+compiledText + 1) : (compiled = to.compileToFragments(o, LEVEL_ACCESS), "+" + (fragmentsToText(compiled)) + " + 1 || 9e9"));
        }
      }
      return [this.makeCode(".slice(" + (fragmentsToText(fromCompiled)) + (toStr || '') + ")")];
    };

    return Slice;

  })(Base);

  exports.Obj = Obj = (function(superClass1) {
    extend1(Obj, superClass1);

    function Obj(props, generated) {
      this.generated = generated != null ? generated : false;
      this.objects = this.properties = props || [];
    }

    Obj.prototype.children = ['properties'];

    Obj.prototype.compileNode = function(o) {
      var answer, dynamicIndex, hasDynamic, i, idt, indent, j, join, k, key, l, lastNoncom, len1, len2, len3, node, oref, prop, props, ref3, value;
      props = this.properties;
      if (this.generated) {
        for (j = 0, len1 = props.length; j < len1; j++) {
          node = props[j];
          if (node instanceof Value) {
            node.error('cannot have an implicit value in an implicit object');
          }
        }
      }
      for (dynamicIndex = k = 0, len2 = props.length; k < len2; dynamicIndex = ++k) {
        prop = props[dynamicIndex];
        if ((prop.variable || prop).base instanceof Parens) {
          break;
        }
      }
      hasDynamic = dynamicIndex < props.length;
      idt = o.indent += TAB;
      lastNoncom = this.lastNonComment(this.properties);
      answer = [];
      if (hasDynamic) {
        oref = o.scope.freeVariable('obj');
        answer.push(this.makeCode("(\n" + idt + oref + " = "));
      }
      answer.push(this.makeCode("{" + (props.length === 0 || dynamicIndex === 0 ? '}' : '\n')));
      for (i = l = 0, len3 = props.length; l < len3; i = ++l) {
        prop = props[i];
        if (i === dynamicIndex) {
          if (i !== 0) {
            answer.push(this.makeCode("\n" + idt + "}"));
          }
          answer.push(this.makeCode(',\n'));
        }
        join = i === props.length - 1 || i === dynamicIndex - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
        indent = prop instanceof Comment ? '' : idt;
        if (hasDynamic && i < dynamicIndex) {
          indent += TAB;
        }
        if (prop instanceof Assign && prop.variable instanceof Value && prop.variable.hasProperties()) {
          prop.variable.error('invalid object key');
        }
        if (prop instanceof Value && prop["this"]) {
          prop = new Assign(prop.properties[0].name, prop, 'object');
        }
        if (!(prop instanceof Comment)) {
          if (i < dynamicIndex) {
            if (!(prop instanceof Assign)) {
              prop = new Assign(prop, prop, 'object');
            }
            (prop.variable.base || prop.variable).asKey = true;
          } else {
            if (prop instanceof Assign) {
              key = prop.variable;
              value = prop.value;
            } else {
              ref3 = prop.base.cache(o), key = ref3[0], value = ref3[1];
            }
            prop = new Assign(new Value(new Literal(oref), [new Access(key)]), value);
          }
        }
        if (indent) {
          answer.push(this.makeCode(indent));
        }
        answer.push.apply(answer, prop.compileToFragments(o, LEVEL_TOP));
        if (join) {
          answer.push(this.makeCode(join));
        }
      }
      if (hasDynamic) {
        answer.push(this.makeCode(",\n" + idt + oref + "\n" + this.tab + ")"));
      } else {
        if (props.length !== 0) {
          answer.push(this.makeCode("\n" + this.tab + "}"));
        }
      }
      if (this.front && !hasDynamic) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Obj.prototype.assigns = function(name) {
      var j, len1, prop, ref3;
      ref3 = this.properties;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        prop = ref3[j];
        if (prop.assigns(name)) {
          return true;
        }
      }
      return false;
    };

    return Obj;

  })(Base);

  exports.Arr = Arr = (function(superClass1) {
    extend1(Arr, superClass1);

    function Arr(objs) {
      this.objects = objs || [];
    }

    Arr.prototype.children = ['objects'];

    Arr.prototype.compileNode = function(o) {
      var answer, compiledObjs, fragments, index, j, len1, obj;
      if (!this.objects.length) {
        return [this.makeCode('[]')];
      }
      o.indent += TAB;
      answer = Splat.compileSplattedArray(o, this.objects);
      if (answer.length) {
        return answer;
      }
      answer = [];
      compiledObjs = (function() {
        var j, len1, ref3, results;
        ref3 = this.objects;
        results = [];
        for (j = 0, len1 = ref3.length; j < len1; j++) {
          obj = ref3[j];
          results.push(obj.compileToFragments(o, LEVEL_LIST));
        }
        return results;
      }).call(this);
      for (index = j = 0, len1 = compiledObjs.length; j < len1; index = ++j) {
        fragments = compiledObjs[index];
        if (index) {
          answer.push(this.makeCode(", "));
        }
        answer.push.apply(answer, fragments);
      }
      if (fragmentsToText(answer).indexOf('\n') >= 0) {
        answer.unshift(this.makeCode("[\n" + o.indent));
        answer.push(this.makeCode("\n" + this.tab + "]"));
      } else {
        answer.unshift(this.makeCode("["));
        answer.push(this.makeCode("]"));
      }
      return answer;
    };

    Arr.prototype.assigns = function(name) {
      var j, len1, obj, ref3;
      ref3 = this.objects;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        obj = ref3[j];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };

    return Arr;

  })(Base);

  exports.Class = Class = (function(superClass1) {
    extend1(Class, superClass1);

    function Class(variable1, parent1, body1) {
      this.variable = variable1;
      this.parent = parent1;
      this.body = body1 != null ? body1 : new Block;
      this.boundFuncs = [];
      this.body.classBody = true;
    }

    Class.prototype.children = ['variable', 'parent', 'body'];

    Class.prototype.determineName = function() {
      var decl, ref3, tail;
      if (!this.variable) {
        return null;
      }
      ref3 = this.variable.properties, tail = ref3[ref3.length - 1];
      decl = tail ? tail instanceof Access && tail.name.value : this.variable.base.value;
      if (indexOf.call(STRICT_PROSCRIBED, decl) >= 0) {
        this.variable.error("class variable name may not be " + decl);
      }
      return decl && (decl = IDENTIFIER.test(decl) && decl);
    };

    Class.prototype.setContext = function(name) {
      return this.body.traverseChildren(false, function(node) {
        if (node.classBody) {
          return false;
        }
        if (node instanceof Literal && node.value === 'this') {
          return node.value = name;
        } else if (node instanceof Code) {
          if (node.bound) {
            return node.context = name;
          }
        }
      });
    };

    Class.prototype.addBoundFunctions = function(o) {
      var bvar, j, len1, lhs, ref3;
      ref3 = this.boundFuncs;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        bvar = ref3[j];
        lhs = (new Value(new Literal("this"), [new Access(bvar)])).compile(o);
        this.ctor.body.unshift(new Literal(lhs + " = " + (utility('bind', o)) + "(" + lhs + ", this)"));
      }
    };

    Class.prototype.addProperties = function(node, name, o) {
      var acc, assign, base, exprs, func, props;
      props = node.base.properties.slice(0);
      exprs = (function() {
        var results;
        results = [];
        while (assign = props.shift()) {
          if (assign instanceof Assign) {
            base = assign.variable.base;
            delete assign.context;
            func = assign.value;
            if (base.value === 'constructor') {
              if (this.ctor) {
                assign.error('cannot define more than one constructor in a class');
              }
              if (func.bound) {
                assign.error('cannot define a constructor as a bound function');
              }
              if (func instanceof Code) {
                assign = this.ctor = func;
              } else {
                this.externalCtor = o.classScope.freeVariable('class');
                assign = new Assign(new Literal(this.externalCtor), func);
              }
            } else {
              if (assign.variable["this"]) {
                func["static"] = true;
              } else {
                acc = base.isComplex() ? new Index(base) : new Access(base);
                assign.variable = new Value(new Literal(name), [new Access(new Literal('prototype')), acc]);
                if (func instanceof Code && func.bound) {
                  this.boundFuncs.push(base);
                  func.bound = false;
                }
              }
            }
          }
          results.push(assign);
        }
        return results;
      }).call(this);
      return compact(exprs);
    };

    Class.prototype.walkBody = function(name, o) {
      return this.traverseChildren(false, (function(_this) {
        return function(child) {
          var cont, exps, i, j, len1, node, ref3;
          cont = true;
          if (child instanceof Class) {
            return false;
          }
          if (child instanceof Block) {
            ref3 = exps = child.expressions;
            for (i = j = 0, len1 = ref3.length; j < len1; i = ++j) {
              node = ref3[i];
              if (node instanceof Assign && node.variable.looksStatic(name)) {
                node.value["static"] = true;
              } else if (node instanceof Value && node.isObject(true)) {
                cont = false;
                exps[i] = _this.addProperties(node, name, o);
              }
            }
            child.expressions = exps = flatten(exps);
          }
          return cont && !(child instanceof Class);
        };
      })(this));
    };

    Class.prototype.hoistDirectivePrologue = function() {
      var expressions, index, node;
      index = 0;
      expressions = this.body.expressions;
      while ((node = expressions[index]) && node instanceof Comment || node instanceof Value && node.isString()) {
        ++index;
      }
      return this.directives = expressions.splice(0, index);
    };

    Class.prototype.ensureConstructor = function(name) {
      if (!this.ctor) {
        this.ctor = new Code;
        if (this.externalCtor) {
          this.ctor.body.push(new Literal(this.externalCtor + ".apply(this, arguments)"));
        } else if (this.parent) {
          this.ctor.body.push(new Literal(name + ".__super__.constructor.apply(this, arguments)"));
        }
        this.ctor.body.makeReturn();
        this.body.expressions.unshift(this.ctor);
      }
      this.ctor.ctor = this.ctor.name = name;
      this.ctor.klass = null;
      return this.ctor.noReturn = true;
    };

    Class.prototype.compileNode = function(o) {
      var args, argumentsNode, func, jumpNode, klass, lname, name, ref3, superClass;
      if (jumpNode = this.body.jumps()) {
        jumpNode.error('Class bodies cannot contain pure statements');
      }
      if (argumentsNode = this.body.contains(isLiteralArguments)) {
        argumentsNode.error("Class bodies shouldn't reference arguments");
      }
      name = this.determineName() || '_Class';
      if (name.reserved) {
        name = "_" + name;
      }
      lname = new Literal(name);
      func = new Code([], Block.wrap([this.body]));
      args = [];
      o.classScope = func.makeScope(o.scope);
      this.hoistDirectivePrologue();
      this.setContext(name);
      this.walkBody(name, o);
      this.ensureConstructor(name);
      this.addBoundFunctions(o);
      this.body.spaced = true;
      this.body.expressions.push(lname);
      if (this.parent) {
        superClass = new Literal(o.classScope.freeVariable('superClass', {
          reserve: false
        }));
        this.body.expressions.unshift(new Extends(lname, superClass));
        func.params.push(new Param(superClass));
        args.push(this.parent);
      }
      (ref3 = this.body.expressions).unshift.apply(ref3, this.directives);
      klass = new Parens(new Call(func, args));
      if (this.variable) {
        klass = new Assign(this.variable, klass);
      }
      return klass.compileToFragments(o);
    };

    return Class;

  })(Base);

  exports.Assign = Assign = (function(superClass1) {
    extend1(Assign, superClass1);

    function Assign(variable1, value1, context, options) {
      var forbidden, name, ref3;
      this.variable = variable1;
      this.value = value1;
      this.context = context;
      this.param = options && options.param;
      this.subpattern = options && options.subpattern;
      forbidden = (ref3 = (name = this.variable.unwrapAll().value), indexOf.call(STRICT_PROSCRIBED, ref3) >= 0);
      if (forbidden && this.context !== 'object') {
        this.variable.error("variable name may not be \"" + name + "\"");
      }
    }

    Assign.prototype.children = ['variable', 'value'];

    Assign.prototype.isStatement = function(o) {
      return (o != null ? o.level : void 0) === LEVEL_TOP && (this.context != null) && indexOf.call(this.context, "?") >= 0;
    };

    Assign.prototype.assigns = function(name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };

    Assign.prototype.unfoldSoak = function(o) {
      return unfoldSoak(o, this, 'variable');
    };

    Assign.prototype.compileNode = function(o) {
      var answer, compiledName, isValue, j, name, properties, prototype, ref3, ref4, ref5, ref6, ref7, val, varBase;
      if (isValue = this.variable instanceof Value) {
        if (this.variable.isArray() || this.variable.isObject()) {
          return this.compilePatternMatch(o);
        }
        if (this.variable.isSplice()) {
          return this.compileSplice(o);
        }
        if ((ref3 = this.context) === '||=' || ref3 === '&&=' || ref3 === '?=') {
          return this.compileConditional(o);
        }
        if ((ref4 = this.context) === '**=' || ref4 === '//=' || ref4 === '%%=') {
          return this.compileSpecialMath(o);
        }
      }
      if (this.value instanceof Code) {
        if (this.value["static"]) {
          this.value.klass = this.variable.base;
          this.value.name = this.variable.properties[0];
          this.value.variable = this.variable;
        } else if (((ref5 = this.variable.properties) != null ? ref5.length : void 0) >= 2) {
          ref6 = this.variable.properties, properties = 3 <= ref6.length ? slice.call(ref6, 0, j = ref6.length - 2) : (j = 0, []), prototype = ref6[j++], name = ref6[j++];
          if (((ref7 = prototype.name) != null ? ref7.value : void 0) === 'prototype') {
            this.value.klass = new Value(this.variable.base, properties);
            this.value.name = name;
            this.value.variable = this.variable;
          }
        }
      }
      if (!this.context) {
        varBase = this.variable.unwrapAll();
        if (!varBase.isAssignable()) {
          this.variable.error("\"" + (this.variable.compile(o)) + "\" cannot be assigned");
        }
        if (!(typeof varBase.hasProperties === "function" ? varBase.hasProperties() : void 0)) {
          if (this.param) {
            o.scope.add(varBase.value, 'var');
          } else {
            o.scope.find(varBase.value);
          }
        }
      }
      val = this.value.compileToFragments(o, LEVEL_LIST);
      compiledName = this.variable.compileToFragments(o, LEVEL_LIST);
      if (this.context === 'object') {
        return compiledName.concat(this.makeCode(": "), val);
      }
      answer = compiledName.concat(this.makeCode(" " + (this.context || '=') + " "), val);
      if (o.level <= LEVEL_LIST) {
        return answer;
      } else {
        return this.wrapInBraces(answer);
      }
    };

    Assign.prototype.compilePatternMatch = function(o) {
      var acc, assigns, code, expandedIdx, fragments, i, idx, isObject, ivar, j, len1, name, obj, objects, olen, ref, ref3, ref4, ref5, ref6, ref7, ref8, rest, top, val, value, vvar, vvarText;
      top = o.level === LEVEL_TOP;
      value = this.value;
      objects = this.variable.base.objects;
      if (!(olen = objects.length)) {
        code = value.compileToFragments(o);
        if (o.level >= LEVEL_OP) {
          return this.wrapInBraces(code);
        } else {
          return code;
        }
      }
      isObject = this.variable.isObject();
      if (top && olen === 1 && !((obj = objects[0]) instanceof Splat)) {
        if (obj instanceof Assign) {
          ref3 = obj, (ref4 = ref3.variable, idx = ref4.base), obj = ref3.value;
        } else {
          idx = isObject ? obj["this"] ? obj.properties[0].name : obj : new Literal(0);
        }
        acc = IDENTIFIER.test(idx.unwrap().value || 0);
        value = new Value(value);
        value.properties.push(new (acc ? Access : Index)(idx));
        if (ref5 = obj.unwrap().value, indexOf.call(RESERVED, ref5) >= 0) {
          obj.error("assignment to a reserved word: " + (obj.compile(o)));
        }
        return new Assign(obj, value, null, {
          param: this.param
        }).compileToFragments(o, LEVEL_TOP);
      }
      vvar = value.compileToFragments(o, LEVEL_LIST);
      vvarText = fragmentsToText(vvar);
      assigns = [];
      expandedIdx = false;
      if (!IDENTIFIER.test(vvarText) || this.variable.assigns(vvarText)) {
        assigns.push([this.makeCode((ref = o.scope.freeVariable('ref')) + " = ")].concat(slice.call(vvar)));
        vvar = [this.makeCode(ref)];
        vvarText = ref;
      }
      for (i = j = 0, len1 = objects.length; j < len1; i = ++j) {
        obj = objects[i];
        idx = i;
        if (isObject) {
          if (obj instanceof Assign) {
            ref6 = obj, (ref7 = ref6.variable, idx = ref7.base), obj = ref6.value;
          } else {
            if (obj.base instanceof Parens) {
              ref8 = new Value(obj.unwrapAll()).cacheReference(o), obj = ref8[0], idx = ref8[1];
            } else {
              idx = obj["this"] ? obj.properties[0].name : obj;
            }
          }
        }
        if (!expandedIdx && obj instanceof Splat) {
          name = obj.name.unwrap().value;
          obj = obj.unwrap();
          val = olen + " <= " + vvarText + ".length ? " + (utility('slice', o)) + ".call(" + vvarText + ", " + i;
          if (rest = olen - i - 1) {
            ivar = o.scope.freeVariable('i', {
              single: true
            });
            val += ", " + ivar + " = " + vvarText + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
          } else {
            val += ") : []";
          }
          val = new Literal(val);
          expandedIdx = ivar + "++";
        } else if (!expandedIdx && obj instanceof Expansion) {
          if (rest = olen - i - 1) {
            if (rest === 1) {
              expandedIdx = vvarText + ".length - 1";
            } else {
              ivar = o.scope.freeVariable('i', {
                single: true
              });
              val = new Literal(ivar + " = " + vvarText + ".length - " + rest);
              expandedIdx = ivar + "++";
              assigns.push(val.compileToFragments(o, LEVEL_LIST));
            }
          }
          continue;
        } else {
          name = obj.unwrap().value;
          if (obj instanceof Splat || obj instanceof Expansion) {
            obj.error("multiple splats/expansions are disallowed in an assignment");
          }
          if (typeof idx === 'number') {
            idx = new Literal(expandedIdx || idx);
            acc = false;
          } else {
            acc = isObject && IDENTIFIER.test(idx.unwrap().value || 0);
          }
          val = new Value(new Literal(vvarText), [new (acc ? Access : Index)(idx)]);
        }
        if ((name != null) && indexOf.call(RESERVED, name) >= 0) {
          obj.error("assignment to a reserved word: " + (obj.compile(o)));
        }
        assigns.push(new Assign(obj, val, null, {
          param: this.param,
          subpattern: true
        }).compileToFragments(o, LEVEL_LIST));
      }
      if (!(top || this.subpattern)) {
        assigns.push(vvar);
      }
      fragments = this.joinFragmentArrays(assigns, ', ');
      if (o.level < LEVEL_LIST) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    Assign.prototype.compileConditional = function(o) {
      var fragments, left, ref3, right;
      ref3 = this.variable.cacheReference(o), left = ref3[0], right = ref3[1];
      if (!left.properties.length && left.base instanceof Literal && left.base.value !== "this" && !o.scope.check(left.base.value)) {
        this.variable.error("the variable \"" + left.base.value + "\" can't be assigned with " + this.context + " because it has not been declared before");
      }
      if (indexOf.call(this.context, "?") >= 0) {
        o.isExistentialEquals = true;
        return new If(new Existence(left), right, {
          type: 'if'
        }).addElse(new Assign(right, this.value, '=')).compileToFragments(o);
      } else {
        fragments = new Op(this.context.slice(0, -1), left, new Assign(right, this.value, '=')).compileToFragments(o);
        if (o.level <= LEVEL_LIST) {
          return fragments;
        } else {
          return this.wrapInBraces(fragments);
        }
      }
    };

    Assign.prototype.compileSpecialMath = function(o) {
      var left, ref3, right;
      ref3 = this.variable.cacheReference(o), left = ref3[0], right = ref3[1];
      return new Assign(left, new Op(this.context.slice(0, -1), right, this.value)).compileToFragments(o);
    };

    Assign.prototype.compileSplice = function(o) {
      var answer, exclusive, from, fromDecl, fromRef, name, ref3, ref4, ref5, to, valDef, valRef;
      ref3 = this.variable.properties.pop().range, from = ref3.from, to = ref3.to, exclusive = ref3.exclusive;
      name = this.variable.compile(o);
      if (from) {
        ref4 = this.cacheToCodeFragments(from.cache(o, LEVEL_OP)), fromDecl = ref4[0], fromRef = ref4[1];
      } else {
        fromDecl = fromRef = '0';
      }
      if (to) {
        if (from instanceof Value && from.isSimpleNumber() && to instanceof Value && to.isSimpleNumber()) {
          to = to.compile(o) - fromRef;
          if (!exclusive) {
            to += 1;
          }
        } else {
          to = to.compile(o, LEVEL_ACCESS) + ' - ' + fromRef;
          if (!exclusive) {
            to += ' + 1';
          }
        }
      } else {
        to = "9e9";
      }
      ref5 = this.value.cache(o, LEVEL_LIST), valDef = ref5[0], valRef = ref5[1];
      answer = [].concat(this.makeCode("[].splice.apply(" + name + ", [" + fromDecl + ", " + to + "].concat("), valDef, this.makeCode(")), "), valRef);
      if (o.level > LEVEL_TOP) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    return Assign;

  })(Base);

  exports.Code = Code = (function(superClass1) {
    extend1(Code, superClass1);

    function Code(params, body, tag) {
      this.params = params || [];
      this.body = body || new Block;
      this.bound = tag === 'boundfunc';
      this.isGenerator = !!this.body.contains(function(node) {
        var ref3;
        return node instanceof Op && ((ref3 = node.operator) === 'yield' || ref3 === 'yield*');
      });
    }

    Code.prototype.children = ['params', 'body'];

    Code.prototype.isStatement = function() {
      return !!this.ctor;
    };

    Code.prototype.jumps = NO;

    Code.prototype.makeScope = function(parentScope) {
      return new Scope(parentScope, this.body, this);
    };

    Code.prototype.compileNode = function(o) {
      var answer, boundfunc, code, exprs, i, j, k, l, len1, len2, len3, len4, len5, len6, lit, m, p, param, params, q, r, ref, ref3, ref4, ref5, ref6, ref7, ref8, splats, uniqs, val, wasEmpty, wrapper;
      if (this.bound && ((ref3 = o.scope.method) != null ? ref3.bound : void 0)) {
        this.context = o.scope.method.context;
      }
      if (this.bound && !this.context) {
        this.context = '_this';
        wrapper = new Code([new Param(new Literal(this.context))], new Block([this]));
        boundfunc = new Call(wrapper, [new Literal('this')]);
        boundfunc.updateLocationDataIfMissing(this.locationData);
        return boundfunc.compileNode(o);
      }
      o.scope = del(o, 'classScope') || this.makeScope(o.scope);
      o.scope.shared = del(o, 'sharedScope');
      o.indent += TAB;
      delete o.bare;
      delete o.isExistentialEquals;
      params = [];
      exprs = [];
      ref4 = this.params;
      for (j = 0, len1 = ref4.length; j < len1; j++) {
        param = ref4[j];
        if (!(param instanceof Expansion)) {
          o.scope.parameter(param.asReference(o));
        }
      }
      ref5 = this.params;
      for (k = 0, len2 = ref5.length; k < len2; k++) {
        param = ref5[k];
        if (!(param.splat || param instanceof Expansion)) {
          continue;
        }
        ref6 = this.params;
        for (l = 0, len3 = ref6.length; l < len3; l++) {
          p = ref6[l];
          if (!(p instanceof Expansion) && p.name.value) {
            o.scope.add(p.name.value, 'var', true);
          }
        }
        splats = new Assign(new Value(new Arr((function() {
          var len4, m, ref7, results;
          ref7 = this.params;
          results = [];
          for (m = 0, len4 = ref7.length; m < len4; m++) {
            p = ref7[m];
            results.push(p.asReference(o));
          }
          return results;
        }).call(this))), new Value(new Literal('arguments')));
        break;
      }
      ref7 = this.params;
      for (m = 0, len4 = ref7.length; m < len4; m++) {
        param = ref7[m];
        if (param.isComplex()) {
          val = ref = param.asReference(o);
          if (param.value) {
            val = new Op('?', ref, param.value);
          }
          exprs.push(new Assign(new Value(param.name), val, '=', {
            param: true
          }));
        } else {
          ref = param;
          if (param.value) {
            lit = new Literal(ref.name.value + ' == null');
            val = new Assign(new Value(param.name), param.value, '=');
            exprs.push(new If(lit, val));
          }
        }
        if (!splats) {
          params.push(ref);
        }
      }
      wasEmpty = this.body.isEmpty();
      if (splats) {
        exprs.unshift(splats);
      }
      if (exprs.length) {
        (ref8 = this.body.expressions).unshift.apply(ref8, exprs);
      }
      for (i = q = 0, len5 = params.length; q < len5; i = ++q) {
        p = params[i];
        params[i] = p.compileToFragments(o);
        o.scope.parameter(fragmentsToText(params[i]));
      }
      uniqs = [];
      this.eachParamName(function(name, node) {
        if (indexOf.call(uniqs, name) >= 0) {
          node.error("multiple parameters named " + name);
        }
        return uniqs.push(name);
      });
      if (!(wasEmpty || this.noReturn)) {
        this.body.makeReturn();
      }
      code = 'function';
      if (this.isGenerator) {
        code += '*';
      }
      if (this.ctor) {
        code += ' ' + this.name;
      }
      code += '(';
      answer = [this.makeCode(code)];
      for (i = r = 0, len6 = params.length; r < len6; i = ++r) {
        p = params[i];
        if (i) {
          answer.push(this.makeCode(", "));
        }
        answer.push.apply(answer, p);
      }
      answer.push(this.makeCode(') {'));
      if (!this.body.isEmpty()) {
        answer = answer.concat(this.makeCode("\n"), this.body.compileWithDeclarations(o), this.makeCode("\n" + this.tab));
      }
      answer.push(this.makeCode('}'));
      if (this.ctor) {
        return [this.makeCode(this.tab)].concat(slice.call(answer));
      }
      if (this.front || (o.level >= LEVEL_ACCESS)) {
        return this.wrapInBraces(answer);
      } else {
        return answer;
      }
    };

    Code.prototype.eachParamName = function(iterator) {
      var j, len1, param, ref3, results;
      ref3 = this.params;
      results = [];
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        param = ref3[j];
        results.push(param.eachName(iterator));
      }
      return results;
    };

    Code.prototype.traverseChildren = function(crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };

    return Code;

  })(Base);

  exports.Param = Param = (function(superClass1) {
    extend1(Param, superClass1);

    function Param(name1, value1, splat) {
      var name, ref3;
      this.name = name1;
      this.value = value1;
      this.splat = splat;
      if (ref3 = (name = this.name.unwrapAll().value), indexOf.call(STRICT_PROSCRIBED, ref3) >= 0) {
        this.name.error("parameter name \"" + name + "\" is not allowed");
      }
    }

    Param.prototype.children = ['name', 'value'];

    Param.prototype.compileToFragments = function(o) {
      return this.name.compileToFragments(o, LEVEL_LIST);
    };

    Param.prototype.asReference = function(o) {
      var name, node;
      if (this.reference) {
        return this.reference;
      }
      node = this.name;
      if (node["this"]) {
        name = node.properties[0].name.value;
        if (name.reserved) {
          name = "_" + name;
        }
        node = new Literal(o.scope.freeVariable(name));
      } else if (node.isComplex()) {
        node = new Literal(o.scope.freeVariable('arg'));
      }
      node = new Value(node);
      if (this.splat) {
        node = new Splat(node);
      }
      node.updateLocationDataIfMissing(this.locationData);
      return this.reference = node;
    };

    Param.prototype.isComplex = function() {
      return this.name.isComplex();
    };

    Param.prototype.eachName = function(iterator, name) {
      var atParam, j, len1, node, obj, ref3;
      if (name == null) {
        name = this.name;
      }
      atParam = function(obj) {
        return iterator("@" + obj.properties[0].name.value, obj);
      };
      if (name instanceof Literal) {
        return iterator(name.value, name);
      }
      if (name instanceof Value) {
        return atParam(name);
      }
      ref3 = name.objects;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        obj = ref3[j];
        if (obj instanceof Assign) {
          this.eachName(iterator, obj.value.unwrap());
        } else if (obj instanceof Splat) {
          node = obj.name.unwrap();
          iterator(node.value, node);
        } else if (obj instanceof Value) {
          if (obj.isArray() || obj.isObject()) {
            this.eachName(iterator, obj.base);
          } else if (obj["this"]) {
            atParam(obj);
          } else {
            iterator(obj.base.value, obj.base);
          }
        } else if (!(obj instanceof Expansion)) {
          obj.error("illegal parameter " + (obj.compile()));
        }
      }
    };

    return Param;

  })(Base);

  exports.Splat = Splat = (function(superClass1) {
    extend1(Splat, superClass1);

    Splat.prototype.children = ['name'];

    Splat.prototype.isAssignable = YES;

    function Splat(name) {
      this.name = name.compile ? name : new Literal(name);
    }

    Splat.prototype.assigns = function(name) {
      return this.name.assigns(name);
    };

    Splat.prototype.compileToFragments = function(o) {
      return this.name.compileToFragments(o);
    };

    Splat.prototype.unwrap = function() {
      return this.name;
    };

    Splat.compileSplattedArray = function(o, list, apply) {
      var args, base, compiledNode, concatPart, fragments, i, index, j, last, len1, node;
      index = -1;
      while ((node = list[++index]) && !(node instanceof Splat)) {
        continue;
      }
      if (index >= list.length) {
        return [];
      }
      if (list.length === 1) {
        node = list[0];
        fragments = node.compileToFragments(o, LEVEL_LIST);
        if (apply) {
          return fragments;
        }
        return [].concat(node.makeCode((utility('slice', o)) + ".call("), fragments, node.makeCode(")"));
      }
      args = list.slice(index);
      for (i = j = 0, len1 = args.length; j < len1; i = ++j) {
        node = args[i];
        compiledNode = node.compileToFragments(o, LEVEL_LIST);
        args[i] = node instanceof Splat ? [].concat(node.makeCode((utility('slice', o)) + ".call("), compiledNode, node.makeCode(")")) : [].concat(node.makeCode("["), compiledNode, node.makeCode("]"));
      }
      if (index === 0) {
        node = list[0];
        concatPart = node.joinFragmentArrays(args.slice(1), ', ');
        return args[0].concat(node.makeCode(".concat("), concatPart, node.makeCode(")"));
      }
      base = (function() {
        var k, len2, ref3, results;
        ref3 = list.slice(0, index);
        results = [];
        for (k = 0, len2 = ref3.length; k < len2; k++) {
          node = ref3[k];
          results.push(node.compileToFragments(o, LEVEL_LIST));
        }
        return results;
      })();
      base = list[0].joinFragmentArrays(base, ', ');
      concatPart = list[index].joinFragmentArrays(args, ', ');
      last = list[list.length - 1];
      return [].concat(list[0].makeCode("["), base, list[index].makeCode("].concat("), concatPart, last.makeCode(")"));
    };

    return Splat;

  })(Base);

  exports.Expansion = Expansion = (function(superClass1) {
    extend1(Expansion, superClass1);

    function Expansion() {
      return Expansion.__super__.constructor.apply(this, arguments);
    }

    Expansion.prototype.isComplex = NO;

    Expansion.prototype.compileNode = function(o) {
      return this.error('Expansion must be used inside a destructuring assignment or parameter list');
    };

    Expansion.prototype.asReference = function(o) {
      return this;
    };

    Expansion.prototype.eachName = function(iterator) {};

    return Expansion;

  })(Base);

  exports.While = While = (function(superClass1) {
    extend1(While, superClass1);

    function While(condition, options) {
      this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
      this.guard = options != null ? options.guard : void 0;
    }

    While.prototype.children = ['condition', 'guard', 'body'];

    While.prototype.isStatement = YES;

    While.prototype.makeReturn = function(res) {
      if (res) {
        return While.__super__.makeReturn.apply(this, arguments);
      } else {
        this.returns = !this.jumps({
          loop: true
        });
        return this;
      }
    };

    While.prototype.addBody = function(body1) {
      this.body = body1;
      return this;
    };

    While.prototype.jumps = function() {
      var expressions, j, jumpNode, len1, node;
      expressions = this.body.expressions;
      if (!expressions.length) {
        return false;
      }
      for (j = 0, len1 = expressions.length; j < len1; j++) {
        node = expressions[j];
        if (jumpNode = node.jumps({
          loop: true
        })) {
          return jumpNode;
        }
      }
      return false;
    };

    While.prototype.compileNode = function(o) {
      var answer, body, rvar, set;
      o.indent += TAB;
      set = '';
      body = this.body;
      if (body.isEmpty()) {
        body = this.makeCode('');
      } else {
        if (this.returns) {
          body.makeReturn(rvar = o.scope.freeVariable('results'));
          set = "" + this.tab + rvar + " = [];\n";
        }
        if (this.guard) {
          if (body.expressions.length > 1) {
            body.expressions.unshift(new If((new Parens(this.guard)).invert(), new Literal("continue")));
          } else {
            if (this.guard) {
              body = Block.wrap([new If(this.guard, body)]);
            }
          }
        }
        body = [].concat(this.makeCode("\n"), body.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab));
      }
      answer = [].concat(this.makeCode(set + this.tab + "while ("), this.condition.compileToFragments(o, LEVEL_PAREN), this.makeCode(") {"), body, this.makeCode("}"));
      if (this.returns) {
        answer.push(this.makeCode("\n" + this.tab + "return " + rvar + ";"));
      }
      return answer;
    };

    return While;

  })(Base);

  exports.Op = Op = (function(superClass1) {
    var CONVERSIONS, INVERSIONS;

    extend1(Op, superClass1);

    function Op(op, first, second, flip) {
      if (op === 'in') {
        return new In(first, second);
      }
      if (op === 'do') {
        return this.generateDo(first);
      }
      if (op === 'new') {
        if (first instanceof Call && !first["do"] && !first.isNew) {
          return first.newInstance();
        }
        if (first instanceof Code && first.bound || first["do"]) {
          first = new Parens(first);
        }
      }
      this.operator = CONVERSIONS[op] || op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      return this;
    }

    CONVERSIONS = {
      '==': '===',
      '!=': '!==',
      'of': 'in',
      'yieldfrom': 'yield*'
    };

    INVERSIONS = {
      '!==': '===',
      '===': '!=='
    };

    Op.prototype.children = ['first', 'second'];

    Op.prototype.isSimpleNumber = NO;

    Op.prototype.isYield = function() {
      var ref3;
      return (ref3 = this.operator) === 'yield' || ref3 === 'yield*';
    };

    Op.prototype.isYieldReturn = function() {
      return this.isYield() && this.first instanceof Return;
    };

    Op.prototype.isUnary = function() {
      return !this.second;
    };

    Op.prototype.isComplex = function() {
      var ref3;
      return !(this.isUnary() && ((ref3 = this.operator) === '+' || ref3 === '-') && this.first instanceof Value && this.first.isSimpleNumber());
    };

    Op.prototype.isChainable = function() {
      var ref3;
      return (ref3 = this.operator) === '<' || ref3 === '>' || ref3 === '>=' || ref3 === '<=' || ref3 === '===' || ref3 === '!==';
    };

    Op.prototype.invert = function() {
      var allInvertable, curr, fst, op, ref3;
      if (this.isChainable() && this.first.isChainable()) {
        allInvertable = true;
        curr = this;
        while (curr && curr.operator) {
          allInvertable && (allInvertable = curr.operator in INVERSIONS);
          curr = curr.first;
        }
        if (!allInvertable) {
          return new Parens(this).invert();
        }
        curr = this;
        while (curr && curr.operator) {
          curr.invert = !curr.invert;
          curr.operator = INVERSIONS[curr.operator];
          curr = curr.first;
        }
        return this;
      } else if (op = INVERSIONS[this.operator]) {
        this.operator = op;
        if (this.first.unwrap() instanceof Op) {
          this.first.invert();
        }
        return this;
      } else if (this.second) {
        return new Parens(this).invert();
      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((ref3 = fst.operator) === '!' || ref3 === 'in' || ref3 === 'instanceof')) {
        return fst;
      } else {
        return new Op('!', this);
      }
    };

    Op.prototype.unfoldSoak = function(o) {
      var ref3;
      return ((ref3 = this.operator) === '++' || ref3 === '--' || ref3 === 'delete') && unfoldSoak(o, this, 'first');
    };

    Op.prototype.generateDo = function(exp) {
      var call, func, j, len1, param, passedParams, ref, ref3;
      passedParams = [];
      func = exp instanceof Assign && (ref = exp.value.unwrap()) instanceof Code ? ref : exp;
      ref3 = func.params || [];
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        param = ref3[j];
        if (param.value) {
          passedParams.push(param.value);
          delete param.value;
        } else {
          passedParams.push(param);
        }
      }
      call = new Call(exp, passedParams);
      call["do"] = true;
      return call;
    };

    Op.prototype.compileNode = function(o) {
      var answer, isChain, lhs, ref3, ref4, rhs;
      isChain = this.isChainable() && this.first.isChainable();
      if (!isChain) {
        this.first.front = this.front;
      }
      if (this.operator === 'delete' && o.scope.check(this.first.unwrapAll().value)) {
        this.error('delete operand may not be argument or var');
      }
      if (((ref3 = this.operator) === '--' || ref3 === '++') && (ref4 = this.first.unwrapAll().value, indexOf.call(STRICT_PROSCRIBED, ref4) >= 0)) {
        this.error("cannot increment/decrement \"" + (this.first.unwrapAll().value) + "\"");
      }
      if (this.isYield()) {
        return this.compileYield(o);
      }
      if (this.isUnary()) {
        return this.compileUnary(o);
      }
      if (isChain) {
        return this.compileChain(o);
      }
      switch (this.operator) {
        case '?':
          return this.compileExistence(o);
        case '**':
          return this.compilePower(o);
        case '//':
          return this.compileFloorDivision(o);
        case '%%':
          return this.compileModulo(o);
        default:
          lhs = this.first.compileToFragments(o, LEVEL_OP);
          rhs = this.second.compileToFragments(o, LEVEL_OP);
          answer = [].concat(lhs, this.makeCode(" " + this.operator + " "), rhs);
          if (o.level <= LEVEL_OP) {
            return answer;
          } else {
            return this.wrapInBraces(answer);
          }
      }
    };

    Op.prototype.compileChain = function(o) {
      var fragments, fst, ref3, shared;
      ref3 = this.first.second.cache(o), this.first.second = ref3[0], shared = ref3[1];
      fst = this.first.compileToFragments(o, LEVEL_OP);
      fragments = fst.concat(this.makeCode(" " + (this.invert ? '&&' : '||') + " "), shared.compileToFragments(o), this.makeCode(" " + this.operator + " "), this.second.compileToFragments(o, LEVEL_OP));
      return this.wrapInBraces(fragments);
    };

    Op.prototype.compileExistence = function(o) {
      var fst, ref;
      if (this.first.isComplex()) {
        ref = new Literal(o.scope.freeVariable('ref'));
        fst = new Parens(new Assign(ref, this.first));
      } else {
        fst = this.first;
        ref = fst;
      }
      return new If(new Existence(fst), ref, {
        type: 'if'
      }).addElse(this.second).compileToFragments(o);
    };

    Op.prototype.compileUnary = function(o) {
      var op, parts, plusMinus;
      parts = [];
      op = this.operator;
      parts.push([this.makeCode(op)]);
      if (op === '!' && this.first instanceof Existence) {
        this.first.negated = !this.first.negated;
        return this.first.compileToFragments(o);
      }
      if (o.level >= LEVEL_ACCESS) {
        return (new Parens(this)).compileToFragments(o);
      }
      plusMinus = op === '+' || op === '-';
      if ((op === 'new' || op === 'typeof' || op === 'delete') || plusMinus && this.first instanceof Op && this.first.operator === op) {
        parts.push([this.makeCode(' ')]);
      }
      if ((plusMinus && this.first instanceof Op) || (op === 'new' && this.first.isStatement(o))) {
        this.first = new Parens(this.first);
      }
      parts.push(this.first.compileToFragments(o, LEVEL_OP));
      if (this.flip) {
        parts.reverse();
      }
      return this.joinFragmentArrays(parts, '');
    };

    Op.prototype.compileYield = function(o) {
      var op, parts;
      parts = [];
      op = this.operator;
      if (o.scope.parent == null) {
        this.error('yield statements must occur within a function generator.');
      }
      if (indexOf.call(Object.keys(this.first), 'expression') >= 0 && !(this.first instanceof Throw)) {
        if (this.isYieldReturn()) {
          parts.push(this.first.compileToFragments(o, LEVEL_TOP));
        } else if (this.first.expression != null) {
          parts.push(this.first.expression.compileToFragments(o, LEVEL_OP));
        }
      } else {
        parts.push([this.makeCode("(" + op + " ")]);
        parts.push(this.first.compileToFragments(o, LEVEL_OP));
        parts.push([this.makeCode(")")]);
      }
      return this.joinFragmentArrays(parts, '');
    };

    Op.prototype.compilePower = function(o) {
      var pow;
      pow = new Value(new Literal('Math'), [new Access(new Literal('pow'))]);
      return new Call(pow, [this.first, this.second]).compileToFragments(o);
    };

    Op.prototype.compileFloorDivision = function(o) {
      var div, floor;
      floor = new Value(new Literal('Math'), [new Access(new Literal('floor'))]);
      div = new Op('/', this.first, this.second);
      return new Call(floor, [div]).compileToFragments(o);
    };

    Op.prototype.compileModulo = function(o) {
      var mod;
      mod = new Value(new Literal(utility('modulo', o)));
      return new Call(mod, [this.first, this.second]).compileToFragments(o);
    };

    Op.prototype.toString = function(idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };

    return Op;

  })(Base);

  exports.In = In = (function(superClass1) {
    extend1(In, superClass1);

    function In(object, array) {
      this.object = object;
      this.array = array;
    }

    In.prototype.children = ['object', 'array'];

    In.prototype.invert = NEGATE;

    In.prototype.compileNode = function(o) {
      var hasSplat, j, len1, obj, ref3;
      if (this.array instanceof Value && this.array.isArray() && this.array.base.objects.length) {
        ref3 = this.array.base.objects;
        for (j = 0, len1 = ref3.length; j < len1; j++) {
          obj = ref3[j];
          if (!(obj instanceof Splat)) {
            continue;
          }
          hasSplat = true;
          break;
        }
        if (!hasSplat) {
          return this.compileOrTest(o);
        }
      }
      return this.compileLoopTest(o);
    };

    In.prototype.compileOrTest = function(o) {
      var cmp, cnj, i, item, j, len1, ref, ref3, ref4, ref5, sub, tests;
      ref3 = this.object.cache(o, LEVEL_OP), sub = ref3[0], ref = ref3[1];
      ref4 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = ref4[0], cnj = ref4[1];
      tests = [];
      ref5 = this.array.base.objects;
      for (i = j = 0, len1 = ref5.length; j < len1; i = ++j) {
        item = ref5[i];
        if (i) {
          tests.push(this.makeCode(cnj));
        }
        tests = tests.concat((i ? ref : sub), this.makeCode(cmp), item.compileToFragments(o, LEVEL_ACCESS));
      }
      if (o.level < LEVEL_OP) {
        return tests;
      } else {
        return this.wrapInBraces(tests);
      }
    };

    In.prototype.compileLoopTest = function(o) {
      var fragments, ref, ref3, sub;
      ref3 = this.object.cache(o, LEVEL_LIST), sub = ref3[0], ref = ref3[1];
      fragments = [].concat(this.makeCode(utility('indexOf', o) + ".call("), this.array.compileToFragments(o, LEVEL_LIST), this.makeCode(", "), ref, this.makeCode(") " + (this.negated ? '< 0' : '>= 0')));
      if (fragmentsToText(sub) === fragmentsToText(ref)) {
        return fragments;
      }
      fragments = sub.concat(this.makeCode(', '), fragments);
      if (o.level < LEVEL_LIST) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    In.prototype.toString = function(idt) {
      return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
    };

    return In;

  })(Base);

  exports.Try = Try = (function(superClass1) {
    extend1(Try, superClass1);

    function Try(attempt, errorVariable, recovery, ensure) {
      this.attempt = attempt;
      this.errorVariable = errorVariable;
      this.recovery = recovery;
      this.ensure = ensure;
    }

    Try.prototype.children = ['attempt', 'recovery', 'ensure'];

    Try.prototype.isStatement = YES;

    Try.prototype.jumps = function(o) {
      var ref3;
      return this.attempt.jumps(o) || ((ref3 = this.recovery) != null ? ref3.jumps(o) : void 0);
    };

    Try.prototype.makeReturn = function(res) {
      if (this.attempt) {
        this.attempt = this.attempt.makeReturn(res);
      }
      if (this.recovery) {
        this.recovery = this.recovery.makeReturn(res);
      }
      return this;
    };

    Try.prototype.compileNode = function(o) {
      var catchPart, ensurePart, placeholder, tryPart;
      o.indent += TAB;
      tryPart = this.attempt.compileToFragments(o, LEVEL_TOP);
      catchPart = this.recovery ? (placeholder = new Literal('_error'), this.errorVariable ? this.recovery.unshift(new Assign(this.errorVariable, placeholder)) : void 0, [].concat(this.makeCode(" catch ("), placeholder.compileToFragments(o), this.makeCode(") {\n"), this.recovery.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}"))) : !(this.ensure || this.recovery) ? [this.makeCode(' catch (_error) {}')] : [];
      ensurePart = this.ensure ? [].concat(this.makeCode(" finally {\n"), this.ensure.compileToFragments(o, LEVEL_TOP), this.makeCode("\n" + this.tab + "}")) : [];
      return [].concat(this.makeCode(this.tab + "try {\n"), tryPart, this.makeCode("\n" + this.tab + "}"), catchPart, ensurePart);
    };

    return Try;

  })(Base);

  exports.Throw = Throw = (function(superClass1) {
    extend1(Throw, superClass1);

    function Throw(expression) {
      this.expression = expression;
    }

    Throw.prototype.children = ['expression'];

    Throw.prototype.isStatement = YES;

    Throw.prototype.jumps = NO;

    Throw.prototype.makeReturn = THIS;

    Throw.prototype.compileNode = function(o) {
      return [].concat(this.makeCode(this.tab + "throw "), this.expression.compileToFragments(o), this.makeCode(";"));
    };

    return Throw;

  })(Base);

  exports.Existence = Existence = (function(superClass1) {
    extend1(Existence, superClass1);

    function Existence(expression) {
      this.expression = expression;
    }

    Existence.prototype.children = ['expression'];

    Existence.prototype.invert = NEGATE;

    Existence.prototype.compileNode = function(o) {
      var cmp, cnj, code, ref3;
      this.expression.front = this.front;
      code = this.expression.compile(o, LEVEL_OP);
      if (IDENTIFIER.test(code) && !o.scope.check(code)) {
        ref3 = this.negated ? ['===', '||'] : ['!==', '&&'], cmp = ref3[0], cnj = ref3[1];
        code = "typeof " + code + " " + cmp + " \"undefined\" " + cnj + " " + code + " " + cmp + " null";
      } else {
        code = code + " " + (this.negated ? '==' : '!=') + " null";
      }
      return [this.makeCode(o.level <= LEVEL_COND ? code : "(" + code + ")")];
    };

    return Existence;

  })(Base);

  exports.Parens = Parens = (function(superClass1) {
    extend1(Parens, superClass1);

    function Parens(body1) {
      this.body = body1;
    }

    Parens.prototype.children = ['body'];

    Parens.prototype.unwrap = function() {
      return this.body;
    };

    Parens.prototype.isComplex = function() {
      return this.body.isComplex();
    };

    Parens.prototype.compileNode = function(o) {
      var bare, expr, fragments;
      expr = this.body.unwrap();
      if (expr instanceof Value && expr.isAtomic()) {
        expr.front = this.front;
        return expr.compileToFragments(o);
      }
      fragments = expr.compileToFragments(o, LEVEL_PAREN);
      bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call || (expr instanceof For && expr.returns));
      if (bare) {
        return fragments;
      } else {
        return this.wrapInBraces(fragments);
      }
    };

    return Parens;

  })(Base);

  exports.For = For = (function(superClass1) {
    extend1(For, superClass1);

    function For(body, source) {
      var ref3;
      this.source = source.source, this.guard = source.guard, this.step = source.step, this.name = source.name, this.index = source.index;
      this.body = Block.wrap([body]);
      this.own = !!source.own;
      this.object = !!source.object;
      if (this.object) {
        ref3 = [this.index, this.name], this.name = ref3[0], this.index = ref3[1];
      }
      if (this.index instanceof Value) {
        this.index.error('index cannot be a pattern matching expression');
      }
      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length;
      this.pattern = this.name instanceof Value;
      if (this.range && this.index) {
        this.index.error('indexes do not apply to range loops');
      }
      if (this.range && this.pattern) {
        this.name.error('cannot pattern match over range loops');
      }
      if (this.own && !this.object) {
        this.name.error('cannot use own with for-in');
      }
      this.returns = false;
    }

    For.prototype.children = ['body', 'source', 'guard', 'step'];

    For.prototype.compileNode = function(o) {
      var body, bodyFragments, compare, compareDown, declare, declareDown, defPart, defPartFragments, down, forPartFragments, guardPart, idt1, increment, index, ivar, kvar, kvarAssign, last, lvar, name, namePart, ref, ref3, ref4, resultPart, returnResult, rvar, scope, source, step, stepNum, stepVar, svar, varPart;
      body = Block.wrap([this.body]);
      ref3 = body.expressions, last = ref3[ref3.length - 1];
      if ((last != null ? last.jumps() : void 0) instanceof Return) {
        this.returns = false;
      }
      source = this.range ? this.source.base : this.source;
      scope = o.scope;
      if (!this.pattern) {
        name = this.name && (this.name.compile(o, LEVEL_LIST));
      }
      index = this.index && (this.index.compile(o, LEVEL_LIST));
      if (name && !this.pattern) {
        scope.find(name);
      }
      if (index) {
        scope.find(index);
      }
      if (this.returns) {
        rvar = scope.freeVariable('results');
      }
      ivar = (this.object && index) || scope.freeVariable('i', {
        single: true
      });
      kvar = (this.range && name) || index || ivar;
      kvarAssign = kvar !== ivar ? kvar + " = " : "";
      if (this.step && !this.range) {
        ref4 = this.cacheToCodeFragments(this.step.cache(o, LEVEL_LIST, isComplexOrAssignable)), step = ref4[0], stepVar = ref4[1];
        stepNum = stepVar.match(NUMBER);
      }
      if (this.pattern) {
        name = ivar;
      }
      varPart = '';
      guardPart = '';
      defPart = '';
      idt1 = this.tab + TAB;
      if (this.range) {
        forPartFragments = source.compileToFragments(merge(o, {
          index: ivar,
          name: name,
          step: this.step,
          isComplex: isComplexOrAssignable
        }));
      } else {
        svar = this.source.compile(o, LEVEL_LIST);
        if ((name || this.own) && !IDENTIFIER.test(svar)) {
          defPart += "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
          svar = ref;
        }
        if (name && !this.pattern) {
          namePart = name + " = " + svar + "[" + kvar + "]";
        }
        if (!this.object) {
          if (step !== stepVar) {
            defPart += "" + this.tab + step + ";\n";
          }
          if (!(this.step && stepNum && (down = parseNum(stepNum[0]) < 0))) {
            lvar = scope.freeVariable('len');
          }
          declare = "" + kvarAssign + ivar + " = 0, " + lvar + " = " + svar + ".length";
          declareDown = "" + kvarAssign + ivar + " = " + svar + ".length - 1";
          compare = ivar + " < " + lvar;
          compareDown = ivar + " >= 0";
          if (this.step) {
            if (stepNum) {
              if (down) {
                compare = compareDown;
                declare = declareDown;
              }
            } else {
              compare = stepVar + " > 0 ? " + compare + " : " + compareDown;
              declare = "(" + stepVar + " > 0 ? (" + declare + ") : " + declareDown + ")";
            }
            increment = ivar + " += " + stepVar;
          } else {
            increment = "" + (kvar !== ivar ? "++" + ivar : ivar + "++");
          }
          forPartFragments = [this.makeCode(declare + "; " + compare + "; " + kvarAssign + increment)];
        }
      }
      if (this.returns) {
        resultPart = "" + this.tab + rvar + " = [];\n";
        returnResult = "\n" + this.tab + "return " + rvar + ";";
        body.makeReturn(rvar);
      }
      if (this.guard) {
        if (body.expressions.length > 1) {
          body.expressions.unshift(new If((new Parens(this.guard)).invert(), new Literal("continue")));
        } else {
          if (this.guard) {
            body = Block.wrap([new If(this.guard, body)]);
          }
        }
      }
      if (this.pattern) {
        body.expressions.unshift(new Assign(this.name, new Literal(svar + "[" + kvar + "]")));
      }
      defPartFragments = [].concat(this.makeCode(defPart), this.pluckDirectCall(o, body));
      if (namePart) {
        varPart = "\n" + idt1 + namePart + ";";
      }
      if (this.object) {
        forPartFragments = [this.makeCode(kvar + " in " + svar)];
        if (this.own) {
          guardPart = "\n" + idt1 + "if (!" + (utility('hasProp', o)) + ".call(" + svar + ", " + kvar + ")) continue;";
        }
      }
      bodyFragments = body.compileToFragments(merge(o, {
        indent: idt1
      }), LEVEL_TOP);
      if (bodyFragments && (bodyFragments.length > 0)) {
        bodyFragments = [].concat(this.makeCode("\n"), bodyFragments, this.makeCode("\n"));
      }
      return [].concat(defPartFragments, this.makeCode("" + (resultPart || '') + this.tab + "for ("), forPartFragments, this.makeCode(") {" + guardPart + varPart), bodyFragments, this.makeCode(this.tab + "}" + (returnResult || '')));
    };

    For.prototype.pluckDirectCall = function(o, body) {
      var base, defs, expr, fn, idx, j, len1, ref, ref3, ref4, ref5, ref6, ref7, ref8, ref9, val;
      defs = [];
      ref3 = body.expressions;
      for (idx = j = 0, len1 = ref3.length; j < len1; idx = ++j) {
        expr = ref3[idx];
        expr = expr.unwrapAll();
        if (!(expr instanceof Call)) {
          continue;
        }
        val = (ref4 = expr.variable) != null ? ref4.unwrapAll() : void 0;
        if (!((val instanceof Code) || (val instanceof Value && ((ref5 = val.base) != null ? ref5.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((ref6 = (ref7 = val.properties[0].name) != null ? ref7.value : void 0) === 'call' || ref6 === 'apply')))) {
          continue;
        }
        fn = ((ref8 = val.base) != null ? ref8.unwrapAll() : void 0) || val;
        ref = new Literal(o.scope.freeVariable('fn'));
        base = new Value(ref);
        if (val.base) {
          ref9 = [base, val], val.base = ref9[0], base = ref9[1];
        }
        body.expressions[idx] = new Call(base, expr.args);
        defs = defs.concat(this.makeCode(this.tab), new Assign(ref, fn).compileToFragments(o, LEVEL_TOP), this.makeCode(';\n'));
      }
      return defs;
    };

    return For;

  })(While);

  exports.Switch = Switch = (function(superClass1) {
    extend1(Switch, superClass1);

    function Switch(subject, cases, otherwise) {
      this.subject = subject;
      this.cases = cases;
      this.otherwise = otherwise;
    }

    Switch.prototype.children = ['subject', 'cases', 'otherwise'];

    Switch.prototype.isStatement = YES;

    Switch.prototype.jumps = function(o) {
      var block, conds, j, jumpNode, len1, ref3, ref4, ref5;
      if (o == null) {
        o = {
          block: true
        };
      }
      ref3 = this.cases;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        ref4 = ref3[j], conds = ref4[0], block = ref4[1];
        if (jumpNode = block.jumps(o)) {
          return jumpNode;
        }
      }
      return (ref5 = this.otherwise) != null ? ref5.jumps(o) : void 0;
    };

    Switch.prototype.makeReturn = function(res) {
      var j, len1, pair, ref3, ref4;
      ref3 = this.cases;
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        pair = ref3[j];
        pair[1].makeReturn(res);
      }
      if (res) {
        this.otherwise || (this.otherwise = new Block([new Literal('void 0')]));
      }
      if ((ref4 = this.otherwise) != null) {
        ref4.makeReturn(res);
      }
      return this;
    };

    Switch.prototype.compileNode = function(o) {
      var block, body, cond, conditions, expr, fragments, i, idt1, idt2, j, k, len1, len2, ref3, ref4, ref5;
      idt1 = o.indent + TAB;
      idt2 = o.indent = idt1 + TAB;
      fragments = [].concat(this.makeCode(this.tab + "switch ("), (this.subject ? this.subject.compileToFragments(o, LEVEL_PAREN) : this.makeCode("false")), this.makeCode(") {\n"));
      ref3 = this.cases;
      for (i = j = 0, len1 = ref3.length; j < len1; i = ++j) {
        ref4 = ref3[i], conditions = ref4[0], block = ref4[1];
        ref5 = flatten([conditions]);
        for (k = 0, len2 = ref5.length; k < len2; k++) {
          cond = ref5[k];
          if (!this.subject) {
            cond = cond.invert();
          }
          fragments = fragments.concat(this.makeCode(idt1 + "case "), cond.compileToFragments(o, LEVEL_PAREN), this.makeCode(":\n"));
        }
        if ((body = block.compileToFragments(o, LEVEL_TOP)).length > 0) {
          fragments = fragments.concat(body, this.makeCode('\n'));
        }
        if (i === this.cases.length - 1 && !this.otherwise) {
          break;
        }
        expr = this.lastNonComment(block.expressions);
        if (expr instanceof Return || (expr instanceof Literal && expr.jumps() && expr.value !== 'debugger')) {
          continue;
        }
        fragments.push(cond.makeCode(idt2 + 'break;\n'));
      }
      if (this.otherwise && this.otherwise.expressions.length) {
        fragments.push.apply(fragments, [this.makeCode(idt1 + "default:\n")].concat(slice.call(this.otherwise.compileToFragments(o, LEVEL_TOP)), [this.makeCode("\n")]));
      }
      fragments.push(this.makeCode(this.tab + '}'));
      return fragments;
    };

    return Switch;

  })(Base);

  exports.If = If = (function(superClass1) {
    extend1(If, superClass1);

    function If(condition, body1, options) {
      this.body = body1;
      if (options == null) {
        options = {};
      }
      this.condition = options.type === 'unless' ? condition.invert() : condition;
      this.elseBody = null;
      this.isChain = false;
      this.soak = options.soak;
    }

    If.prototype.children = ['condition', 'body', 'elseBody'];

    If.prototype.bodyNode = function() {
      var ref3;
      return (ref3 = this.body) != null ? ref3.unwrap() : void 0;
    };

    If.prototype.elseBodyNode = function() {
      var ref3;
      return (ref3 = this.elseBody) != null ? ref3.unwrap() : void 0;
    };

    If.prototype.addElse = function(elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureBlock(elseBody);
        this.elseBody.updateLocationDataIfMissing(elseBody.locationData);
      }
      return this;
    };

    If.prototype.isStatement = function(o) {
      var ref3;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((ref3 = this.elseBodyNode()) != null ? ref3.isStatement(o) : void 0);
    };

    If.prototype.jumps = function(o) {
      var ref3;
      return this.body.jumps(o) || ((ref3 = this.elseBody) != null ? ref3.jumps(o) : void 0);
    };

    If.prototype.compileNode = function(o) {
      if (this.isStatement(o)) {
        return this.compileStatement(o);
      } else {
        return this.compileExpression(o);
      }
    };

    If.prototype.makeReturn = function(res) {
      if (res) {
        this.elseBody || (this.elseBody = new Block([new Literal('void 0')]));
      }
      this.body && (this.body = new Block([this.body.makeReturn(res)]));
      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn(res)]));
      return this;
    };

    If.prototype.ensureBlock = function(node) {
      if (node instanceof Block) {
        return node;
      } else {
        return new Block([node]);
      }
    };

    If.prototype.compileStatement = function(o) {
      var answer, body, child, cond, exeq, ifPart, indent;
      child = del(o, 'chainChild');
      exeq = del(o, 'isExistentialEquals');
      if (exeq) {
        return new If(this.condition.invert(), this.elseBodyNode(), {
          type: 'if'
        }).compileToFragments(o);
      }
      indent = o.indent + TAB;
      cond = this.condition.compileToFragments(o, LEVEL_PAREN);
      body = this.ensureBlock(this.body).compileToFragments(merge(o, {
        indent: indent
      }));
      ifPart = [].concat(this.makeCode("if ("), cond, this.makeCode(") {\n"), body, this.makeCode("\n" + this.tab + "}"));
      if (!child) {
        ifPart.unshift(this.makeCode(this.tab));
      }
      if (!this.elseBody) {
        return ifPart;
      }
      answer = ifPart.concat(this.makeCode(' else '));
      if (this.isChain) {
        o.chainChild = true;
        answer = answer.concat(this.elseBody.unwrap().compileToFragments(o, LEVEL_TOP));
      } else {
        answer = answer.concat(this.makeCode("{\n"), this.elseBody.compileToFragments(merge(o, {
          indent: indent
        }), LEVEL_TOP), this.makeCode("\n" + this.tab + "}"));
      }
      return answer;
    };

    If.prototype.compileExpression = function(o) {
      var alt, body, cond, fragments;
      cond = this.condition.compileToFragments(o, LEVEL_COND);
      body = this.bodyNode().compileToFragments(o, LEVEL_LIST);
      alt = this.elseBodyNode() ? this.elseBodyNode().compileToFragments(o, LEVEL_LIST) : [this.makeCode('void 0')];
      fragments = cond.concat(this.makeCode(" ? "), body, this.makeCode(" : "), alt);
      if (o.level >= LEVEL_COND) {
        return this.wrapInBraces(fragments);
      } else {
        return fragments;
      }
    };

    If.prototype.unfoldSoak = function() {
      return this.soak && this;
    };

    return If;

  })(Base);

  UTILITIES = {
    extend: function(o) {
      return "function(child, parent) { for (var key in parent) { if (" + (utility('hasProp', o)) + ".call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; }";
    },
    bind: function() {
      return 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }';
    },
    indexOf: function() {
      return "[].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }";
    },
    modulo: function() {
      return "function(a, b) { return (+a % (b = +b) + b) % b; }";
    },
    hasProp: function() {
      return '{}.hasOwnProperty';
    },
    slice: function() {
      return '[].slice';
    }
  };

  LEVEL_TOP = 1;

  LEVEL_PAREN = 2;

  LEVEL_LIST = 3;

  LEVEL_COND = 4;

  LEVEL_OP = 5;

  LEVEL_ACCESS = 6;

  TAB = '  ';

  IDENTIFIER = /^(?!\d)[$\w\x7f-\uffff]+$/;

  SIMPLENUM = /^[+-]?\d+$/;

  HEXNUM = /^[+-]?0x[\da-f]+/i;

  NUMBER = /^[+-]?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)$/i;

  IS_STRING = /^['"]/;

  IS_REGEX = /^\//;

  utility = function(name, o) {
    var ref, root;
    root = o.scope.root;
    if (name in root.utilities) {
      return root.utilities[name];
    } else {
      ref = root.freeVariable(name);
      root.assign(ref, UTILITIES[name](o));
      return root.utilities[name] = ref;
    }
  };

  multident = function(code, tab) {
    code = code.replace(/\n/g, '$&' + tab);
    return code.replace(/\s+$/, '');
  };

  parseNum = function(x) {
    if (x == null) {
      return 0;
    } else if (x.match(HEXNUM)) {
      return parseInt(x, 16);
    } else {
      return parseFloat(x);
    }
  };

  isLiteralArguments = function(node) {
    return node instanceof Literal && node.value === 'arguments' && !node.asKey;
  };

  isLiteralThis = function(node) {
    return (node instanceof Literal && node.value === 'this' && !node.asKey) || (node instanceof Code && node.bound) || (node instanceof Call && node.isSuper);
  };

  isComplexOrAssignable = function(node) {
    return node.isComplex() || (typeof node.isAssignable === "function" ? node.isAssignable() : void 0);
  };

  unfoldSoak = function(o, parent, name) {
    var ifn;
    if (!(ifn = parent[name].unfoldSoak(o))) {
      return;
    }
    parent[name] = ifn.body;
    ifn.body = new Value(parent);
    return ifn;
  };

}).call(this);

},{"./helpers":43,"./lexer":44,"./scope":49}],46:[function(require,module,exports){
(function (process){
/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[1,20],$V1=[1,75],$V2=[1,71],$V3=[1,76],$V4=[1,77],$V5=[1,73],$V6=[1,74],$V7=[1,50],$V8=[1,52],$V9=[1,53],$Va=[1,54],$Vb=[1,55],$Vc=[1,45],$Vd=[1,46],$Ve=[1,27],$Vf=[1,60],$Vg=[1,61],$Vh=[1,70],$Vi=[1,43],$Vj=[1,26],$Vk=[1,58],$Vl=[1,59],$Vm=[1,57],$Vn=[1,38],$Vo=[1,44],$Vp=[1,56],$Vq=[1,65],$Vr=[1,66],$Vs=[1,67],$Vt=[1,68],$Vu=[1,42],$Vv=[1,64],$Vw=[1,29],$Vx=[1,30],$Vy=[1,31],$Vz=[1,32],$VA=[1,33],$VB=[1,34],$VC=[1,35],$VD=[1,78],$VE=[1,6,26,34,108],$VF=[1,88],$VG=[1,81],$VH=[1,80],$VI=[1,79],$VJ=[1,82],$VK=[1,83],$VL=[1,84],$VM=[1,85],$VN=[1,86],$VO=[1,87],$VP=[1,91],$VQ=[1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,135,136,141,142,143,144,145,146,147],$VR=[1,97],$VS=[1,98],$VT=[1,99],$VU=[1,100],$VV=[1,102],$VW=[1,103],$VX=[1,96],$VY=[2,112],$VZ=[1,6,25,26,34,55,60,63,72,73,74,75,77,79,80,84,90,91,92,97,99,108,110,111,112,116,117,132,135,136,141,142,143,144,145,146,147],$V_=[2,79],$V$=[1,108],$V01=[2,58],$V11=[1,112],$V21=[1,117],$V31=[1,118],$V41=[1,120],$V51=[1,6,25,26,34,46,55,60,63,72,73,74,75,77,79,80,84,90,91,92,97,99,108,110,111,112,116,117,132,135,136,141,142,143,144,145,146,147],$V61=[2,76],$V71=[1,6,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,135,136,141,142,143,144,145,146,147],$V81=[1,155],$V91=[1,157],$Va1=[1,152],$Vb1=[1,6,25,26,34,46,55,60,63,72,73,74,75,77,79,80,84,86,90,91,92,97,99,108,110,111,112,116,117,132,135,136,139,140,141,142,143,144,145,146,147,148],$Vc1=[2,95],$Vd1=[1,6,25,26,34,49,55,60,63,72,73,74,75,77,79,80,84,90,91,92,97,99,108,110,111,112,116,117,132,135,136,141,142,143,144,145,146,147],$Ve1=[1,6,25,26,34,46,49,55,60,63,72,73,74,75,77,79,80,84,86,90,91,92,97,99,108,110,111,112,116,117,123,124,132,135,136,139,140,141,142,143,144,145,146,147,148],$Vf1=[1,206],$Vg1=[1,205],$Vh1=[1,6,25,26,34,38,55,60,63,72,73,74,75,77,79,80,84,90,91,92,97,99,108,110,111,112,116,117,132,135,136,141,142,143,144,145,146,147],$Vi1=[2,56],$Vj1=[1,216],$Vk1=[6,25,26,55,60],$Vl1=[6,25,26,46,55,60,63],$Vm1=[1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,135,136,142,144,145,146,147],$Vn1=[1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132],$Vo1=[72,73,74,75,77,80,90,91],$Vp1=[1,235],$Vq1=[2,133],$Vr1=[1,6,25,26,34,46,55,60,63,72,73,74,75,77,79,80,84,90,91,92,97,99,108,110,111,112,116,117,123,124,132,135,136,141,142,143,144,145,146,147],$Vs1=[1,244],$Vt1=[6,25,26,60,92,97],$Vu1=[1,6,25,26,34,55,60,63,79,84,92,97,99,108,117,132],$Vv1=[1,6,25,26,34,55,60,63,79,84,92,97,99,108,111,117,132],$Vw1=[123,124],$Vx1=[60,123,124],$Vy1=[1,255],$Vz1=[6,25,26,60,84],$VA1=[6,25,26,49,60,84],$VB1=[1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,135,136,144,145,146,147],$VC1=[11,28,30,32,33,36,37,40,41,42,43,44,51,52,53,57,58,79,82,85,89,94,95,96,102,106,107,110,112,114,116,125,131,133,134,135,136,137,139,140],$VD1=[2,122],$VE1=[6,25,26],$VF1=[2,57],$VG1=[1,268],$VH1=[1,269],$VI1=[1,6,25,26,34,55,60,63,79,84,92,97,99,104,105,108,110,111,112,116,117,127,129,132,135,136,141,142,143,144,145,146,147],$VJ1=[26,127,129],$VK1=[1,6,26,34,55,60,63,79,84,92,97,99,108,111,117,132],$VL1=[2,71],$VM1=[1,291],$VN1=[1,292],$VO1=[1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,127,132,135,136,141,142,143,144,145,146,147],$VP1=[1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,112,116,117,132],$VQ1=[1,303],$VR1=[1,304],$VS1=[6,25,26,60],$VT1=[1,6,25,26,34,55,60,63,79,84,92,97,99,104,108,110,111,112,116,117,132,135,136,141,142,143,144,145,146,147],$VU1=[25,60];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Root":3,"Body":4,"Line":5,"TERMINATOR":6,"Expression":7,"Statement":8,"Return":9,"Comment":10,"STATEMENT":11,"Value":12,"Invocation":13,"Code":14,"Operation":15,"Assign":16,"If":17,"Try":18,"While":19,"For":20,"Switch":21,"Class":22,"Throw":23,"Block":24,"INDENT":25,"OUTDENT":26,"Identifier":27,"IDENTIFIER":28,"AlphaNumeric":29,"NUMBER":30,"String":31,"STRING":32,"STRING_START":33,"STRING_END":34,"Regex":35,"REGEX":36,"REGEX_START":37,"REGEX_END":38,"Literal":39,"JS":40,"DEBUGGER":41,"UNDEFINED":42,"NULL":43,"BOOL":44,"Assignable":45,"=":46,"AssignObj":47,"ObjAssignable":48,":":49,"ThisProperty":50,"RETURN":51,"HERECOMMENT":52,"PARAM_START":53,"ParamList":54,"PARAM_END":55,"FuncGlyph":56,"->":57,"=>":58,"OptComma":59,",":60,"Param":61,"ParamVar":62,"...":63,"Array":64,"Object":65,"Splat":66,"SimpleAssignable":67,"Accessor":68,"Parenthetical":69,"Range":70,"This":71,".":72,"?.":73,"::":74,"?::":75,"Index":76,"INDEX_START":77,"IndexValue":78,"INDEX_END":79,"INDEX_SOAK":80,"Slice":81,"{":82,"AssignList":83,"}":84,"CLASS":85,"EXTENDS":86,"OptFuncExist":87,"Arguments":88,"SUPER":89,"FUNC_EXIST":90,"CALL_START":91,"CALL_END":92,"ArgList":93,"THIS":94,"@":95,"[":96,"]":97,"RangeDots":98,"..":99,"Arg":100,"SimpleArgs":101,"TRY":102,"Catch":103,"FINALLY":104,"CATCH":105,"THROW":106,"(":107,")":108,"WhileSource":109,"WHILE":110,"WHEN":111,"UNTIL":112,"Loop":113,"LOOP":114,"ForBody":115,"FOR":116,"BY":117,"ForStart":118,"ForSource":119,"ForVariables":120,"OWN":121,"ForValue":122,"FORIN":123,"FOROF":124,"SWITCH":125,"Whens":126,"ELSE":127,"When":128,"LEADING_WHEN":129,"IfBlock":130,"IF":131,"POST_IF":132,"UNARY":133,"UNARY_MATH":134,"-":135,"+":136,"YIELD":137,"FROM":138,"--":139,"++":140,"?":141,"MATH":142,"**":143,"SHIFT":144,"COMPARE":145,"LOGIC":146,"RELATION":147,"COMPOUND_ASSIGN":148,"$accept":0,"$end":1},
terminals_: {2:"error",6:"TERMINATOR",11:"STATEMENT",25:"INDENT",26:"OUTDENT",28:"IDENTIFIER",30:"NUMBER",32:"STRING",33:"STRING_START",34:"STRING_END",36:"REGEX",37:"REGEX_START",38:"REGEX_END",40:"JS",41:"DEBUGGER",42:"UNDEFINED",43:"NULL",44:"BOOL",46:"=",49:":",51:"RETURN",52:"HERECOMMENT",53:"PARAM_START",55:"PARAM_END",57:"->",58:"=>",60:",",63:"...",72:".",73:"?.",74:"::",75:"?::",77:"INDEX_START",79:"INDEX_END",80:"INDEX_SOAK",82:"{",84:"}",85:"CLASS",86:"EXTENDS",89:"SUPER",90:"FUNC_EXIST",91:"CALL_START",92:"CALL_END",94:"THIS",95:"@",96:"[",97:"]",99:"..",102:"TRY",104:"FINALLY",105:"CATCH",106:"THROW",107:"(",108:")",110:"WHILE",111:"WHEN",112:"UNTIL",114:"LOOP",116:"FOR",117:"BY",121:"OWN",123:"FORIN",124:"FOROF",125:"SWITCH",127:"ELSE",129:"LEADING_WHEN",131:"IF",132:"POST_IF",133:"UNARY",134:"UNARY_MATH",135:"-",136:"+",137:"YIELD",138:"FROM",139:"--",140:"++",141:"?",142:"MATH",143:"**",144:"SHIFT",145:"COMPARE",146:"LOGIC",147:"RELATION",148:"COMPOUND_ASSIGN"},
productions_: [0,[3,0],[3,1],[4,1],[4,3],[4,2],[5,1],[5,1],[8,1],[8,1],[8,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[7,1],[24,2],[24,3],[27,1],[29,1],[29,1],[31,1],[31,3],[35,1],[35,3],[39,1],[39,1],[39,1],[39,1],[39,1],[39,1],[39,1],[16,3],[16,4],[16,5],[47,1],[47,3],[47,5],[47,1],[48,1],[48,1],[48,1],[9,2],[9,1],[10,1],[14,5],[14,2],[56,1],[56,1],[59,0],[59,1],[54,0],[54,1],[54,3],[54,4],[54,6],[61,1],[61,2],[61,3],[61,1],[62,1],[62,1],[62,1],[62,1],[66,2],[67,1],[67,2],[67,2],[67,1],[45,1],[45,1],[45,1],[12,1],[12,1],[12,1],[12,1],[12,1],[68,2],[68,2],[68,2],[68,2],[68,1],[68,1],[76,3],[76,2],[78,1],[78,1],[65,4],[83,0],[83,1],[83,3],[83,4],[83,6],[22,1],[22,2],[22,3],[22,4],[22,2],[22,3],[22,4],[22,5],[13,3],[13,3],[13,1],[13,2],[87,0],[87,1],[88,2],[88,4],[71,1],[71,1],[50,2],[64,2],[64,4],[98,1],[98,1],[70,5],[81,3],[81,2],[81,2],[81,1],[93,1],[93,3],[93,4],[93,4],[93,6],[100,1],[100,1],[100,1],[101,1],[101,3],[18,2],[18,3],[18,4],[18,5],[103,3],[103,3],[103,2],[23,2],[69,3],[69,5],[109,2],[109,4],[109,2],[109,4],[19,2],[19,2],[19,2],[19,1],[113,2],[113,2],[20,2],[20,2],[20,2],[115,2],[115,4],[115,2],[118,2],[118,3],[122,1],[122,1],[122,1],[122,1],[120,1],[120,3],[119,2],[119,2],[119,4],[119,4],[119,4],[119,6],[119,6],[21,5],[21,7],[21,4],[21,6],[126,1],[126,2],[128,3],[128,4],[130,3],[130,5],[17,1],[17,3],[17,3],[17,3],[15,2],[15,2],[15,2],[15,2],[15,2],[15,2],[15,3],[15,2],[15,2],[15,2],[15,2],[15,2],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,3],[15,5],[15,4],[15,3]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
return this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Block);
break;
case 2:
return this.$ = $$[$0];
break;
case 3:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(yy.Block.wrap([$$[$0]]));
break;
case 4:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].push($$[$0]));
break;
case 5:
this.$ = $$[$0-1];
break;
case 6: case 7: case 8: case 9: case 11: case 12: case 13: case 14: case 15: case 16: case 17: case 18: case 19: case 20: case 21: case 22: case 27: case 32: case 34: case 45: case 46: case 47: case 48: case 56: case 57: case 67: case 68: case 69: case 70: case 75: case 76: case 79: case 83: case 89: case 133: case 134: case 136: case 166: case 167: case 183: case 189:
this.$ = $$[$0];
break;
case 10: case 25: case 26: case 28: case 30: case 33: case 35:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Literal($$[$0]));
break;
case 23:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Block);
break;
case 24: case 31: case 90:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-1]);
break;
case 29: case 146:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Parens($$[$0-1]));
break;
case 36:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Undefined);
break;
case 37:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Null);
break;
case 38:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Bool($$[$0]));
break;
case 39:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign($$[$0-2], $$[$0]));
break;
case 40:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Assign($$[$0-3], $$[$0]));
break;
case 41:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign($$[$0-4], $$[$0-1]));
break;
case 42: case 72: case 77: case 78: case 80: case 81: case 82: case 168: case 169:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value($$[$0]));
break;
case 43:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign(yy.addLocationDataFn(_$[$0-2])(new yy.Value($$[$0-2])), $$[$0], 'object'));
break;
case 44:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign(yy.addLocationDataFn(_$[$0-4])(new yy.Value($$[$0-4])), $$[$0-1], 'object'));
break;
case 49:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Return($$[$0]));
break;
case 50:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Return);
break;
case 51:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Comment($$[$0]));
break;
case 52:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Code($$[$0-3], $$[$0], $$[$0-1]));
break;
case 53:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Code([], $$[$0], $$[$0-1]));
break;
case 54:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('func');
break;
case 55:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('boundfunc');
break;
case 58: case 95:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([]);
break;
case 59: case 96: case 128: case 170:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])([$$[$0]]);
break;
case 60: case 97: case 129:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].concat($$[$0]));
break;
case 61: case 98: case 130:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-3].concat($$[$0]));
break;
case 62: case 99: case 132:
this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])($$[$0-5].concat($$[$0-2]));
break;
case 63:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Param($$[$0]));
break;
case 64:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Param($$[$0-1], null, true));
break;
case 65:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Param($$[$0-2], $$[$0]));
break;
case 66: case 135:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Expansion);
break;
case 71:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Splat($$[$0-1]));
break;
case 73:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].add($$[$0]));
break;
case 74:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Value($$[$0-1], [].concat($$[$0])));
break;
case 84:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Access($$[$0]));
break;
case 85:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Access($$[$0], 'soak'));
break;
case 86:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Access(new yy.Literal('prototype'))), yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))]);
break;
case 87:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Access(new yy.Literal('prototype'), 'soak')), yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))]);
break;
case 88:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Access(new yy.Literal('prototype')));
break;
case 91:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(yy.extend($$[$0], {
          soak: true
        }));
break;
case 92:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Index($$[$0]));
break;
case 93:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Slice($$[$0]));
break;
case 94:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Obj($$[$0-2], $$[$0-3].generated));
break;
case 100:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Class);
break;
case 101:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Class(null, null, $$[$0]));
break;
case 102:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Class(null, $$[$0]));
break;
case 103:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Class(null, $$[$0-1], $$[$0]));
break;
case 104:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Class($$[$0]));
break;
case 105:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Class($$[$0-1], null, $$[$0]));
break;
case 106:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Class($$[$0-2], $$[$0]));
break;
case 107:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Class($$[$0-3], $$[$0-1], $$[$0]));
break;
case 108: case 109:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Call($$[$0-2], $$[$0], $$[$0-1]));
break;
case 110:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Call('super', [new yy.Splat(new yy.Literal('arguments'))]));
break;
case 111:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Call('super', $$[$0]));
break;
case 112:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(false);
break;
case 113:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(true);
break;
case 114:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([]);
break;
case 115: case 131:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])($$[$0-2]);
break;
case 116: case 117:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Value(new yy.Literal('this')));
break;
case 118:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Value(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('this')), [yy.addLocationDataFn(_$[$0])(new yy.Access($$[$0]))], 'this'));
break;
case 119:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Arr([]));
break;
case 120:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Arr($$[$0-2]));
break;
case 121:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('inclusive');
break;
case 122:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])('exclusive');
break;
case 123:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Range($$[$0-3], $$[$0-1], $$[$0-2]));
break;
case 124:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Range($$[$0-2], $$[$0], $$[$0-1]));
break;
case 125:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Range($$[$0-1], null, $$[$0]));
break;
case 126:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Range(null, $$[$0], $$[$0-1]));
break;
case 127:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])(new yy.Range(null, null, $$[$0]));
break;
case 137:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([].concat($$[$0-2], $$[$0]));
break;
case 138:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Try($$[$0]));
break;
case 139:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Try($$[$0-1], $$[$0][0], $$[$0][1]));
break;
case 140:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Try($$[$0-2], null, null, $$[$0]));
break;
case 141:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Try($$[$0-3], $$[$0-2][0], $$[$0-2][1], $$[$0]));
break;
case 142:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([$$[$0-1], $$[$0]]);
break;
case 143:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([yy.addLocationDataFn(_$[$0-1])(new yy.Value($$[$0-1])), $$[$0]]);
break;
case 144:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])([null, $$[$0]]);
break;
case 145:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Throw($$[$0]));
break;
case 147:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Parens($$[$0-2]));
break;
case 148:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While($$[$0]));
break;
case 149:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.While($$[$0-2], {
          guard: $$[$0]
        }));
break;
case 150:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While($$[$0], {
          invert: true
        }));
break;
case 151:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.While($$[$0-2], {
          invert: true,
          guard: $$[$0]
        }));
break;
case 152:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].addBody($$[$0]));
break;
case 153: case 154:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0].addBody(yy.addLocationDataFn(_$[$0-1])(yy.Block.wrap([$$[$0-1]]))));
break;
case 155:
this.$ = yy.addLocationDataFn(_$[$0], _$[$0])($$[$0]);
break;
case 156:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('true'))).addBody($$[$0]));
break;
case 157:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.While(yy.addLocationDataFn(_$[$0-1])(new yy.Literal('true'))).addBody(yy.addLocationDataFn(_$[$0])(yy.Block.wrap([$$[$0]]))));
break;
case 158: case 159:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.For($$[$0-1], $$[$0]));
break;
case 160:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.For($$[$0], $$[$0-1]));
break;
case 161:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
          source: yy.addLocationDataFn(_$[$0])(new yy.Value($$[$0]))
        });
break;
case 162:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
          source: yy.addLocationDataFn(_$[$0-2])(new yy.Value($$[$0-2])),
          step: $$[$0]
        });
break;
case 163:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])((function () {
        $$[$0].own = $$[$0-1].own;
        $$[$0].name = $$[$0-1][0];
        $$[$0].index = $$[$0-1][1];
        return $$[$0];
      }()));
break;
case 164:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0]);
break;
case 165:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])((function () {
        $$[$0].own = true;
        return $$[$0];
      }()));
break;
case 171:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([$$[$0-2], $$[$0]]);
break;
case 172:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
          source: $$[$0]
        });
break;
case 173:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])({
          source: $$[$0],
          object: true
        });
break;
case 174:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
          source: $$[$0-2],
          guard: $$[$0]
        });
break;
case 175:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
          source: $$[$0-2],
          guard: $$[$0],
          object: true
        });
break;
case 176:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])({
          source: $$[$0-2],
          step: $$[$0]
        });
break;
case 177:
this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])({
          source: $$[$0-4],
          guard: $$[$0-2],
          step: $$[$0]
        });
break;
case 178:
this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])({
          source: $$[$0-4],
          step: $$[$0-2],
          guard: $$[$0]
        });
break;
case 179:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Switch($$[$0-3], $$[$0-1]));
break;
case 180:
this.$ = yy.addLocationDataFn(_$[$0-6], _$[$0])(new yy.Switch($$[$0-5], $$[$0-3], $$[$0-1]));
break;
case 181:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Switch(null, $$[$0-1]));
break;
case 182:
this.$ = yy.addLocationDataFn(_$[$0-5], _$[$0])(new yy.Switch(null, $$[$0-3], $$[$0-1]));
break;
case 184:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])($$[$0-1].concat($$[$0]));
break;
case 185:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])([[$$[$0-1], $$[$0]]]);
break;
case 186:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])([[$$[$0-2], $$[$0-1]]]);
break;
case 187:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        }));
break;
case 188:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])($$[$0-4].addElse(yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        }))));
break;
case 190:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])($$[$0-2].addElse($$[$0]));
break;
case 191: case 192:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.If($$[$0], yy.addLocationDataFn(_$[$0-2])(yy.Block.wrap([$$[$0-2]])), {
          type: $$[$0-1],
          statement: true
        }));
break;
case 193: case 194: case 197: case 198:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op($$[$0-1], $$[$0]));
break;
case 195:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('-', $$[$0]));
break;
case 196:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('+', $$[$0]));
break;
case 199:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-2].concat($$[$0-1]), $$[$0]));
break;
case 200:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('--', $$[$0]));
break;
case 201:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('++', $$[$0]));
break;
case 202:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('--', $$[$0-1], null, true));
break;
case 203:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Op('++', $$[$0-1], null, true));
break;
case 204:
this.$ = yy.addLocationDataFn(_$[$0-1], _$[$0])(new yy.Existence($$[$0-1]));
break;
case 205:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op('+', $$[$0-2], $$[$0]));
break;
case 206:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op('-', $$[$0-2], $$[$0]));
break;
case 207: case 208: case 209: case 210: case 211:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Op($$[$0-1], $$[$0-2], $$[$0]));
break;
case 212:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])((function () {
        if ($$[$0-1].charAt(0) === '!') {
          return new yy.Op($$[$0-1].slice(1), $$[$0-2], $$[$0]).invert();
        } else {
          return new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
        }
      }()));
break;
case 213:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Assign($$[$0-2], $$[$0], $$[$0-1]));
break;
case 214:
this.$ = yy.addLocationDataFn(_$[$0-4], _$[$0])(new yy.Assign($$[$0-4], $$[$0-1], $$[$0-3]));
break;
case 215:
this.$ = yy.addLocationDataFn(_$[$0-3], _$[$0])(new yy.Assign($$[$0-3], $$[$0], $$[$0-2]));
break;
case 216:
this.$ = yy.addLocationDataFn(_$[$0-2], _$[$0])(new yy.Extends($$[$0-2], $$[$0]));
break;
}
},
table: [{1:[2,1],3:1,4:2,5:3,7:4,8:5,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{1:[3]},{1:[2,2],6:$VD},o($VE,[2,3]),o($VE,[2,6],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($VE,[2,7],{118:69,109:92,115:93,110:$Vq,112:$Vr,116:$Vt,132:$VP}),o($VQ,[2,11],{87:94,68:95,76:101,72:$VR,73:$VS,74:$VT,75:$VU,77:$VV,80:$VW,90:$VX,91:$VY}),o($VQ,[2,12],{76:101,87:104,68:105,72:$VR,73:$VS,74:$VT,75:$VU,77:$VV,80:$VW,90:$VX,91:$VY}),o($VQ,[2,13]),o($VQ,[2,14]),o($VQ,[2,15]),o($VQ,[2,16]),o($VQ,[2,17]),o($VQ,[2,18]),o($VQ,[2,19]),o($VQ,[2,20]),o($VQ,[2,21]),o($VQ,[2,22]),o($VQ,[2,8]),o($VQ,[2,9]),o($VQ,[2,10]),o($VZ,$V_,{46:[1,106]}),o($VZ,[2,80]),o($VZ,[2,81]),o($VZ,[2,82]),o($VZ,[2,83]),o([1,6,25,26,34,38,55,60,63,72,73,74,75,77,79,80,84,90,92,97,99,108,110,111,112,116,117,132,135,136,141,142,143,144,145,146,147],[2,110],{88:107,91:$V$}),o([6,25,55,60],$V01,{54:109,61:110,62:111,27:113,50:114,64:115,65:116,28:$V1,63:$V11,82:$Vh,95:$V21,96:$V31}),{24:119,25:$V41},{7:121,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:123,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:124,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:125,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:127,8:126,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,138:[1,128],139:$VB,140:$VC},{12:130,13:131,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:132,50:63,64:47,65:48,67:129,69:23,70:24,71:25,82:$Vh,89:$Vj,94:$Vk,95:$Vl,96:$Vm,107:$Vp},{12:130,13:131,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:132,50:63,64:47,65:48,67:133,69:23,70:24,71:25,82:$Vh,89:$Vj,94:$Vk,95:$Vl,96:$Vm,107:$Vp},o($V51,$V61,{86:[1,137],139:[1,134],140:[1,135],148:[1,136]}),o($VQ,[2,189],{127:[1,138]}),{24:139,25:$V41},{24:140,25:$V41},o($VQ,[2,155]),{24:141,25:$V41},{7:142,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,143],27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($V71,[2,100],{39:22,69:23,70:24,71:25,64:47,65:48,29:49,35:51,27:62,50:63,31:72,12:130,13:131,45:132,24:144,67:146,25:$V41,28:$V1,30:$V2,32:$V3,33:$V4,36:$V5,37:$V6,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,82:$Vh,86:[1,145],89:$Vj,94:$Vk,95:$Vl,96:$Vm,107:$Vp}),{7:147,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,141,142,143,144,145,146,147],[2,50],{12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,9:18,10:19,45:21,39:22,69:23,70:24,71:25,56:28,67:36,130:37,109:39,113:40,115:41,64:47,65:48,29:49,35:51,27:62,50:63,118:69,31:72,8:122,7:148,11:$V0,28:$V1,30:$V2,32:$V3,33:$V4,36:$V5,37:$V6,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,51:$Vc,52:$Vd,53:$Ve,57:$Vf,58:$Vg,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,114:$Vs,125:$Vu,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC}),o($VQ,[2,51]),o($V51,[2,77]),o($V51,[2,78]),o($VZ,[2,32]),o($VZ,[2,33]),o($VZ,[2,34]),o($VZ,[2,35]),o($VZ,[2,36]),o($VZ,[2,37]),o($VZ,[2,38]),{4:149,5:3,7:4,8:5,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,150],27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:151,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:$V81,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,63:$V91,64:47,65:48,66:156,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,93:153,94:$Vk,95:$Vl,96:$Vm,97:$Va1,100:154,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VZ,[2,116]),o($VZ,[2,117],{27:158,28:$V1}),{25:[2,54]},{25:[2,55]},o($Vb1,[2,72]),o($Vb1,[2,75]),{7:159,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:160,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:161,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:163,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:162,25:$V41,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{27:168,28:$V1,50:169,64:170,65:171,70:164,82:$Vh,95:$V21,96:$Vm,120:165,121:[1,166],122:167},{119:172,123:[1,173],124:[1,174]},o([6,25,60,84],$Vc1,{31:72,83:175,47:176,48:177,10:178,27:179,29:180,50:181,28:$V1,30:$V2,32:$V3,33:$V4,52:$Vd,95:$V21}),o($Vd1,[2,26]),o($Vd1,[2,27]),o($VZ,[2,30]),{12:130,13:182,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:132,50:63,64:47,65:48,67:183,69:23,70:24,71:25,82:$Vh,89:$Vj,94:$Vk,95:$Vl,96:$Vm,107:$Vp},o($Ve1,[2,25]),o($Vd1,[2,28]),{4:184,5:3,7:4,8:5,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VE,[2,5],{7:4,8:5,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,9:18,10:19,45:21,39:22,69:23,70:24,71:25,56:28,67:36,130:37,109:39,113:40,115:41,64:47,65:48,29:49,35:51,27:62,50:63,118:69,31:72,5:185,11:$V0,28:$V1,30:$V2,32:$V3,33:$V4,36:$V5,37:$V6,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,51:$Vc,52:$Vd,53:$Ve,57:$Vf,58:$Vg,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,110:$Vq,112:$Vr,114:$Vs,116:$Vt,125:$Vu,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC}),o($VQ,[2,204]),{7:186,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:187,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:188,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:189,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:190,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:191,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:192,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:193,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:194,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VQ,[2,154]),o($VQ,[2,159]),{7:195,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VQ,[2,153]),o($VQ,[2,158]),{88:196,91:$V$},o($Vb1,[2,73]),{91:[2,113]},{27:197,28:$V1},{27:198,28:$V1},o($Vb1,[2,88],{27:199,28:$V1}),{27:200,28:$V1},o($Vb1,[2,89]),{7:202,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,63:$Vf1,64:47,65:48,67:36,69:23,70:24,71:25,78:201,81:203,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,98:204,99:$Vg1,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{76:207,77:$VV,80:$VW},{88:208,91:$V$},o($Vb1,[2,74]),{6:[1,210],7:209,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,211],27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($Vh1,[2,111]),{7:214,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:$V81,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,63:$V91,64:47,65:48,66:156,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,92:[1,212],93:213,94:$Vk,95:$Vl,96:$Vm,100:154,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o([6,25],$Vi1,{59:217,55:[1,215],60:$Vj1}),o($Vk1,[2,59]),o($Vk1,[2,63],{46:[1,219],63:[1,218]}),o($Vk1,[2,66]),o($Vl1,[2,67]),o($Vl1,[2,68]),o($Vl1,[2,69]),o($Vl1,[2,70]),{27:158,28:$V1},{7:214,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:$V81,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,63:$V91,64:47,65:48,66:156,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,93:153,94:$Vk,95:$Vl,96:$Vm,97:$Va1,100:154,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VQ,[2,53]),{4:221,5:3,7:4,8:5,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,26:[1,220],27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,135,136,142,143,144,145,146,147],[2,193],{118:69,109:89,115:90,141:$VI}),{109:92,110:$Vq,112:$Vr,115:93,116:$Vt,118:69,132:$VP},o($Vm1,[2,194],{118:69,109:89,115:90,141:$VI,143:$VK}),o($Vm1,[2,195],{118:69,109:89,115:90,141:$VI,143:$VK}),o($Vm1,[2,196],{118:69,109:89,115:90,141:$VI,143:$VK}),o($VQ,[2,197],{118:69,109:92,115:93}),o($Vn1,[2,198],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{7:222,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VQ,[2,200],{72:$V61,73:$V61,74:$V61,75:$V61,77:$V61,80:$V61,90:$V61,91:$V61}),{68:95,72:$VR,73:$VS,74:$VT,75:$VU,76:101,77:$VV,80:$VW,87:94,90:$VX,91:$VY},{68:105,72:$VR,73:$VS,74:$VT,75:$VU,76:101,77:$VV,80:$VW,87:104,90:$VX,91:$VY},o($Vo1,$V_),o($VQ,[2,201],{72:$V61,73:$V61,74:$V61,75:$V61,77:$V61,80:$V61,90:$V61,91:$V61}),o($VQ,[2,202]),o($VQ,[2,203]),{6:[1,225],7:223,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,224],27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:226,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{24:227,25:$V41,131:[1,228]},o($VQ,[2,138],{103:229,104:[1,230],105:[1,231]}),o($VQ,[2,152]),o($VQ,[2,160]),{25:[1,232],109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},{126:233,128:234,129:$Vp1},o($VQ,[2,101]),{7:236,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($V71,[2,104],{24:237,25:$V41,72:$V61,73:$V61,74:$V61,75:$V61,77:$V61,80:$V61,90:$V61,91:$V61,86:[1,238]}),o($Vn1,[2,145],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vn1,[2,49],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{6:$VD,108:[1,239]},{4:240,5:3,7:4,8:5,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o([6,25,60,97],$Vq1,{118:69,109:89,115:90,98:241,63:[1,242],99:$Vg1,110:$Vq,112:$Vr,116:$Vt,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vr1,[2,119]),o([6,25,97],$Vi1,{59:243,60:$Vs1}),o($Vt1,[2,128]),{7:214,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:$V81,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,63:$V91,64:47,65:48,66:156,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,93:245,94:$Vk,95:$Vl,96:$Vm,100:154,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($Vt1,[2,134]),o($Vt1,[2,135]),o($Ve1,[2,118]),{24:246,25:$V41,109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},o($Vu1,[2,148],{118:69,109:89,115:90,110:$Vq,111:[1,247],112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vu1,[2,150],{118:69,109:89,115:90,110:$Vq,111:[1,248],112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($VQ,[2,156]),o($Vv1,[2,157],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,132,135,136,141,142,143,144,145,146,147],[2,161],{117:[1,249]}),o($Vw1,[2,164]),{27:168,28:$V1,50:169,64:170,65:171,82:$Vh,95:$V21,96:$V31,120:250,122:167},o($Vw1,[2,170],{60:[1,251]}),o($Vx1,[2,166]),o($Vx1,[2,167]),o($Vx1,[2,168]),o($Vx1,[2,169]),o($VQ,[2,163]),{7:252,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:253,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o([6,25,84],$Vi1,{59:254,60:$Vy1}),o($Vz1,[2,96]),o($Vz1,[2,42],{49:[1,256]}),o($Vz1,[2,45]),o($VA1,[2,46]),o($VA1,[2,47]),o($VA1,[2,48]),{38:[1,257],68:105,72:$VR,73:$VS,74:$VT,75:$VU,76:101,77:$VV,80:$VW,87:104,90:$VX,91:$VY},o($Vo1,$V61),{6:$VD,34:[1,258]},o($VE,[2,4]),o($VB1,[2,205],{118:69,109:89,115:90,141:$VI,142:$VJ,143:$VK}),o($VB1,[2,206],{118:69,109:89,115:90,141:$VI,142:$VJ,143:$VK}),o($Vm1,[2,207],{118:69,109:89,115:90,141:$VI,143:$VK}),o($Vm1,[2,208],{118:69,109:89,115:90,141:$VI,143:$VK}),o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,144,145,146,147],[2,209],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK}),o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,145,146],[2,210],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,147:$VO}),o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,146],[2,211],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,147:$VO}),o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,117,132,145,146,147],[2,212],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL}),o($Vv1,[2,192],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vv1,[2,191],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vh1,[2,108]),o($Vb1,[2,84]),o($Vb1,[2,85]),o($Vb1,[2,86]),o($Vb1,[2,87]),{79:[1,259]},{63:$Vf1,79:[2,92],98:260,99:$Vg1,109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},{79:[2,93]},{7:261,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,79:[2,127],82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VC1,[2,121]),o($VC1,$VD1),o($Vb1,[2,91]),o($Vh1,[2,109]),o($Vn1,[2,39],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{7:262,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:263,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($Vh1,[2,114]),o([6,25,92],$Vi1,{59:264,60:$Vs1}),o($Vt1,$Vq1,{118:69,109:89,115:90,63:[1,265],110:$Vq,112:$Vr,116:$Vt,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{56:266,57:$Vf,58:$Vg},o($VE1,$VF1,{62:111,27:113,50:114,64:115,65:116,61:267,28:$V1,63:$V11,82:$Vh,95:$V21,96:$V31}),{6:$VG1,25:$VH1},o($Vk1,[2,64]),{7:270,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VI1,[2,23]),{6:$VD,26:[1,271]},o($Vn1,[2,199],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vn1,[2,213],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{7:272,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:273,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($Vn1,[2,216],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($VQ,[2,190]),{7:274,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VQ,[2,139],{104:[1,275]}),{24:276,25:$V41},{24:279,25:$V41,27:277,28:$V1,65:278,82:$Vh},{126:280,128:234,129:$Vp1},{26:[1,281],127:[1,282],128:283,129:$Vp1},o($VJ1,[2,183]),{7:285,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,101:284,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VK1,[2,102],{118:69,109:89,115:90,24:286,25:$V41,110:$Vq,112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($VQ,[2,105]),{7:287,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VZ,[2,146]),{6:$VD,26:[1,288]},{7:289,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o([11,28,30,32,33,36,37,40,41,42,43,44,51,52,53,57,58,82,85,89,94,95,96,102,106,107,110,112,114,116,125,131,133,134,135,136,137,139,140],$VD1,{6:$VL1,25:$VL1,60:$VL1,97:$VL1}),{6:$VM1,25:$VN1,97:[1,290]},o([6,25,26,92,97],$VF1,{12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,9:18,10:19,45:21,39:22,69:23,70:24,71:25,56:28,67:36,130:37,109:39,113:40,115:41,64:47,65:48,29:49,35:51,27:62,50:63,118:69,31:72,8:122,66:156,7:214,100:293,11:$V0,28:$V1,30:$V2,32:$V3,33:$V4,36:$V5,37:$V6,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,51:$Vc,52:$Vd,53:$Ve,57:$Vf,58:$Vg,63:$V91,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,110:$Vq,112:$Vr,114:$Vs,116:$Vt,125:$Vu,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC}),o($VE1,$Vi1,{59:294,60:$Vs1}),o($VO1,[2,187]),{7:295,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:296,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:297,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($Vw1,[2,165]),{27:168,28:$V1,50:169,64:170,65:171,82:$Vh,95:$V21,96:$V31,122:298},o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,112,116,132],[2,172],{118:69,109:89,115:90,111:[1,299],117:[1,300],135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($VP1,[2,173],{118:69,109:89,115:90,111:[1,301],135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{6:$VQ1,25:$VR1,84:[1,302]},o([6,25,26,84],$VF1,{31:72,48:177,10:178,27:179,29:180,50:181,47:305,28:$V1,30:$V2,32:$V3,33:$V4,52:$Vd,95:$V21}),{7:306,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:[1,307],27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VZ,[2,31]),o($Vd1,[2,29]),o($Vb1,[2,90]),{7:308,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,79:[2,125],82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{79:[2,126],109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},o($Vn1,[2,40],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{26:[1,309],109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},{6:$VM1,25:$VN1,92:[1,310]},o($Vt1,$VL1),{24:311,25:$V41},o($Vk1,[2,60]),{27:113,28:$V1,50:114,61:312,62:111,63:$V11,64:115,65:116,82:$Vh,95:$V21,96:$V31},o($VS1,$V01,{61:110,62:111,27:113,50:114,64:115,65:116,54:313,28:$V1,63:$V11,82:$Vh,95:$V21,96:$V31}),o($Vk1,[2,65],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($VI1,[2,24]),{26:[1,314],109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},o($Vn1,[2,215],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{24:315,25:$V41,109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},{24:316,25:$V41},o($VQ,[2,140]),{24:317,25:$V41},{24:318,25:$V41},o($VT1,[2,144]),{26:[1,319],127:[1,320],128:283,129:$Vp1},o($VQ,[2,181]),{24:321,25:$V41},o($VJ1,[2,184]),{24:322,25:$V41,60:[1,323]},o($VU1,[2,136],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($VQ,[2,103]),o($VK1,[2,106],{118:69,109:89,115:90,24:324,25:$V41,110:$Vq,112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{108:[1,325]},{97:[1,326],109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},o($Vr1,[2,120]),{7:214,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,63:$V91,64:47,65:48,66:156,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,100:327,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:214,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,25:$V81,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,63:$V91,64:47,65:48,66:156,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,93:328,94:$Vk,95:$Vl,96:$Vm,100:154,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($Vt1,[2,129]),{6:$VM1,25:$VN1,26:[1,329]},o($Vv1,[2,149],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vv1,[2,151],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vv1,[2,162],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vw1,[2,171]),{7:330,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:331,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:332,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($Vr1,[2,94]),{10:178,27:179,28:$V1,29:180,30:$V2,31:72,32:$V3,33:$V4,47:333,48:177,50:181,52:$Vd,95:$V21},o($VS1,$Vc1,{31:72,47:176,48:177,10:178,27:179,29:180,50:181,83:334,28:$V1,30:$V2,32:$V3,33:$V4,52:$Vd,95:$V21}),o($Vz1,[2,97]),o($Vz1,[2,43],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{7:335,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{79:[2,124],109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},o($VQ,[2,41]),o($Vh1,[2,115]),o($VQ,[2,52]),o($Vk1,[2,61]),o($VE1,$Vi1,{59:336,60:$Vj1}),o($VQ,[2,214]),o($VO1,[2,188]),o($VQ,[2,141]),o($VT1,[2,142]),o($VT1,[2,143]),o($VQ,[2,179]),{24:337,25:$V41},{26:[1,338]},o($VJ1,[2,185],{6:[1,339]}),{7:340,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},o($VQ,[2,107]),o($VZ,[2,147]),o($VZ,[2,123]),o($Vt1,[2,130]),o($VE1,$Vi1,{59:341,60:$Vs1}),o($Vt1,[2,131]),o([1,6,25,26,34,55,60,63,79,84,92,97,99,108,110,111,112,116,132],[2,174],{118:69,109:89,115:90,117:[1,342],135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($VP1,[2,176],{118:69,109:89,115:90,111:[1,343],135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vn1,[2,175],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vz1,[2,98]),o($VE1,$Vi1,{59:344,60:$Vy1}),{26:[1,345],109:89,110:$Vq,112:$Vr,115:90,116:$Vt,118:69,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO},{6:$VG1,25:$VH1,26:[1,346]},{26:[1,347]},o($VQ,[2,182]),o($VJ1,[2,186]),o($VU1,[2,137],{118:69,109:89,115:90,110:$Vq,112:$Vr,116:$Vt,132:$VF,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),{6:$VM1,25:$VN1,26:[1,348]},{7:349,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{7:350,8:122,9:18,10:19,11:$V0,12:6,13:7,14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,27:62,28:$V1,29:49,30:$V2,31:72,32:$V3,33:$V4,35:51,36:$V5,37:$V6,39:22,40:$V7,41:$V8,42:$V9,43:$Va,44:$Vb,45:21,50:63,51:$Vc,52:$Vd,53:$Ve,56:28,57:$Vf,58:$Vg,64:47,65:48,67:36,69:23,70:24,71:25,82:$Vh,85:$Vi,89:$Vj,94:$Vk,95:$Vl,96:$Vm,102:$Vn,106:$Vo,107:$Vp,109:39,110:$Vq,112:$Vr,113:40,114:$Vs,115:41,116:$Vt,118:69,125:$Vu,130:37,131:$Vv,133:$Vw,134:$Vx,135:$Vy,136:$Vz,137:$VA,139:$VB,140:$VC},{6:$VQ1,25:$VR1,26:[1,351]},o($Vz1,[2,44]),o($Vk1,[2,62]),o($VQ,[2,180]),o($Vt1,[2,132]),o($Vn1,[2,177],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vn1,[2,178],{118:69,109:89,115:90,135:$VG,136:$VH,141:$VI,142:$VJ,143:$VK,144:$VL,145:$VM,146:$VN,147:$VO}),o($Vz1,[2,99])],
defaultActions: {60:[2,54],61:[2,55],96:[2,113],203:[2,93]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
}).call(this,require('_process'))
},{"_process":12,"fs":2,"path":11}],47:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var CoffeeScript, Module, binary, child_process, ext, findExtension, fork, helpers, i, len, loadFile, path, ref;

  CoffeeScript = require('./coffee-script');

  child_process = require('child_process');

  helpers = require('./helpers');

  path = require('path');

  loadFile = function(module, filename) {
    var answer;
    answer = CoffeeScript._compileFile(filename, false);
    return module._compile(answer, filename);
  };

  if (require.extensions) {
    ref = CoffeeScript.FILE_EXTENSIONS;
    for (i = 0, len = ref.length; i < len; i++) {
      ext = ref[i];
      require.extensions[ext] = loadFile;
    }
    Module = require('module');
    findExtension = function(filename) {
      var curExtension, extensions;
      extensions = path.basename(filename).split('.');
      if (extensions[0] === '') {
        extensions.shift();
      }
      while (extensions.shift()) {
        curExtension = '.' + extensions.join('.');
        if (Module._extensions[curExtension]) {
          return curExtension;
        }
      }
      return '.js';
    };
    Module.prototype.load = function(filename) {
      var extension;
      this.filename = filename;
      this.paths = Module._nodeModulePaths(path.dirname(filename));
      extension = findExtension(filename);
      Module._extensions[extension](this, filename);
      return this.loaded = true;
    };
  }

  if (child_process) {
    fork = child_process.fork;
    binary = require.resolve('../../bin/coffee');
    child_process.fork = function(path, args, options) {
      if (helpers.isCoffee(path)) {
        if (!Array.isArray(args)) {
          options = args || {};
          args = [];
        }
        args = [path].concat(args);
        path = binary;
      }
      return fork(path, args, options);
    };
  }

}).call(this);

},{"./coffee-script":42,"./helpers":43,"child_process":2,"module":2,"path":11}],48:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var BALANCED_PAIRS, CALL_CLOSERS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINEBREAKS, SINGLE_CLOSERS, SINGLE_LINERS, generate, k, left, len, ref, rite,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  generate = function(tag, value, origin) {
    var tok;
    tok = [tag, value];
    tok.generated = true;
    if (origin) {
      tok.origin = origin;
    }
    return tok;
  };

  exports.Rewriter = (function() {
    function Rewriter() {}

    Rewriter.prototype.rewrite = function(tokens1) {
      this.tokens = tokens1;
      this.removeLeadingNewlines();
      this.closeOpenCalls();
      this.closeOpenIndexes();
      this.normalizeLines();
      this.tagPostfixConditionals();
      this.addImplicitBracesAndParens();
      this.addLocationDataToGeneratedTokens();
      return this.tokens;
    };

    Rewriter.prototype.scanTokens = function(block) {
      var i, token, tokens;
      tokens = this.tokens;
      i = 0;
      while (token = tokens[i]) {
        i += block.call(this, token, i, tokens);
      }
      return true;
    };

    Rewriter.prototype.detectEnd = function(i, condition, action) {
      var levels, ref, ref1, token, tokens;
      tokens = this.tokens;
      levels = 0;
      while (token = tokens[i]) {
        if (levels === 0 && condition.call(this, token, i)) {
          return action.call(this, token, i);
        }
        if (!token || levels < 0) {
          return action.call(this, token, i - 1);
        }
        if (ref = token[0], indexOf.call(EXPRESSION_START, ref) >= 0) {
          levels += 1;
        } else if (ref1 = token[0], indexOf.call(EXPRESSION_END, ref1) >= 0) {
          levels -= 1;
        }
        i += 1;
      }
      return i - 1;
    };

    Rewriter.prototype.removeLeadingNewlines = function() {
      var i, k, len, ref, tag;
      ref = this.tokens;
      for (i = k = 0, len = ref.length; k < len; i = ++k) {
        tag = ref[i][0];
        if (tag !== 'TERMINATOR') {
          break;
        }
      }
      if (i) {
        return this.tokens.splice(0, i);
      }
    };

    Rewriter.prototype.closeOpenCalls = function() {
      var action, condition;
      condition = function(token, i) {
        var ref;
        return ((ref = token[0]) === ')' || ref === 'CALL_END') || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
      };
      action = function(token, i) {
        return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'CALL_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };

    Rewriter.prototype.closeOpenIndexes = function() {
      var action, condition;
      condition = function(token, i) {
        var ref;
        return (ref = token[0]) === ']' || ref === 'INDEX_END';
      };
      action = function(token, i) {
        return token[0] = 'INDEX_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'INDEX_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };

    Rewriter.prototype.indexOfTag = function() {
      var fuzz, i, j, k, pattern, ref, ref1;
      i = arguments[0], pattern = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      fuzz = 0;
      for (j = k = 0, ref = pattern.length; 0 <= ref ? k < ref : k > ref; j = 0 <= ref ? ++k : --k) {
        while (this.tag(i + j + fuzz) === 'HERECOMMENT') {
          fuzz += 2;
        }
        if (pattern[j] == null) {
          continue;
        }
        if (typeof pattern[j] === 'string') {
          pattern[j] = [pattern[j]];
        }
        if (ref1 = this.tag(i + j + fuzz), indexOf.call(pattern[j], ref1) < 0) {
          return -1;
        }
      }
      return i + j + fuzz - 1;
    };

    Rewriter.prototype.looksObjectish = function(j) {
      var end, index;
      if (this.indexOfTag(j, '@', null, ':') > -1 || this.indexOfTag(j, null, ':') > -1) {
        return true;
      }
      index = this.indexOfTag(j, EXPRESSION_START);
      if (index > -1) {
        end = null;
        this.detectEnd(index + 1, (function(token) {
          var ref;
          return ref = token[0], indexOf.call(EXPRESSION_END, ref) >= 0;
        }), (function(token, i) {
          return end = i;
        }));
        if (this.tag(end + 1) === ':') {
          return true;
        }
      }
      return false;
    };

    Rewriter.prototype.findTagsBackwards = function(i, tags) {
      var backStack, ref, ref1, ref2, ref3, ref4, ref5;
      backStack = [];
      while (i >= 0 && (backStack.length || (ref2 = this.tag(i), indexOf.call(tags, ref2) < 0) && ((ref3 = this.tag(i), indexOf.call(EXPRESSION_START, ref3) < 0) || this.tokens[i].generated) && (ref4 = this.tag(i), indexOf.call(LINEBREAKS, ref4) < 0))) {
        if (ref = this.tag(i), indexOf.call(EXPRESSION_END, ref) >= 0) {
          backStack.push(this.tag(i));
        }
        if ((ref1 = this.tag(i), indexOf.call(EXPRESSION_START, ref1) >= 0) && backStack.length) {
          backStack.pop();
        }
        i -= 1;
      }
      return ref5 = this.tag(i), indexOf.call(tags, ref5) >= 0;
    };

    Rewriter.prototype.addImplicitBracesAndParens = function() {
      var stack, start;
      stack = [];
      start = null;
      return this.scanTokens(function(token, i, tokens) {
        var endImplicitCall, endImplicitObject, forward, inImplicit, inImplicitCall, inImplicitControl, inImplicitObject, newLine, nextTag, offset, prevTag, prevToken, ref, ref1, ref2, ref3, ref4, ref5, s, sameLine, stackIdx, stackTag, stackTop, startIdx, startImplicitCall, startImplicitObject, startsLine, tag;
        tag = token[0];
        prevTag = (prevToken = i > 0 ? tokens[i - 1] : [])[0];
        nextTag = (i < tokens.length - 1 ? tokens[i + 1] : [])[0];
        stackTop = function() {
          return stack[stack.length - 1];
        };
        startIdx = i;
        forward = function(n) {
          return i - startIdx + n;
        };
        inImplicit = function() {
          var ref, ref1;
          return (ref = stackTop()) != null ? (ref1 = ref[2]) != null ? ref1.ours : void 0 : void 0;
        };
        inImplicitCall = function() {
          var ref;
          return inImplicit() && ((ref = stackTop()) != null ? ref[0] : void 0) === '(';
        };
        inImplicitObject = function() {
          var ref;
          return inImplicit() && ((ref = stackTop()) != null ? ref[0] : void 0) === '{';
        };
        inImplicitControl = function() {
          var ref;
          return inImplicit && ((ref = stackTop()) != null ? ref[0] : void 0) === 'CONTROL';
        };
        startImplicitCall = function(j) {
          var idx;
          idx = j != null ? j : i;
          stack.push([
            '(', idx, {
              ours: true
            }
          ]);
          tokens.splice(idx, 0, generate('CALL_START', '('));
          if (j == null) {
            return i += 1;
          }
        };
        endImplicitCall = function() {
          stack.pop();
          tokens.splice(i, 0, generate('CALL_END', ')', ['', 'end of input', token[2]]));
          return i += 1;
        };
        startImplicitObject = function(j, startsLine) {
          var idx, val;
          if (startsLine == null) {
            startsLine = true;
          }
          idx = j != null ? j : i;
          stack.push([
            '{', idx, {
              sameLine: true,
              startsLine: startsLine,
              ours: true
            }
          ]);
          val = new String('{');
          val.generated = true;
          tokens.splice(idx, 0, generate('{', val, token));
          if (j == null) {
            return i += 1;
          }
        };
        endImplicitObject = function(j) {
          j = j != null ? j : i;
          stack.pop();
          tokens.splice(j, 0, generate('}', '}', token));
          return i += 1;
        };
        if (inImplicitCall() && (tag === 'IF' || tag === 'TRY' || tag === 'FINALLY' || tag === 'CATCH' || tag === 'CLASS' || tag === 'SWITCH')) {
          stack.push([
            'CONTROL', i, {
              ours: true
            }
          ]);
          return forward(1);
        }
        if (tag === 'INDENT' && inImplicit()) {
          if (prevTag !== '=>' && prevTag !== '->' && prevTag !== '[' && prevTag !== '(' && prevTag !== ',' && prevTag !== '{' && prevTag !== 'TRY' && prevTag !== 'ELSE' && prevTag !== '=') {
            while (inImplicitCall()) {
              endImplicitCall();
            }
          }
          if (inImplicitControl()) {
            stack.pop();
          }
          stack.push([tag, i]);
          return forward(1);
        }
        if (indexOf.call(EXPRESSION_START, tag) >= 0) {
          stack.push([tag, i]);
          return forward(1);
        }
        if (indexOf.call(EXPRESSION_END, tag) >= 0) {
          while (inImplicit()) {
            if (inImplicitCall()) {
              endImplicitCall();
            } else if (inImplicitObject()) {
              endImplicitObject();
            } else {
              stack.pop();
            }
          }
          start = stack.pop();
        }
        if ((indexOf.call(IMPLICIT_FUNC, tag) >= 0 && token.spaced || tag === '?' && i > 0 && !tokens[i - 1].spaced) && (indexOf.call(IMPLICIT_CALL, nextTag) >= 0 || indexOf.call(IMPLICIT_UNSPACED_CALL, nextTag) >= 0 && !((ref = tokens[i + 1]) != null ? ref.spaced : void 0) && !((ref1 = tokens[i + 1]) != null ? ref1.newLine : void 0))) {
          if (tag === '?') {
            tag = token[0] = 'FUNC_EXIST';
          }
          startImplicitCall(i + 1);
          return forward(2);
        }
        if (indexOf.call(IMPLICIT_FUNC, tag) >= 0 && this.indexOfTag(i + 1, 'INDENT') > -1 && this.looksObjectish(i + 2) && !this.findTagsBackwards(i, ['CLASS', 'EXTENDS', 'IF', 'CATCH', 'SWITCH', 'LEADING_WHEN', 'FOR', 'WHILE', 'UNTIL'])) {
          startImplicitCall(i + 1);
          stack.push(['INDENT', i + 2]);
          return forward(3);
        }
        if (tag === ':') {
          s = (function() {
            var ref2;
            switch (false) {
              case ref2 = this.tag(i - 1), indexOf.call(EXPRESSION_END, ref2) < 0:
                return start[1];
              case this.tag(i - 2) !== '@':
                return i - 2;
              default:
                return i - 1;
            }
          }).call(this);
          while (this.tag(s - 2) === 'HERECOMMENT') {
            s -= 2;
          }
          this.insideForDeclaration = nextTag === 'FOR';
          startsLine = s === 0 || (ref2 = this.tag(s - 1), indexOf.call(LINEBREAKS, ref2) >= 0) || tokens[s - 1].newLine;
          if (stackTop()) {
            ref3 = stackTop(), stackTag = ref3[0], stackIdx = ref3[1];
            if ((stackTag === '{' || stackTag === 'INDENT' && this.tag(stackIdx - 1) === '{') && (startsLine || this.tag(s - 1) === ',' || this.tag(s - 1) === '{')) {
              return forward(1);
            }
          }
          startImplicitObject(s, !!startsLine);
          return forward(2);
        }
        if (inImplicitObject() && indexOf.call(LINEBREAKS, tag) >= 0) {
          stackTop()[2].sameLine = false;
        }
        newLine = prevTag === 'OUTDENT' || prevToken.newLine;
        if (indexOf.call(IMPLICIT_END, tag) >= 0 || indexOf.call(CALL_CLOSERS, tag) >= 0 && newLine) {
          while (inImplicit()) {
            ref4 = stackTop(), stackTag = ref4[0], stackIdx = ref4[1], (ref5 = ref4[2], sameLine = ref5.sameLine, startsLine = ref5.startsLine);
            if (inImplicitCall() && prevTag !== ',') {
              endImplicitCall();
            } else if (inImplicitObject() && !this.insideForDeclaration && sameLine && tag !== 'TERMINATOR' && prevTag !== ':') {
              endImplicitObject();
            } else if (inImplicitObject() && tag === 'TERMINATOR' && prevTag !== ',' && !(startsLine && this.looksObjectish(i + 1))) {
              if (nextTag === 'HERECOMMENT') {
                return forward(1);
              }
              endImplicitObject();
            } else {
              break;
            }
          }
        }
        if (tag === ',' && !this.looksObjectish(i + 1) && inImplicitObject() && !this.insideForDeclaration && (nextTag !== 'TERMINATOR' || !this.looksObjectish(i + 2))) {
          offset = nextTag === 'OUTDENT' ? 1 : 0;
          while (inImplicitObject()) {
            endImplicitObject(i + offset);
          }
        }
        return forward(1);
      });
    };

    Rewriter.prototype.addLocationDataToGeneratedTokens = function() {
      return this.scanTokens(function(token, i, tokens) {
        var column, line, nextLocation, prevLocation, ref, ref1;
        if (token[2]) {
          return 1;
        }
        if (!(token.generated || token.explicit)) {
          return 1;
        }
        if (token[0] === '{' && (nextLocation = (ref = tokens[i + 1]) != null ? ref[2] : void 0)) {
          line = nextLocation.first_line, column = nextLocation.first_column;
        } else if (prevLocation = (ref1 = tokens[i - 1]) != null ? ref1[2] : void 0) {
          line = prevLocation.last_line, column = prevLocation.last_column;
        } else {
          line = column = 0;
        }
        token[2] = {
          first_line: line,
          first_column: column,
          last_line: line,
          last_column: column
        };
        return 1;
      });
    };

    Rewriter.prototype.normalizeLines = function() {
      var action, condition, indent, outdent, starter;
      starter = indent = outdent = null;
      condition = function(token, i) {
        var ref, ref1, ref2, ref3;
        return token[1] !== ';' && (ref = token[0], indexOf.call(SINGLE_CLOSERS, ref) >= 0) && !(token[0] === 'TERMINATOR' && (ref1 = this.tag(i + 1), indexOf.call(EXPRESSION_CLOSE, ref1) >= 0)) && !(token[0] === 'ELSE' && starter !== 'THEN') && !(((ref2 = token[0]) === 'CATCH' || ref2 === 'FINALLY') && (starter === '->' || starter === '=>')) || (ref3 = token[0], indexOf.call(CALL_CLOSERS, ref3) >= 0) && this.tokens[i - 1].newLine;
      };
      action = function(token, i) {
        return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
      };
      return this.scanTokens(function(token, i, tokens) {
        var j, k, ref, ref1, ref2, tag;
        tag = token[0];
        if (tag === 'TERMINATOR') {
          if (this.tag(i + 1) === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
            tokens.splice.apply(tokens, [i, 1].concat(slice.call(this.indentation())));
            return 1;
          }
          if (ref = this.tag(i + 1), indexOf.call(EXPRESSION_CLOSE, ref) >= 0) {
            tokens.splice(i, 1);
            return 0;
          }
        }
        if (tag === 'CATCH') {
          for (j = k = 1; k <= 2; j = ++k) {
            if (!((ref1 = this.tag(i + j)) === 'OUTDENT' || ref1 === 'TERMINATOR' || ref1 === 'FINALLY')) {
              continue;
            }
            tokens.splice.apply(tokens, [i + j, 0].concat(slice.call(this.indentation())));
            return 2 + j;
          }
        }
        if (indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
          starter = tag;
          ref2 = this.indentation(tokens[i]), indent = ref2[0], outdent = ref2[1];
          if (starter === 'THEN') {
            indent.fromThen = true;
          }
          tokens.splice(i + 1, 0, indent);
          this.detectEnd(i + 2, condition, action);
          if (tag === 'THEN') {
            tokens.splice(i, 1);
          }
          return 1;
        }
        return 1;
      });
    };

    Rewriter.prototype.tagPostfixConditionals = function() {
      var action, condition, original;
      original = null;
      condition = function(token, i) {
        var prevTag, tag;
        tag = token[0];
        prevTag = this.tokens[i - 1][0];
        return tag === 'TERMINATOR' || (tag === 'INDENT' && indexOf.call(SINGLE_LINERS, prevTag) < 0);
      };
      action = function(token, i) {
        if (token[0] !== 'INDENT' || (token.generated && !token.fromThen)) {
          return original[0] = 'POST_' + original[0];
        }
      };
      return this.scanTokens(function(token, i) {
        if (token[0] !== 'IF') {
          return 1;
        }
        original = token;
        this.detectEnd(i + 1, condition, action);
        return 1;
      });
    };

    Rewriter.prototype.indentation = function(origin) {
      var indent, outdent;
      indent = ['INDENT', 2];
      outdent = ['OUTDENT', 2];
      if (origin) {
        indent.generated = outdent.generated = true;
        indent.origin = outdent.origin = origin;
      } else {
        indent.explicit = outdent.explicit = true;
      }
      return [indent, outdent];
    };

    Rewriter.prototype.generate = generate;

    Rewriter.prototype.tag = function(i) {
      var ref;
      return (ref = this.tokens[i]) != null ? ref[0] : void 0;
    };

    return Rewriter;

  })();

  BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END'], ['STRING_START', 'STRING_END'], ['REGEX_START', 'REGEX_END']];

  exports.INVERSES = INVERSES = {};

  EXPRESSION_START = [];

  EXPRESSION_END = [];

  for (k = 0, len = BALANCED_PAIRS.length; k < len; k++) {
    ref = BALANCED_PAIRS[k], left = ref[0], rite = ref[1];
    EXPRESSION_START.push(INVERSES[rite] = left);
    EXPRESSION_END.push(INVERSES[left] = rite);
  }

  EXPRESSION_CLOSE = ['CATCH', 'THEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);

  IMPLICIT_FUNC = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];

  IMPLICIT_CALL = ['IDENTIFIER', 'NUMBER', 'STRING', 'STRING_START', 'JS', 'REGEX', 'REGEX_START', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'NULL', 'UNDEFINED', 'UNARY', 'YIELD', 'UNARY_MATH', 'SUPER', 'THROW', '@', '->', '=>', '[', '(', '{', '--', '++'];

  IMPLICIT_UNSPACED_CALL = ['+', '-'];

  IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];

  SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];

  SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];

  LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];

  CALL_CLOSERS = ['.', '?.', '::', '?::'];

}).call(this);

},{}],49:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var Scope,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exports.Scope = Scope = (function() {
    function Scope(parent, expressions, method, referencedVars) {
      var ref, ref1;
      this.parent = parent;
      this.expressions = expressions;
      this.method = method;
      this.referencedVars = referencedVars;
      this.variables = [
        {
          name: 'arguments',
          type: 'arguments'
        }
      ];
      this.positions = {};
      if (!this.parent) {
        this.utilities = {};
      }
      this.root = (ref = (ref1 = this.parent) != null ? ref1.root : void 0) != null ? ref : this;
    }

    Scope.prototype.add = function(name, type, immediate) {
      if (this.shared && !immediate) {
        return this.parent.add(name, type, immediate);
      }
      if (Object.prototype.hasOwnProperty.call(this.positions, name)) {
        return this.variables[this.positions[name]].type = type;
      } else {
        return this.positions[name] = this.variables.push({
          name: name,
          type: type
        }) - 1;
      }
    };

    Scope.prototype.namedMethod = function() {
      var ref;
      if (((ref = this.method) != null ? ref.name : void 0) || !this.parent) {
        return this.method;
      }
      return this.parent.namedMethod();
    };

    Scope.prototype.find = function(name) {
      if (this.check(name)) {
        return true;
      }
      this.add(name, 'var');
      return false;
    };

    Scope.prototype.parameter = function(name) {
      if (this.shared && this.parent.check(name, true)) {
        return;
      }
      return this.add(name, 'param');
    };

    Scope.prototype.check = function(name) {
      var ref;
      return !!(this.type(name) || ((ref = this.parent) != null ? ref.check(name) : void 0));
    };

    Scope.prototype.temporary = function(name, index, single) {
      if (single == null) {
        single = false;
      }
      if (single) {
        return (index + parseInt(name, 36)).toString(36).replace(/\d/g, 'a');
      } else {
        return name + (index || '');
      }
    };

    Scope.prototype.type = function(name) {
      var i, len, ref, v;
      ref = this.variables;
      for (i = 0, len = ref.length; i < len; i++) {
        v = ref[i];
        if (v.name === name) {
          return v.type;
        }
      }
      return null;
    };

    Scope.prototype.freeVariable = function(name, options) {
      var index, ref, temp;
      if (options == null) {
        options = {};
      }
      index = 0;
      while (true) {
        temp = this.temporary(name, index, options.single);
        if (!(this.check(temp) || indexOf.call(this.root.referencedVars, temp) >= 0)) {
          break;
        }
        index++;
      }
      if ((ref = options.reserve) != null ? ref : true) {
        this.add(temp, 'var', true);
      }
      return temp;
    };

    Scope.prototype.assign = function(name, value) {
      this.add(name, {
        value: value,
        assigned: true
      }, true);
      return this.hasAssignments = true;
    };

    Scope.prototype.hasDeclarations = function() {
      return !!this.declaredVariables().length;
    };

    Scope.prototype.declaredVariables = function() {
      var v;
      return ((function() {
        var i, len, ref, results;
        ref = this.variables;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          v = ref[i];
          if (v.type === 'var') {
            results.push(v.name);
          }
        }
        return results;
      }).call(this)).sort();
    };

    Scope.prototype.assignedVariables = function() {
      var i, len, ref, results, v;
      ref = this.variables;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        v = ref[i];
        if (v.type.assigned) {
          results.push(v.name + " = " + v.type.value);
        }
      }
      return results;
    };

    return Scope;

  })();

}).call(this);

},{}],50:[function(require,module,exports){
// Generated by CoffeeScript 1.9.3
(function() {
  var LineMap, SourceMap;

  LineMap = (function() {
    function LineMap(line1) {
      this.line = line1;
      this.columns = [];
    }

    LineMap.prototype.add = function(column, arg, options) {
      var sourceColumn, sourceLine;
      sourceLine = arg[0], sourceColumn = arg[1];
      if (options == null) {
        options = {};
      }
      if (this.columns[column] && options.noReplace) {
        return;
      }
      return this.columns[column] = {
        line: this.line,
        column: column,
        sourceLine: sourceLine,
        sourceColumn: sourceColumn
      };
    };

    LineMap.prototype.sourceLocation = function(column) {
      var mapping;
      while (!((mapping = this.columns[column]) || (column <= 0))) {
        column--;
      }
      return mapping && [mapping.sourceLine, mapping.sourceColumn];
    };

    return LineMap;

  })();

  SourceMap = (function() {
    var BASE64_CHARS, VLQ_CONTINUATION_BIT, VLQ_SHIFT, VLQ_VALUE_MASK;

    function SourceMap() {
      this.lines = [];
    }

    SourceMap.prototype.add = function(sourceLocation, generatedLocation, options) {
      var base, column, line, lineMap;
      if (options == null) {
        options = {};
      }
      line = generatedLocation[0], column = generatedLocation[1];
      lineMap = ((base = this.lines)[line] || (base[line] = new LineMap(line)));
      return lineMap.add(column, sourceLocation, options);
    };

    SourceMap.prototype.sourceLocation = function(arg) {
      var column, line, lineMap;
      line = arg[0], column = arg[1];
      while (!((lineMap = this.lines[line]) || (line <= 0))) {
        line--;
      }
      return lineMap && lineMap.sourceLocation(column);
    };

    SourceMap.prototype.generate = function(options, code) {
      var buffer, i, j, lastColumn, lastSourceColumn, lastSourceLine, len, len1, lineMap, lineNumber, mapping, needComma, ref, ref1, v3, writingline;
      if (options == null) {
        options = {};
      }
      if (code == null) {
        code = null;
      }
      writingline = 0;
      lastColumn = 0;
      lastSourceLine = 0;
      lastSourceColumn = 0;
      needComma = false;
      buffer = "";
      ref = this.lines;
      for (lineNumber = i = 0, len = ref.length; i < len; lineNumber = ++i) {
        lineMap = ref[lineNumber];
        if (lineMap) {
          ref1 = lineMap.columns;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            mapping = ref1[j];
            if (!(mapping)) {
              continue;
            }
            while (writingline < mapping.line) {
              lastColumn = 0;
              needComma = false;
              buffer += ";";
              writingline++;
            }
            if (needComma) {
              buffer += ",";
              needComma = false;
            }
            buffer += this.encodeVlq(mapping.column - lastColumn);
            lastColumn = mapping.column;
            buffer += this.encodeVlq(0);
            buffer += this.encodeVlq(mapping.sourceLine - lastSourceLine);
            lastSourceLine = mapping.sourceLine;
            buffer += this.encodeVlq(mapping.sourceColumn - lastSourceColumn);
            lastSourceColumn = mapping.sourceColumn;
            needComma = true;
          }
        }
      }
      v3 = {
        version: 3,
        file: options.generatedFile || '',
        sourceRoot: options.sourceRoot || '',
        sources: options.sourceFiles || [''],
        names: [],
        mappings: buffer
      };
      if (options.inline) {
        v3.sourcesContent = [code];
      }
      return JSON.stringify(v3, null, 2);
    };

    VLQ_SHIFT = 5;

    VLQ_CONTINUATION_BIT = 1 << VLQ_SHIFT;

    VLQ_VALUE_MASK = VLQ_CONTINUATION_BIT - 1;

    SourceMap.prototype.encodeVlq = function(value) {
      var answer, nextChunk, signBit, valueToEncode;
      answer = '';
      signBit = value < 0 ? 1 : 0;
      valueToEncode = (Math.abs(value) << 1) + signBit;
      while (valueToEncode || !answer) {
        nextChunk = valueToEncode & VLQ_VALUE_MASK;
        valueToEncode = valueToEncode >> VLQ_SHIFT;
        if (valueToEncode) {
          nextChunk |= VLQ_CONTINUATION_BIT;
        }
        answer += this.encodeBase64(nextChunk);
      }
      return answer;
    };

    BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    SourceMap.prototype.encodeBase64 = function(value) {
      return BASE64_CHARS[value] || (function() {
        throw new Error("Cannot Base64 encode value: " + value);
      })();
    };

    return SourceMap;

  })();

  module.exports = SourceMap;

}).call(this);

},{}],51:[function(require,module,exports){
(function (global,Buffer){
var vm = require('vm')
var isBuffer = Buffer.isBuffer

var requireLike = require('require-like')

function merge (a, b) {
	if (!a || !b) return a

	var keys = Object.keys(b)
  for (var k, i = 0, n = keys.length; i < n; i++) {
  	k = keys[i]
  	a[k] = b[k]
  }

  return a
}

// Return the exports/module.exports variable set in the content
// content (String|VmScript): required
module.exports = function (content, filename, scope, includeGlobals) {
	if (typeof filename !== 'string') {
        if (typeof filename === 'object') {
            includeGlobals = scope
            scope = filename
            filename = null
        }
        else if (typeof filename === 'boolean') {
            includeGlobals = filename
            scope = {}
            filename = null
        }
	}

	// Expose standard Node globals
  var sandbox = {}
  var exports = {}

  if (includeGlobals) {
    merge(sandbox, global)
    sandbox.require = requireLike(filename || module.parent.filename)
  }

  if (typeof scope === 'object')
  	merge(sandbox, scope)

  sandbox.exports = exports
  sandbox.module = { exports: exports }
  sandbox.global = sandbox

  if ( isBuffer(content) )
    content = content.toString()
  
  // Evalutate the content with the given scope
  if (typeof content === 'string')
    vm.createScript( content.replace(/^\#\!.*/, ''), filename)
      .runInNewContext(sandbox, filename)
  else
    content.runInNewContext(sandbox)

  return sandbox.module.exports
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"buffer":4,"require-like":52,"vm":20}],52:[function(require,module,exports){
(function (process){
var Module = require('module');
var dirname = require('path').dirname;

module.exports = function requireLike(path, uncached) {
  var parentModule = new Module(path);
  parentModule.filename = path;
  parentModule.paths = Module._nodeModulePaths(dirname(path));

  function requireLike(file) {
    var cache = Module._cache;
    if (uncached) {
      Module._cache = {};
    }

    var exports = Module._load(file, parentModule);
    Module._cache = cache;

    return exports;
  };


  requireLike.resolve = function(request) {
    var resolved = Module._resolveFilename(request, parentModule);
    // Module._resolveFilename returns a string since node v0.6.10,
    // it used to return an array prior to that
    return (resolved instanceof Array) ? resolved[1] : resolved;
  }

  try {
    requireLike.paths = require.paths;
  } catch (e) {
    //require.paths was deprecated in node v0.5.x
    //it now throws an exception when called
  }
  requireLike.main = process.mainModule;
  requireLike.extensions = require.extensions;
  requireLike.cache = require.cache;

  return requireLike;
};

}).call(this,require('_process'))
},{"_process":12,"module":2,"path":11}],53:[function(require,module,exports){
module.exports = (function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = [],
        peg$c1 = function() { return parser.getResult();  },
        peg$c2 = peg$FAILED,
        peg$c3 = "EXPORT=",
        peg$c4 = { type: "literal", value: "EXPORT=", description: "\"EXPORT=\"" },
        peg$c5 = /^[A-Za-z.0-9_]/,
        peg$c6 = { type: "class", value: "[A-Za-z.0-9_]", description: "[A-Za-z.0-9_]" },
        peg$c7 = ":",
        peg$c8 = { type: "literal", value: ":", description: "\":\"" },
        peg$c9 = /^[A-Z0-9_]/,
        peg$c10 = { type: "class", value: "[A-Z0-9_]", description: "[A-Z0-9_]" },
        peg$c11 = null,
        peg$c12 = function(priv, pub) {return parser.registerExports(priv.join(""),pub.join(""))},
        peg$c13 = "INPORT=",
        peg$c14 = { type: "literal", value: "INPORT=", description: "\"INPORT=\"" },
        peg$c15 = /^[A-Za-z0-9_]/,
        peg$c16 = { type: "class", value: "[A-Za-z0-9_]", description: "[A-Za-z0-9_]" },
        peg$c17 = ".",
        peg$c18 = { type: "literal", value: ".", description: "\".\"" },
        peg$c19 = function(node, port, pub) {return parser.registerInports(node.join(""),port.join(""),pub.join(""))},
        peg$c20 = "OUTPORT=",
        peg$c21 = { type: "literal", value: "OUTPORT=", description: "\"OUTPORT=\"" },
        peg$c22 = function(node, port, pub) {return parser.registerOutports(node.join(""),port.join(""),pub.join(""))},
        peg$c23 = /^[\n\r\u2028\u2029]/,
        peg$c24 = { type: "class", value: "[\\n\\r\\u2028\\u2029]", description: "[\\n\\r\\u2028\\u2029]" },
        peg$c25 = function(edges) {return parser.registerEdges(edges);},
        peg$c26 = ",",
        peg$c27 = { type: "literal", value: ",", description: "\",\"" },
        peg$c28 = "#",
        peg$c29 = { type: "literal", value: "#", description: "\"#\"" },
        peg$c30 = "->",
        peg$c31 = { type: "literal", value: "->", description: "\"->\"" },
        peg$c32 = function(x, y) { return [x,y]; },
        peg$c33 = function(x, proc, y) { return [{"tgt":{process:proc, port:x}},{"src":{process:proc, port:y}}]; },
        peg$c34 = function(proc, port) { return {"src":{process:proc, port:port}} },
        peg$c35 = function(proc, port) { return {"src":{process:proc, port:port.port, index: port.index}} },
        peg$c36 = "'",
        peg$c37 = { type: "literal", value: "'", description: "\"'\"" },
        peg$c38 = function(iip) { return {"data":iip.join("")} },
        peg$c39 = function(port, proc) { return {"tgt":{process:proc, port:port}} },
        peg$c40 = function(port, proc) { return {"tgt":{process:proc, port:port.port, index: port.index}} },
        peg$c41 = /^[a-zA-Z0-9_]/,
        peg$c42 = { type: "class", value: "[a-zA-Z0-9_]", description: "[a-zA-Z0-9_]" },
        peg$c43 = function(node, comp) { if(comp){parser.addNode(node.join(""),comp);}; return node.join("")},
        peg$c44 = "(",
        peg$c45 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c46 = /^[a-zA-Z\/\-0-9_]/,
        peg$c47 = { type: "class", value: "[a-zA-Z\\/\\-0-9_]", description: "[a-zA-Z\\/\\-0-9_]" },
        peg$c48 = ")",
        peg$c49 = { type: "literal", value: ")", description: "\")\"" },
        peg$c50 = function(comp, meta) { var o = {}; comp ? o.comp = comp.join("") : o.comp = ''; meta ? o.meta = meta.join("").split(',') : null; return o; },
        peg$c51 = /^[a-zA-Z\/=_,0-9]/,
        peg$c52 = { type: "class", value: "[a-zA-Z\\/=_,0-9]", description: "[a-zA-Z\\/=_,0-9]" },
        peg$c53 = function(meta) {return meta},
        peg$c54 = /^[A-Z.0-9_]/,
        peg$c55 = { type: "class", value: "[A-Z.0-9_]", description: "[A-Z.0-9_]" },
        peg$c56 = function(portname) {return portname.join("").toLowerCase()},
        peg$c57 = "[",
        peg$c58 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c59 = /^[0-9]/,
        peg$c60 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c61 = "]",
        peg$c62 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c63 = function(portname, portindex) {return { port: portname.join("").toLowerCase(), index: parseInt(portindex.join('')) }},
        peg$c64 = /^[^\n\r\u2028\u2029]/,
        peg$c65 = { type: "class", value: "[^\\n\\r\\u2028\\u2029]", description: "[^\\n\\r\\u2028\\u2029]" },
        peg$c66 = /^[\\]/,
        peg$c67 = { type: "class", value: "[\\\\]", description: "[\\\\]" },
        peg$c68 = /^[']/,
        peg$c69 = { type: "class", value: "[']", description: "[']" },
        peg$c70 = function() { return "'"; },
        peg$c71 = /^[^']/,
        peg$c72 = { type: "class", value: "[^']", description: "[^']" },
        peg$c73 = " ",
        peg$c74 = { type: "literal", value: " ", description: "\" \"" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseline();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parseline();
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c1();
      }
      s0 = s1;

      return s0;
    }

    function peg$parseline() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;

      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c3) {
          s2 = peg$c3;
          peg$currPos += 7;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c4); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          if (peg$c5.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c6); }
          }
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              if (peg$c5.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c6); }
              }
            }
          } else {
            s3 = peg$c2;
          }
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 58) {
              s4 = peg$c7;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c8); }
            }
            if (s4 !== peg$FAILED) {
              s5 = [];
              if (peg$c9.test(input.charAt(peg$currPos))) {
                s6 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c10); }
              }
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  if (peg$c9.test(input.charAt(peg$currPos))) {
                    s6 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c10); }
                  }
                }
              } else {
                s5 = peg$c2;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parse_();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseLineTerminator();
                  if (s7 === peg$FAILED) {
                    s7 = peg$c11;
                  }
                  if (s7 !== peg$FAILED) {
                    peg$reportedPos = s0;
                    s1 = peg$c12(s3, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (s1 !== peg$FAILED) {
          if (input.substr(peg$currPos, 7) === peg$c13) {
            s2 = peg$c13;
            peg$currPos += 7;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c14); }
          }
          if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$c15.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c16); }
            }
            if (s4 !== peg$FAILED) {
              while (s4 !== peg$FAILED) {
                s3.push(s4);
                if (peg$c15.test(input.charAt(peg$currPos))) {
                  s4 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c16); }
                }
              }
            } else {
              s3 = peg$c2;
            }
            if (s3 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 46) {
                s4 = peg$c17;
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c18); }
              }
              if (s4 !== peg$FAILED) {
                s5 = [];
                if (peg$c9.test(input.charAt(peg$currPos))) {
                  s6 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s6 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c10); }
                }
                if (s6 !== peg$FAILED) {
                  while (s6 !== peg$FAILED) {
                    s5.push(s6);
                    if (peg$c9.test(input.charAt(peg$currPos))) {
                      s6 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s6 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c10); }
                    }
                  }
                } else {
                  s5 = peg$c2;
                }
                if (s5 !== peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 58) {
                    s6 = peg$c7;
                    peg$currPos++;
                  } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c8); }
                  }
                  if (s6 !== peg$FAILED) {
                    s7 = [];
                    if (peg$c9.test(input.charAt(peg$currPos))) {
                      s8 = input.charAt(peg$currPos);
                      peg$currPos++;
                    } else {
                      s8 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c10); }
                    }
                    if (s8 !== peg$FAILED) {
                      while (s8 !== peg$FAILED) {
                        s7.push(s8);
                        if (peg$c9.test(input.charAt(peg$currPos))) {
                          s8 = input.charAt(peg$currPos);
                          peg$currPos++;
                        } else {
                          s8 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c10); }
                        }
                      }
                    } else {
                      s7 = peg$c2;
                    }
                    if (s7 !== peg$FAILED) {
                      s8 = peg$parse_();
                      if (s8 !== peg$FAILED) {
                        s9 = peg$parseLineTerminator();
                        if (s9 === peg$FAILED) {
                          s9 = peg$c11;
                        }
                        if (s9 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c19(s3, s5, s7);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c2;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c2;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c2;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parse_();
          if (s1 !== peg$FAILED) {
            if (input.substr(peg$currPos, 8) === peg$c20) {
              s2 = peg$c20;
              peg$currPos += 8;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c21); }
            }
            if (s2 !== peg$FAILED) {
              s3 = [];
              if (peg$c15.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c16); }
              }
              if (s4 !== peg$FAILED) {
                while (s4 !== peg$FAILED) {
                  s3.push(s4);
                  if (peg$c15.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c16); }
                  }
                }
              } else {
                s3 = peg$c2;
              }
              if (s3 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 46) {
                  s4 = peg$c17;
                  peg$currPos++;
                } else {
                  s4 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c18); }
                }
                if (s4 !== peg$FAILED) {
                  s5 = [];
                  if (peg$c9.test(input.charAt(peg$currPos))) {
                    s6 = input.charAt(peg$currPos);
                    peg$currPos++;
                  } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c10); }
                  }
                  if (s6 !== peg$FAILED) {
                    while (s6 !== peg$FAILED) {
                      s5.push(s6);
                      if (peg$c9.test(input.charAt(peg$currPos))) {
                        s6 = input.charAt(peg$currPos);
                        peg$currPos++;
                      } else {
                        s6 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c10); }
                      }
                    }
                  } else {
                    s5 = peg$c2;
                  }
                  if (s5 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 58) {
                      s6 = peg$c7;
                      peg$currPos++;
                    } else {
                      s6 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c8); }
                    }
                    if (s6 !== peg$FAILED) {
                      s7 = [];
                      if (peg$c9.test(input.charAt(peg$currPos))) {
                        s8 = input.charAt(peg$currPos);
                        peg$currPos++;
                      } else {
                        s8 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c10); }
                      }
                      if (s8 !== peg$FAILED) {
                        while (s8 !== peg$FAILED) {
                          s7.push(s8);
                          if (peg$c9.test(input.charAt(peg$currPos))) {
                            s8 = input.charAt(peg$currPos);
                            peg$currPos++;
                          } else {
                            s8 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c10); }
                          }
                        }
                      } else {
                        s7 = peg$c2;
                      }
                      if (s7 !== peg$FAILED) {
                        s8 = peg$parse_();
                        if (s8 !== peg$FAILED) {
                          s9 = peg$parseLineTerminator();
                          if (s9 === peg$FAILED) {
                            s9 = peg$c11;
                          }
                          if (s9 !== peg$FAILED) {
                            peg$reportedPos = s0;
                            s1 = peg$c22(s3, s5, s7);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c2;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c2;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c2;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c2;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsecomment();
            if (s1 !== peg$FAILED) {
              if (peg$c23.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c24); }
              }
              if (s2 === peg$FAILED) {
                s2 = peg$c11;
              }
              if (s2 !== peg$FAILED) {
                s1 = [s1, s2];
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parse_();
              if (s1 !== peg$FAILED) {
                if (peg$c23.test(input.charAt(peg$currPos))) {
                  s2 = input.charAt(peg$currPos);
                  peg$currPos++;
                } else {
                  s2 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c24); }
                }
                if (s2 !== peg$FAILED) {
                  s1 = [s1, s2];
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
              if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parse_();
                if (s1 !== peg$FAILED) {
                  s2 = peg$parseconnection();
                  if (s2 !== peg$FAILED) {
                    s3 = peg$parse_();
                    if (s3 !== peg$FAILED) {
                      s4 = peg$parseLineTerminator();
                      if (s4 === peg$FAILED) {
                        s4 = peg$c11;
                      }
                      if (s4 !== peg$FAILED) {
                        peg$reportedPos = s0;
                        s1 = peg$c25(s2);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c2;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c2;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c2;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c2;
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseLineTerminator() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 44) {
          s2 = peg$c26;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c27); }
        }
        if (s2 === peg$FAILED) {
          s2 = peg$c11;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecomment();
          if (s3 === peg$FAILED) {
            s3 = peg$c11;
          }
          if (s3 !== peg$FAILED) {
            if (peg$c23.test(input.charAt(peg$currPos))) {
              s4 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c24); }
            }
            if (s4 === peg$FAILED) {
              s4 = peg$c11;
            }
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsecomment() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      s1 = peg$parse_();
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 35) {
          s2 = peg$c28;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c29); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseanychar();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseanychar();
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parseconnection() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parsebridge();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c30) {
            s3 = peg$c30;
            peg$currPos += 2;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c31); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseconnection();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c32(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsebridge();
      }

      return s0;
    }

    function peg$parsebridge() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseport();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsenode();
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseport();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c33(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parseiip();
        if (s0 === peg$FAILED) {
          s0 = peg$parserightlet();
          if (s0 === peg$FAILED) {
            s0 = peg$parseleftlet();
          }
        }
      }

      return s0;
    }

    function peg$parseleftlet() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsenode();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseport();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c34(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsenode();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parseportWithIndex();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c35(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      }

      return s0;
    }

    function peg$parseiip() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c36;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c37); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseiipchar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseiipchar();
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 39) {
            s3 = peg$c36;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c37); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c38(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parserightlet() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseport();
      if (s1 !== peg$FAILED) {
        s2 = peg$parse_();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsenode();
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c39(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseportWithIndex();
        if (s1 !== peg$FAILED) {
          s2 = peg$parse_();
          if (s2 !== peg$FAILED) {
            s3 = peg$parsenode();
            if (s3 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c40(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      }

      return s0;
    }

    function peg$parsenode() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c41.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c42); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c41.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c42); }
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecomponent();
        if (s2 === peg$FAILED) {
          s2 = peg$c11;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c43(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsecomponent() {
      var s0, s1, s2, s3, s4;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c44;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c45); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c46.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c47); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c46.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c47); }
            }
          }
        } else {
          s2 = peg$c2;
        }
        if (s2 === peg$FAILED) {
          s2 = peg$c11;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecompMeta();
          if (s3 === peg$FAILED) {
            s3 = peg$c11;
          }
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 41) {
              s4 = peg$c48;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c49); }
            }
            if (s4 !== peg$FAILED) {
              peg$reportedPos = s0;
              s1 = peg$c50(s2, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parsecompMeta() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 58) {
        s1 = peg$c7;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c8); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$c51.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c52); }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$c51.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c52); }
            }
          }
        } else {
          s2 = peg$c2;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c53(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parseport() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c54.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c55); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c54.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c55); }
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parse__();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c56(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parseportWithIndex() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c54.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c55); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c54.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c55); }
          }
        }
      } else {
        s1 = peg$c2;
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 91) {
          s2 = peg$c57;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c58); }
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          if (peg$c59.test(input.charAt(peg$currPos))) {
            s4 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c60); }
          }
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              if (peg$c59.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
              } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c60); }
              }
            }
          } else {
            s3 = peg$c2;
          }
          if (s3 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 93) {
              s4 = peg$c61;
              peg$currPos++;
            } else {
              s4 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c62); }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parse__();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c63(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c2;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c2;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c2;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }

      return s0;
    }

    function peg$parseanychar() {
      var s0;

      if (peg$c64.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c65); }
      }

      return s0;
    }

    function peg$parseiipchar() {
      var s0, s1, s2;

      s0 = peg$currPos;
      if (peg$c66.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c67); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c68.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c69); }
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c70();
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c2;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c2;
      }
      if (s0 === peg$FAILED) {
        if (peg$c71.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c72); }
        }
      }

      return s0;
    }

    function peg$parse_() {
      var s0, s1;

      s0 = [];
      if (input.charCodeAt(peg$currPos) === 32) {
        s1 = peg$c73;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (input.charCodeAt(peg$currPos) === 32) {
          s1 = peg$c73;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c74); }
        }
      }
      if (s0 === peg$FAILED) {
        s0 = peg$c11;
      }

      return s0;
    }

    function peg$parse__() {
      var s0, s1;

      s0 = [];
      if (input.charCodeAt(peg$currPos) === 32) {
        s1 = peg$c73;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          if (input.charCodeAt(peg$currPos) === 32) {
            s1 = peg$c73;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c74); }
          }
        }
      } else {
        s0 = peg$c2;
      }

      return s0;
    }


      var parser, edges, nodes; 

      parser = this;
      delete parser.exports;
      delete parser.inports;
      delete parser.outports;

      edges = parser.edges = [];

      nodes = {};

      parser.addNode = function (nodeName, comp) {
        if (!nodes[nodeName]) {
          nodes[nodeName] = {}
        }
        if (!!comp.comp) {
          nodes[nodeName].component = comp.comp;
        }
        if (!!comp.meta) {
          var metadata = {};
          for (var i = 0; i < comp.meta.length; i++) {
            var item = comp.meta[i].split('=');
            if (item.length === 1) {
              item = ['routes', item[0]];
            }
            var key = item[0];
            var value = item[1];
            if (key==='x' || key==='y') {
              value = parseFloat(value);
            }
            metadata[key] = value;
          }
          nodes[nodeName].metadata=metadata;
        }
       
      }

      parser.getResult = function () {
        return {processes:nodes, connections:parser.processEdges(), exports:parser.exports, inports: parser.inports, outports: parser.outports};
      }  

      var flatten = function (array, isShallow) {
        var index = -1,
          length = array ? array.length : 0,
          result = [];

        while (++index < length) {
          var value = array[index];

          if (value instanceof Array) {
            Array.prototype.push.apply(result, isShallow ? value : flatten(value));
          }
          else {
            result.push(value);
          }
        }
        return result;
      }
      
      parser.registerExports = function (priv, pub) {
        if (!parser.exports) {
          parser.exports = [];
        }
        parser.exports.push({private:priv.toLowerCase(), public:pub.toLowerCase()})
      }
      parser.registerInports = function (node, port, pub) {
        if (!parser.inports) {
          parser.inports = {};
        }
        parser.inports[pub.toLowerCase()] = {process:node, port:port.toLowerCase()}
      }
      parser.registerOutports = function (node, port, pub) {
        if (!parser.outports) {
          parser.outports = {};
        }
        parser.outports[pub.toLowerCase()] = {process:node, port:port.toLowerCase()}
      }

      parser.registerEdges = function (edges) {

        edges.forEach(function (o, i) {
          parser.edges.push(o);
        });
      }  

      parser.processEdges = function () {   
        var flats, grouped;
        flats = flatten(parser.edges);
        grouped = [];
        var current = {};
        flats.forEach(function (o, i) {
          if (i % 2 !== 0) { 
            var pair = grouped[grouped.length - 1];
            pair.tgt = o.tgt;
            return;
          }
          grouped.push(o);
        });
        return grouped;
      }


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
})();
},{}],54:[function(require,module,exports){
(function (process){
var EE = require('events').EventEmitter
var log = exports = module.exports = new EE
var util = require('util')

var ansi = require('ansi')
log.cursor = ansi(process.stderr)
log.stream = process.stderr

// by default, let ansi decide based on tty-ness.
var colorEnabled = undefined
log.enableColor = function () {
  colorEnabled = true
  this.cursor.enabled = true
}
log.disableColor = function () {
  colorEnabled = false
  this.cursor.enabled = false
}

// default level
log.level = 'info'

// temporarily stop emitting, but don't drop
log.pause = function () {
  this._paused = true
}

log.resume = function () {
  if (!this._paused) return
  this._paused = false

  var b = this._buffer
  this._buffer = []
  b.forEach(function (m) {
    this.emitLog(m)
  }, this)
}

log._buffer = []

var id = 0
log.record = []
log.maxRecordSize = 10000
log.log = function (lvl, prefix, message) {
  var l = this.levels[lvl]
  if (l === undefined) {
    return this.emit('error', new Error(util.format(
      'Undefined log level: %j', lvl)))
  }

  var a = new Array(arguments.length - 2)
  var stack = null
  for (var i = 2; i < arguments.length; i ++) {
    var arg = a[i-2] = arguments[i]

    // resolve stack traces to a plain string.
    if (typeof arg === 'object' && arg &&
        (arg instanceof Error) && arg.stack) {
      arg.stack = stack = arg.stack + ''
    }
  }
  if (stack) a.unshift(stack + '\n')
  message = util.format.apply(util, a)

  var m = { id: id++,
            level: lvl,
            prefix: String(prefix || ''),
            message: message,
            messageRaw: a }

  this.emit('log', m)
  this.emit('log.' + lvl, m)
  if (m.prefix) this.emit(m.prefix, m)

  this.record.push(m)
  var mrs = this.maxRecordSize
  var n = this.record.length - mrs
  if (n > mrs / 10) {
    var newSize = Math.floor(mrs * 0.9)
    this.record = this.record.slice(-1 * newSize)
  }

  this.emitLog(m)
}.bind(log)

log.emitLog = function (m) {
  if (this._paused) {
    this._buffer.push(m)
    return
  }
  var l = this.levels[m.level]
  if (l === undefined) return
  if (l < this.levels[this.level]) return
  if (l > 0 && !isFinite(l)) return

  var style = log.style[m.level]
  var disp = log.disp[m.level] || m.level
  m.message.split(/\r?\n/).forEach(function (line) {
    if (this.heading) {
      this.write(this.heading, this.headingStyle)
      this.write(' ')
    }
    this.write(disp, log.style[m.level])
    var p = m.prefix || ''
    if (p) this.write(' ')
    this.write(p, this.prefixStyle)
    this.write(' ' + line + '\n')
  }, this)
}

log.write = function (msg, style) {
  if (!this.cursor) return
  if (this.stream !== this.cursor.stream) {
    this.cursor = ansi(this.stream, { enabled: colorEnabled })
  }

  style = style || {}
  if (style.fg) this.cursor.fg[style.fg]()
  if (style.bg) this.cursor.bg[style.bg]()
  if (style.bold) this.cursor.bold()
  if (style.underline) this.cursor.underline()
  if (style.inverse) this.cursor.inverse()
  if (style.beep) this.cursor.beep()
  this.cursor.write(msg).reset()
}

log.addLevel = function (lvl, n, style, disp) {
  if (!disp) disp = lvl
  this.levels[lvl] = n
  this.style[lvl] = style
  if (!this[lvl]) this[lvl] = function () {
    var a = new Array(arguments.length + 1)
    a[0] = lvl
    for (var i = 0; i < arguments.length; i ++) {
      a[i + 1] = arguments[i]
    }
    return this.log.apply(this, a)
  }.bind(this)
  this.disp[lvl] = disp
}

log.prefixStyle = { fg: 'magenta' }
log.headingStyle = { fg: 'white', bg: 'black' }

log.style = {}
log.levels = {}
log.disp = {}
log.addLevel('silly', -Infinity, { inverse: true }, 'sill')
log.addLevel('verbose', 1000, { fg: 'blue', bg: 'black' }, 'verb')
log.addLevel('info', 2000, { fg: 'green' })
log.addLevel('http', 3000, { fg: 'green', bg: 'black' })
log.addLevel('warn', 4000, { fg: 'black', bg: 'yellow' }, 'WARN')
log.addLevel('error', 5000, { fg: 'red', bg: 'black' }, 'ERR!')
log.addLevel('silent', Infinity)

}).call(this,require('_process'))
},{"_process":12,"ansi":55,"events":9,"util":19}],55:[function(require,module,exports){

/**
 * References:
 *
 *   - http://en.wikipedia.org/wiki/ANSI_escape_code
 *   - http://www.termsys.demon.co.uk/vtansi.htm
 *
 */

/**
 * Module dependencies.
 */

var emitNewlineEvents = require('./newlines')
  , prefix = '\x1b[' // For all escape codes
  , suffix = 'm'     // Only for color codes

/**
 * The ANSI escape sequences.
 */

var codes = {
    up: 'A'
  , down: 'B'
  , forward: 'C'
  , back: 'D'
  , nextLine: 'E'
  , previousLine: 'F'
  , horizontalAbsolute: 'G'
  , eraseData: 'J'
  , eraseLine: 'K'
  , scrollUp: 'S'
  , scrollDown: 'T'
  , savePosition: 's'
  , restorePosition: 'u'
  , queryPosition: '6n'
  , hide: '?25l'
  , show: '?25h'
}

/**
 * Rendering ANSI codes.
 */

var styles = {
    bold: 1
  , italic: 3
  , underline: 4
  , inverse: 7
}

/**
 * The negating ANSI code for the rendering modes.
 */

var reset = {
    bold: 22
  , italic: 23
  , underline: 24
  , inverse: 27
}

/**
 * The standard, styleable ANSI colors.
 */

var colors = {
    white: 37
  , black: 30
  , blue: 34
  , cyan: 36
  , green: 32
  , magenta: 35
  , red: 31
  , yellow: 33
  , grey: 90
  , brightBlack: 90
  , brightRed: 91
  , brightGreen: 92
  , brightYellow: 93
  , brightBlue: 94
  , brightMagenta: 95
  , brightCyan: 96
  , brightWhite: 97
}


/**
 * Creates a Cursor instance based off the given `writable stream` instance.
 */

function ansi (stream, options) {
  if (stream._ansicursor) {
    return stream._ansicursor
  } else {
    return stream._ansicursor = new Cursor(stream, options)
  }
}
module.exports = exports = ansi

/**
 * The `Cursor` class.
 */

function Cursor (stream, options) {
  if (!(this instanceof Cursor)) {
    return new Cursor(stream, options)
  }
  if (typeof stream != 'object' || typeof stream.write != 'function') {
    throw new Error('a valid Stream instance must be passed in')
  }

  // the stream to use
  this.stream = stream

  // when 'enabled' is false then all the functions are no-ops except for write()
  this.enabled = options && options.enabled
  if (typeof this.enabled === 'undefined') {
    this.enabled = stream.isTTY
  }
  this.enabled = !!this.enabled

  // then `buffering` is true, then `write()` calls are buffered in
  // memory until `flush()` is invoked
  this.buffering = !!(options && options.buffering)
  this._buffer = []

  // controls the foreground and background colors
  this.fg = this.foreground = new Colorer(this, 0)
  this.bg = this.background = new Colorer(this, 10)

  // defaults
  this.Bold = false
  this.Italic = false
  this.Underline = false
  this.Inverse = false

  // keep track of the number of "newlines" that get encountered
  this.newlines = 0
  emitNewlineEvents(stream)
  stream.on('newline', function () {
    this.newlines++
  }.bind(this))
}
exports.Cursor = Cursor

/**
 * Helper function that calls `write()` on the underlying Stream.
 * Returns `this` instead of the write() return value to keep
 * the chaining going.
 */

Cursor.prototype.write = function (data) {
  if (this.buffering) {
    this._buffer.push(arguments)
  } else {
    this.stream.write.apply(this.stream, arguments)
  }
  return this
}

/**
 * Buffer `write()` calls into memory.
 *
 * @api public
 */

Cursor.prototype.buffer = function () {
  this.buffering = true
  return this
}

/**
 * Write out the in-memory buffer.
 *
 * @api public
 */

Cursor.prototype.flush = function () {
  this.buffering = false
  var str = this._buffer.map(function (args) {
    if (args.length != 1) throw new Error('unexpected args length! ' + args.length);
    return args[0];
  }).join('');
  this._buffer.splice(0); // empty
  this.write(str);
  return this
}


/**
 * The `Colorer` class manages both the background and foreground colors.
 */

function Colorer (cursor, base) {
  this.current = null
  this.cursor = cursor
  this.base = base
}
exports.Colorer = Colorer

/**
 * Write an ANSI color code, ensuring that the same code doesn't get rewritten.
 */

Colorer.prototype._setColorCode = function setColorCode (code) {
  var c = String(code)
  if (this.current === c) return
  this.cursor.enabled && this.cursor.write(prefix + c + suffix)
  this.current = c
  return this
}


/**
 * Set up the positional ANSI codes.
 */

Object.keys(codes).forEach(function (name) {
  var code = String(codes[name])
  Cursor.prototype[name] = function () {
    var c = code
    if (arguments.length > 0) {
      c = toArray(arguments).map(Math.round).join(';') + code
    }
    this.enabled && this.write(prefix + c)
    return this
  }
})

/**
 * Set up the functions for the rendering ANSI codes.
 */

Object.keys(styles).forEach(function (style) {
  var name = style[0].toUpperCase() + style.substring(1)
    , c = styles[style]
    , r = reset[style]

  Cursor.prototype[style] = function () {
    if (this[name]) return
    this.enabled && this.write(prefix + c + suffix)
    this[name] = true
    return this
  }

  Cursor.prototype['reset' + name] = function () {
    if (!this[name]) return
    this.enabled && this.write(prefix + r + suffix)
    this[name] = false
    return this
  }
})

/**
 * Setup the functions for the standard colors.
 */

Object.keys(colors).forEach(function (color) {
  var code = colors[color]

  Colorer.prototype[color] = function () {
    this._setColorCode(this.base + code)
    return this.cursor
  }

  Cursor.prototype[color] = function () {
    return this.foreground[color]()
  }
})

/**
 * Makes a beep sound!
 */

Cursor.prototype.beep = function () {
  this.enabled && this.write('\x07')
  return this
}

/**
 * Moves cursor to specific position
 */

Cursor.prototype.goto = function (x, y) {
  x = x | 0
  y = y | 0
  this.enabled && this.write(prefix + y + ';' + x + 'H')
  return this
}

/**
 * Resets the color.
 */

Colorer.prototype.reset = function () {
  this._setColorCode(this.base + 39)
  return this.cursor
}

/**
 * Resets all ANSI formatting on the stream.
 */

Cursor.prototype.reset = function () {
  this.enabled && this.write(prefix + '0' + suffix)
  this.Bold = false
  this.Italic = false
  this.Underline = false
  this.Inverse = false
  this.foreground.current = null
  this.background.current = null
  return this
}

/**
 * Sets the foreground color with the given RGB values.
 * The closest match out of the 216 colors is picked.
 */

Colorer.prototype.rgb = function (r, g, b) {
  var base = this.base + 38
    , code = rgb(r, g, b)
  this._setColorCode(base + ';5;' + code)
  return this.cursor
}

/**
 * Same as `cursor.fg.rgb(r, g, b)`.
 */

Cursor.prototype.rgb = function (r, g, b) {
  return this.foreground.rgb(r, g, b)
}

/**
 * Accepts CSS color codes for use with ANSI escape codes.
 * For example: `#FF000` would be bright red.
 */

Colorer.prototype.hex = function (color) {
  return this.rgb.apply(this, hex(color))
}

/**
 * Same as `cursor.fg.hex(color)`.
 */

Cursor.prototype.hex = function (color) {
  return this.foreground.hex(color)
}


// UTIL FUNCTIONS //

/**
 * Translates a 255 RGB value to a 0-5 ANSI RGV value,
 * then returns the single ANSI color code to use.
 */

function rgb (r, g, b) {
  var red = r / 255 * 5
    , green = g / 255 * 5
    , blue = b / 255 * 5
  return rgb5(red, green, blue)
}

/**
 * Turns rgb 0-5 values into a single ANSI color code to use.
 */

function rgb5 (r, g, b) {
  var red = Math.round(r)
    , green = Math.round(g)
    , blue = Math.round(b)
  return 16 + (red*36) + (green*6) + blue
}

/**
 * Accepts a hex CSS color code string (# is optional) and
 * translates it into an Array of 3 RGB 0-255 values, which
 * can then be used with rgb().
 */

function hex (color) {
  var c = color[0] === '#' ? color.substring(1) : color
    , r = c.substring(0, 2)
    , g = c.substring(2, 4)
    , b = c.substring(4, 6)
  return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)]
}

/**
 * Turns an array-like object into a real array.
 */

function toArray (a) {
  var i = 0
    , l = a.length
    , rtn = []
  for (; i<l; i++) {
    rtn.push(a[i])
  }
  return rtn
}

},{"./newlines":56}],56:[function(require,module,exports){

/**
 * Accepts any node Stream instance and hijacks its "write()" function,
 * so that it can count any newlines that get written to the output.
 *
 * When a '\n' byte is encountered, then a "newline" event will be emitted
 * on the stream, with no arguments. It is up to the listeners to determine
 * any necessary deltas required for their use-case.
 *
 * Ex:
 *
 *   var cursor = ansi(process.stdout)
 *     , ln = 0
 *   process.stdout.on('newline', function () {
 *    ln++
 *   })
 */

/**
 * Module dependencies.
 */

var assert = require('assert')
var NEWLINE = '\n'.charCodeAt(0)

function emitNewlineEvents (stream) {
  if (stream._emittingNewlines) {
    // already emitting newline events
    return
  }

  var write = stream.write

  stream.write = function (data) {
    // first write the data
    var rtn = write.apply(stream, arguments)

    if (stream.listeners('newline').length > 0) {
      var len = data.length
        , i = 0
      // now try to calculate any deltas
      if (typeof data == 'string') {
        for (; i<len; i++) {
          processByte(stream, data.charCodeAt(i))
        }
      } else {
        // buffer
        for (; i<len; i++) {
          processByte(stream, data[i])
        }
      }
    }

    return rtn
  }

  stream._emittingNewlines = true
}
module.exports = emitNewlineEvents


/**
 * Processes an individual byte being written to a stream
 */

function processByte (stream, b) {
  assert.equal(typeof b, 'number')
  if (b === NEWLINE) {
    stream.emit('newline')
  }
}

},{"assert":3}],57:[function(require,module,exports){
(function (process,__filename,__dirname){
// eeeeeevvvvviiiiiiillllll
// more evil than monkey-patching the native builtin?
// Not sure.

var mod = require("module")
var pre = '(function (exports, require, module, __filename, __dirname) { '
var post = '});'
var src = pre + process.binding('natives').fs + post
var vm = require('vm')
var fn = vm.runInThisContext(src)
fn(exports, require, module, __filename, __dirname)

}).call(this,require('_process'),"/node_modules/noflo/node_modules/read-installed/node_modules/graceful-fs/fs.js","/node_modules/noflo/node_modules/read-installed/node_modules/graceful-fs")
},{"_process":12,"module":2,"vm":20}],58:[function(require,module,exports){
(function (process){
// Monkey-patching the fs module.
// It's ugly, but there is simply no other way to do this.
var fs = module.exports = require('./fs.js')

var assert = require('assert')

// fix up some busted stuff, mostly on windows and old nodes
require('./polyfills.js')

var util = require('util')

function noop () {}

var debug = noop
if (util.debuglog)
  debug = util.debuglog('gfs')
else if (/\bgfs\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util.format.apply(util, arguments)
    m = 'GFS: ' + m.split(/\n/).join('\nGFS: ')
    console.error(m)
  }

if (/\bgfs\b/i.test(process.env.NODE_DEBUG || '')) {
  process.on('exit', function() {
    debug('fds', fds)
    debug(queue)
    assert.equal(queue.length, 0)
  })
}


var originalOpen = fs.open
fs.open = open

function open(path, flags, mode, cb) {
  if (typeof mode === "function") cb = mode, mode = null
  if (typeof cb !== "function") cb = noop
  new OpenReq(path, flags, mode, cb)
}

function OpenReq(path, flags, mode, cb) {
  this.path = path
  this.flags = flags
  this.mode = mode
  this.cb = cb
  Req.call(this)
}

util.inherits(OpenReq, Req)

OpenReq.prototype.process = function() {
  originalOpen.call(fs, this.path, this.flags, this.mode, this.done)
}

var fds = {}
OpenReq.prototype.done = function(er, fd) {
  debug('open done', er, fd)
  if (fd)
    fds['fd' + fd] = this.path
  Req.prototype.done.call(this, er, fd)
}


var originalReaddir = fs.readdir
fs.readdir = readdir

function readdir(path, cb) {
  if (typeof cb !== "function") cb = noop
  new ReaddirReq(path, cb)
}

function ReaddirReq(path, cb) {
  this.path = path
  this.cb = cb
  Req.call(this)
}

util.inherits(ReaddirReq, Req)

ReaddirReq.prototype.process = function() {
  originalReaddir.call(fs, this.path, this.done)
}

ReaddirReq.prototype.done = function(er, files) {
  if (files && files.sort)
    files = files.sort()
  Req.prototype.done.call(this, er, files)
  onclose()
}


var originalClose = fs.close
fs.close = close

function close (fd, cb) {
  debug('close', fd)
  if (typeof cb !== "function") cb = noop
  delete fds['fd' + fd]
  originalClose.call(fs, fd, function(er) {
    onclose()
    cb(er)
  })
}


var originalCloseSync = fs.closeSync
fs.closeSync = closeSync

function closeSync (fd) {
  try {
    return originalCloseSync(fd)
  } finally {
    onclose()
  }
}


// Req class
function Req () {
  // start processing
  this.done = this.done.bind(this)
  this.failures = 0
  this.process()
}

Req.prototype.done = function (er, result) {
  var tryAgain = false
  if (er) {
    var code = er.code
    var tryAgain = code === "EMFILE" || code === "ENFILE"
    if (process.platform === "win32")
      tryAgain = tryAgain || code === "OK"
  }

  if (tryAgain) {
    this.failures ++
    enqueue(this)
  } else {
    var cb = this.cb
    cb(er, result)
  }
}

var queue = []

function enqueue(req) {
  queue.push(req)
  debug('enqueue %d %s', queue.length, req.constructor.name, req)
}

function onclose() {
  var req = queue.shift()
  if (req) {
    debug('process', req.constructor.name, req)
    req.process()
  }
}

}).call(this,require('_process'))
},{"./fs.js":57,"./polyfills.js":59,"_process":12,"assert":3,"util":19}],59:[function(require,module,exports){
(function (process){
var fs = require('./fs.js')
var constants = require('constants')

var origCwd = process.cwd
var cwd = null
process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process)
  return cwd
}
var chdir = process.chdir
process.chdir = function(d) {
  cwd = null
  chdir.call(process, d)
}

// (re-)implement some things that are known busted or missing.

// lchmod, broken prior to 0.6.2
// back-port the fix here.
if (constants.hasOwnProperty('O_SYMLINK') &&
    process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
  fs.lchmod = function (path, mode, callback) {
    callback = callback || noop
    fs.open( path
           , constants.O_WRONLY | constants.O_SYMLINK
           , mode
           , function (err, fd) {
      if (err) {
        callback(err)
        return
      }
      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      fs.fchmod(fd, mode, function (err) {
        fs.close(fd, function(err2) {
          callback(err || err2)
        })
      })
    })
  }

  fs.lchmodSync = function (path, mode) {
    var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode)

    // prefer to return the chmod error, if one occurs,
    // but still try to close, and report closing errors if they occur.
    var err, err2
    try {
      var ret = fs.fchmodSync(fd, mode)
    } catch (er) {
      err = er
    }
    try {
      fs.closeSync(fd)
    } catch (er) {
      err2 = er
    }
    if (err || err2) throw (err || err2)
    return ret
  }
}


// lutimes implementation, or no-op
if (!fs.lutimes) {
  if (constants.hasOwnProperty("O_SYMLINK")) {
    fs.lutimes = function (path, at, mt, cb) {
      fs.open(path, constants.O_SYMLINK, function (er, fd) {
        cb = cb || noop
        if (er) return cb(er)
        fs.futimes(fd, at, mt, function (er) {
          fs.close(fd, function (er2) {
            return cb(er || er2)
          })
        })
      })
    }

    fs.lutimesSync = function (path, at, mt) {
      var fd = fs.openSync(path, constants.O_SYMLINK)
        , err
        , err2
        , ret

      try {
        var ret = fs.futimesSync(fd, at, mt)
      } catch (er) {
        err = er
      }
      try {
        fs.closeSync(fd)
      } catch (er) {
        err2 = er
      }
      if (err || err2) throw (err || err2)
      return ret
    }

  } else if (fs.utimensat && constants.hasOwnProperty("AT_SYMLINK_NOFOLLOW")) {
    // maybe utimensat will be bound soonish?
    fs.lutimes = function (path, at, mt, cb) {
      fs.utimensat(path, at, mt, constants.AT_SYMLINK_NOFOLLOW, cb)
    }

    fs.lutimesSync = function (path, at, mt) {
      return fs.utimensatSync(path, at, mt, constants.AT_SYMLINK_NOFOLLOW)
    }

  } else {
    fs.lutimes = function (_a, _b, _c, cb) { process.nextTick(cb) }
    fs.lutimesSync = function () {}
  }
}


// https://github.com/isaacs/node-graceful-fs/issues/4
// Chown should not fail on einval or eperm if non-root.
// It should not fail on enosys ever, as this just indicates
// that a fs doesn't support the intended operation.

fs.chown = chownFix(fs.chown)
fs.fchown = chownFix(fs.fchown)
fs.lchown = chownFix(fs.lchown)

fs.chmod = chownFix(fs.chmod)
fs.fchmod = chownFix(fs.fchmod)
fs.lchmod = chownFix(fs.lchmod)

fs.chownSync = chownFixSync(fs.chownSync)
fs.fchownSync = chownFixSync(fs.fchownSync)
fs.lchownSync = chownFixSync(fs.lchownSync)

fs.chmodSync = chownFix(fs.chmodSync)
fs.fchmodSync = chownFix(fs.fchmodSync)
fs.lchmodSync = chownFix(fs.lchmodSync)

function chownFix (orig) {
  if (!orig) return orig
  return function (target, uid, gid, cb) {
    return orig.call(fs, target, uid, gid, function (er, res) {
      if (chownErOk(er)) er = null
      cb(er, res)
    })
  }
}

function chownFixSync (orig) {
  if (!orig) return orig
  return function (target, uid, gid) {
    try {
      return orig.call(fs, target, uid, gid)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}

// ENOSYS means that the fs doesn't support the op. Just ignore
// that, because it doesn't matter.
//
// if there's no getuid, or if getuid() is something other
// than 0, and the error is EINVAL or EPERM, then just ignore
// it.
//
// This specific case is a silent failure in cp, install, tar,
// and most other unix tools that manage permissions.
//
// When running as root, or if other types of errors are
// encountered, then it's strict.
function chownErOk (er) {
  if (!er)
    return true

  if (er.code === "ENOSYS")
    return true

  var nonroot = !process.getuid || process.getuid() !== 0
  if (nonroot) {
    if (er.code === "EINVAL" || er.code === "EPERM")
      return true
  }

  return false
}


// if lchmod/lchown do not exist, then make them no-ops
if (!fs.lchmod) {
  fs.lchmod = function (path, mode, cb) {
    process.nextTick(cb)
  }
  fs.lchmodSync = function () {}
}
if (!fs.lchown) {
  fs.lchown = function (path, uid, gid, cb) {
    process.nextTick(cb)
  }
  fs.lchownSync = function () {}
}



// on Windows, A/V software can lock the directory, causing this
// to fail with an EACCES or EPERM if the directory contains newly
// created files.  Try again on failure, for up to 1 second.
if (process.platform === "win32") {
  var rename_ = fs.rename
  fs.rename = function rename (from, to, cb) {
    var start = Date.now()
    rename_(from, to, function CB (er) {
      if (er
          && (er.code === "EACCES" || er.code === "EPERM")
          && Date.now() - start < 1000) {
        return rename_(from, to, CB)
      }
      if(cb) cb(er)
    })
  }
}


// if read() returns EAGAIN, then just try it again.
var read = fs.read
fs.read = function (fd, buffer, offset, length, position, callback_) {
  var callback
  if (callback_ && typeof callback_ === 'function') {
    var eagCounter = 0
    callback = function (er, _, __) {
      if (er && er.code === 'EAGAIN' && eagCounter < 10) {
        eagCounter ++
        return read.call(fs, fd, buffer, offset, length, position, callback)
      }
      callback_.apply(this, arguments)
    }
  }
  return read.call(fs, fd, buffer, offset, length, position, callback)
}

var readSync = fs.readSync
fs.readSync = function (fd, buffer, offset, length, position) {
  var eagCounter = 0
  while (true) {
    try {
      return readSync.call(fs, fd, buffer, offset, length, position)
    } catch (er) {
      if (er.code === 'EAGAIN' && eagCounter < 10) {
        eagCounter ++
        continue
      }
      throw er
    }
  }
}


}).call(this,require('_process'))
},{"./fs.js":57,"_process":12,"constants":8}],60:[function(require,module,exports){
(function (process){
exports.alphasort = alphasort
exports.alphasorti = alphasorti
exports.setopts = setopts
exports.ownProp = ownProp
exports.makeAbs = makeAbs
exports.finish = finish
exports.mark = mark
exports.isIgnored = isIgnored
exports.childrenIgnored = childrenIgnored

function ownProp (obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field)
}

var path = require("path")
var minimatch = require("minimatch")
var isAbsolute = require("path-is-absolute")
var Minimatch = minimatch.Minimatch

function alphasorti (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase())
}

function alphasort (a, b) {
  return a.localeCompare(b)
}

function setupIgnores (self, options) {
  self.ignore = options.ignore || []

  if (!Array.isArray(self.ignore))
    self.ignore = [self.ignore]

  if (self.ignore.length) {
    self.ignore = self.ignore.map(ignoreMap)
  }
}

function ignoreMap (pattern) {
  var gmatcher = null
  if (pattern.slice(-3) === '/**') {
    var gpattern = pattern.replace(/(\/\*\*)+$/, '')
    gmatcher = new Minimatch(gpattern)
  }

  return {
    matcher: new Minimatch(pattern),
    gmatcher: gmatcher
  }
}

function setopts (self, pattern, options) {
  if (!options)
    options = {}

  // base-matching: just use globstar for that.
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar")
    }
    pattern = "**/" + pattern
  }

  self.silent = !!options.silent
  self.pattern = pattern
  self.strict = options.strict !== false
  self.realpath = !!options.realpath
  self.realpathCache = options.realpathCache || Object.create(null)
  self.follow = !!options.follow
  self.dot = !!options.dot
  self.mark = !!options.mark
  self.nodir = !!options.nodir
  if (self.nodir)
    self.mark = true
  self.sync = !!options.sync
  self.nounique = !!options.nounique
  self.nonull = !!options.nonull
  self.nosort = !!options.nosort
  self.nocase = !!options.nocase
  self.stat = !!options.stat
  self.noprocess = !!options.noprocess

  self.maxLength = options.maxLength || Infinity
  self.cache = options.cache || Object.create(null)
  self.statCache = options.statCache || Object.create(null)
  self.symlinks = options.symlinks || Object.create(null)

  setupIgnores(self, options)

  self.changedCwd = false
  var cwd = process.cwd()
  if (!ownProp(options, "cwd"))
    self.cwd = cwd
  else {
    self.cwd = options.cwd
    self.changedCwd = path.resolve(options.cwd) !== cwd
  }

  self.root = options.root || path.resolve(self.cwd, "/")
  self.root = path.resolve(self.root)
  if (process.platform === "win32")
    self.root = self.root.replace(/\\/g, "/")

  self.nomount = !!options.nomount

  // disable comments and negation unless the user explicitly
  // passes in false as the option.
  options.nonegate = options.nonegate === false ? false : true
  options.nocomment = options.nocomment === false ? false : true
  deprecationWarning(options)

  self.minimatch = new Minimatch(pattern, options)
  self.options = self.minimatch.options
}

// TODO(isaacs): remove entirely in v6
// exported to reset in tests
exports.deprecationWarned
function deprecationWarning(options) {
  if (!options.nonegate || !options.nocomment) {
    if (process.noDeprecation !== true && !exports.deprecationWarned) {
      var msg = 'glob WARNING: comments and negation will be disabled in v6'
      if (process.throwDeprecation)
        throw new Error(msg)
      else if (process.traceDeprecation)
        console.trace(msg)
      else
        console.error(msg)

      exports.deprecationWarned = true
    }
  }
}

function finish (self) {
  var nou = self.nounique
  var all = nou ? [] : Object.create(null)

  for (var i = 0, l = self.matches.length; i < l; i ++) {
    var matches = self.matches[i]
    if (!matches || Object.keys(matches).length === 0) {
      if (self.nonull) {
        // do like the shell, and spit out the literal glob
        var literal = self.minimatch.globSet[i]
        if (nou)
          all.push(literal)
        else
          all[literal] = true
      }
    } else {
      // had matches
      var m = Object.keys(matches)
      if (nou)
        all.push.apply(all, m)
      else
        m.forEach(function (m) {
          all[m] = true
        })
    }
  }

  if (!nou)
    all = Object.keys(all)

  if (!self.nosort)
    all = all.sort(self.nocase ? alphasorti : alphasort)

  // at *some* point we statted all of these
  if (self.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self._mark(all[i])
    }
    if (self.nodir) {
      all = all.filter(function (e) {
        return !(/\/$/.test(e))
      })
    }
  }

  if (self.ignore.length)
    all = all.filter(function(m) {
      return !isIgnored(self, m)
    })

  self.found = all
}

function mark (self, p) {
  var abs = makeAbs(self, p)
  var c = self.cache[abs]
  var m = p
  if (c) {
    var isDir = c === 'DIR' || Array.isArray(c)
    var slash = p.slice(-1) === '/'

    if (isDir && !slash)
      m += '/'
    else if (!isDir && slash)
      m = m.slice(0, -1)

    if (m !== p) {
      var mabs = makeAbs(self, m)
      self.statCache[mabs] = self.statCache[abs]
      self.cache[mabs] = self.cache[abs]
    }
  }

  return m
}

// lotta situps...
function makeAbs (self, f) {
  var abs = f
  if (f.charAt(0) === '/') {
    abs = path.join(self.root, f)
  } else if (isAbsolute(f) || f === '') {
    abs = f
  } else if (self.changedCwd) {
    abs = path.resolve(self.cwd, f)
  } else {
    abs = path.resolve(f)
  }
  return abs
}


// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
function isIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
  })
}

function childrenIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path))
  })
}

}).call(this,require('_process'))
},{"_process":12,"minimatch":65,"path":11,"path-is-absolute":71}],61:[function(require,module,exports){
(function (process){
// Approach:
//
// 1. Get the minimatch set
// 2. For each pattern in the set, PROCESS(pattern, false)
// 3. Store matches per-set, then uniq them
//
// PROCESS(pattern, inGlobStar)
// Get the first [n] items from pattern that are all strings
// Join these together.  This is PREFIX.
//   If there is no more remaining, then stat(PREFIX) and
//   add to matches if it succeeds.  END.
//
// If inGlobStar and PREFIX is symlink and points to dir
//   set ENTRIES = []
// else readdir(PREFIX) as ENTRIES
//   If fail, END
//
// with ENTRIES
//   If pattern[n] is GLOBSTAR
//     // handle the case where the globstar match is empty
//     // by pruning it out, and testing the resulting pattern
//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
//     // handle other cases.
//     for ENTRY in ENTRIES (not dotfiles)
//       // attach globstar + tail onto the entry
//       // Mark that this entry is a globstar match
//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
//
//   else // not globstar
//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
//       Test ENTRY against pattern[n]
//       If fails, continue
//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
//
// Caveat:
//   Cache all stats and readdirs results to minimize syscall.  Since all
//   we ever care about is existence and directory-ness, we can just keep
//   `true` for files, and [children,...] for directories, or `false` for
//   things that don't exist.

module.exports = glob

var fs = require('fs')
var minimatch = require('minimatch')
var Minimatch = minimatch.Minimatch
var inherits = require('inherits')
var EE = require('events').EventEmitter
var path = require('path')
var assert = require('assert')
var isAbsolute = require('path-is-absolute')
var globSync = require('./sync.js')
var common = require('./common.js')
var alphasort = common.alphasort
var alphasorti = common.alphasorti
var setopts = common.setopts
var ownProp = common.ownProp
var inflight = require('inflight')
var util = require('util')
var childrenIgnored = common.childrenIgnored

var once = require('once')

function glob (pattern, options, cb) {
  if (typeof options === 'function') cb = options, options = {}
  if (!options) options = {}

  if (options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return globSync(pattern, options)
  }

  return new Glob(pattern, options, cb)
}

glob.sync = globSync
var GlobSync = glob.GlobSync = globSync.GlobSync

// old api surface
glob.glob = glob

glob.hasMagic = function (pattern, options_) {
  var options = util._extend({}, options_)
  options.noprocess = true

  var g = new Glob(pattern, options)
  var set = g.minimatch.set
  if (set.length > 1)
    return true

  for (var j = 0; j < set[0].length; j++) {
    if (typeof set[0][j] !== 'string')
      return true
  }

  return false
}

glob.Glob = Glob
inherits(Glob, EE)
function Glob (pattern, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = null
  }

  if (options && options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return new GlobSync(pattern, options)
  }

  if (!(this instanceof Glob))
    return new Glob(pattern, options, cb)

  setopts(this, pattern, options)
  this._didRealPath = false

  // process each pattern in the minimatch set
  var n = this.minimatch.set.length

  // The matches are stored as {<filename>: true,...} so that
  // duplicates are automagically pruned.
  // Later, we do an Object.keys() on these.
  // Keep them as a list so we can fill in when nonull is set.
  this.matches = new Array(n)

  if (typeof cb === 'function') {
    cb = once(cb)
    this.on('error', cb)
    this.on('end', function (matches) {
      cb(null, matches)
    })
  }

  var self = this
  var n = this.minimatch.set.length
  this._processing = 0
  this.matches = new Array(n)

  this._emitQueue = []
  this._processQueue = []
  this.paused = false

  if (this.noprocess)
    return this

  if (n === 0)
    return done()

  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false, done)
  }

  function done () {
    --self._processing
    if (self._processing <= 0)
      self._finish()
  }
}

Glob.prototype._finish = function () {
  assert(this instanceof Glob)
  if (this.aborted)
    return

  if (this.realpath && !this._didRealpath)
    return this._realpath()

  common.finish(this)
  this.emit('end', this.found)
}

Glob.prototype._realpath = function () {
  if (this._didRealpath)
    return

  this._didRealpath = true

  var n = this.matches.length
  if (n === 0)
    return this._finish()

  var self = this
  for (var i = 0; i < this.matches.length; i++)
    this._realpathSet(i, next)

  function next () {
    if (--n === 0)
      self._finish()
  }
}

Glob.prototype._realpathSet = function (index, cb) {
  var matchset = this.matches[index]
  if (!matchset)
    return cb()

  var found = Object.keys(matchset)
  var self = this
  var n = found.length

  if (n === 0)
    return cb()

  var set = this.matches[index] = Object.create(null)
  found.forEach(function (p, i) {
    // If there's a problem with the stat, then it means that
    // one or more of the links in the realpath couldn't be
    // resolved.  just return the abs value in that case.
    p = self._makeAbs(p)
    fs.realpath(p, self.realpathCache, function (er, real) {
      if (!er)
        set[real] = true
      else if (er.syscall === 'stat')
        set[p] = true
      else
        self.emit('error', er) // srsly wtf right here

      if (--n === 0) {
        self.matches[index] = set
        cb()
      }
    })
  })
}

Glob.prototype._mark = function (p) {
  return common.mark(this, p)
}

Glob.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
}

Glob.prototype.abort = function () {
  this.aborted = true
  this.emit('abort')
}

Glob.prototype.pause = function () {
  if (!this.paused) {
    this.paused = true
    this.emit('pause')
  }
}

Glob.prototype.resume = function () {
  if (this.paused) {
    this.emit('resume')
    this.paused = false
    if (this._emitQueue.length) {
      var eq = this._emitQueue.slice(0)
      this._emitQueue.length = 0
      for (var i = 0; i < eq.length; i ++) {
        var e = eq[i]
        this._emitMatch(e[0], e[1])
      }
    }
    if (this._processQueue.length) {
      var pq = this._processQueue.slice(0)
      this._processQueue.length = 0
      for (var i = 0; i < pq.length; i ++) {
        var p = pq[i]
        this._processing--
        this._process(p[0], p[1], p[2], p[3])
      }
    }
  }
}

Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
  assert(this instanceof Glob)
  assert(typeof cb === 'function')

  if (this.aborted)
    return

  this._processing++
  if (this.paused) {
    this._processQueue.push([pattern, index, inGlobStar, cb])
    return
  }

  //console.error('PROCESS %d', this._processing, pattern)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0
  while (typeof pattern[n] === 'string') {
    n ++
  }
  // now n is the index of the first one that is *not* a string.

  // see if there's anything else
  var prefix
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index, cb)
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/')
      break
  }

  var remain = pattern.slice(n)

  // get the list of entries.
  var read
  if (prefix === null)
    read = '.'
  else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
    if (!prefix || !isAbsolute(prefix))
      prefix = '/' + prefix
    read = prefix
  } else
    read = prefix

  var abs = this._makeAbs(read)

  //if ignored, skip _processing
  if (childrenIgnored(this, read))
    return cb()

  var isGlobStar = remain[0] === minimatch.GLOBSTAR
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb)
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb)
}

Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this
  this._readdir(abs, inGlobStar, function (er, entries) {
    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  })
}

Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return cb()

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0]
  var negate = !!this.minimatch.negate
  var rawGlob = pn._glob
  var dotOk = this.dot || rawGlob.charAt(0) === '.'

  var matchedEntries = []
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    if (e.charAt(0) !== '.' || dotOk) {
      var m
      if (negate && !prefix) {
        m = !e.match(pn)
      } else {
        m = e.match(pn)
      }
      if (m)
        matchedEntries.push(e)
    }
  }

  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

  var len = matchedEntries.length
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return cb()

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null)

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i]
      if (prefix) {
        if (prefix !== '/')
          e = prefix + '/' + e
        else
          e = prefix + e
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path.join(this.root, e)
      }
      this._emitMatch(index, e)
    }
    // This was the last one, and no stats were needed
    return cb()
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift()
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i]
    var newPattern
    if (prefix) {
      if (prefix !== '/')
        e = prefix + '/' + e
      else
        e = prefix + e
    }
    this._process([e].concat(remain), index, inGlobStar, cb)
  }
  cb()
}

Glob.prototype._emitMatch = function (index, e) {
  if (this.aborted)
    return

  if (this.matches[index][e])
    return

  if (this.paused) {
    this._emitQueue.push([index, e])
    return
  }

  var abs = this._makeAbs(e)

  if (this.nodir) {
    var c = this.cache[abs]
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  if (this.mark)
    e = this._mark(e)

  this.matches[index][e] = true

  var st = this.statCache[abs]
  if (st)
    this.emit('stat', e, st)

  this.emit('match', e)
}

Glob.prototype._readdirInGlobStar = function (abs, cb) {
  if (this.aborted)
    return

  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false, cb)

  var lstatkey = 'lstat\0' + abs
  var self = this
  var lstatcb = inflight(lstatkey, lstatcb_)

  if (lstatcb)
    fs.lstat(abs, lstatcb)

  function lstatcb_ (er, lstat) {
    if (er)
      return cb()

    var isSym = lstat.isSymbolicLink()
    self.symlinks[abs] = isSym

    // If it's not a symlink or a dir, then it's definitely a regular file.
    // don't bother doing a readdir in that case.
    if (!isSym && !lstat.isDirectory()) {
      self.cache[abs] = 'FILE'
      cb()
    } else
      self._readdir(abs, false, cb)
  }
}

Glob.prototype._readdir = function (abs, inGlobStar, cb) {
  if (this.aborted)
    return

  cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb)
  if (!cb)
    return

  //console.error('RD %j %j', +inGlobStar, abs)
  if (inGlobStar && !ownProp(this.symlinks, abs))
    return this._readdirInGlobStar(abs, cb)

  if (ownProp(this.cache, abs)) {
    var c = this.cache[abs]
    if (!c || c === 'FILE')
      return cb()

    if (Array.isArray(c))
      return cb(null, c)
  }

  var self = this
  fs.readdir(abs, readdirCb(this, abs, cb))
}

function readdirCb (self, abs, cb) {
  return function (er, entries) {
    if (er)
      self._readdirError(abs, er, cb)
    else
      self._readdirEntries(abs, entries, cb)
  }
}

Glob.prototype._readdirEntries = function (abs, entries, cb) {
  if (this.aborted)
    return

  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i]
      if (abs === '/')
        e = abs + e
      else
        e = abs + '/' + e
      this.cache[e] = true
    }
  }

  this.cache[abs] = entries
  return cb(null, entries)
}

Glob.prototype._readdirError = function (f, er, cb) {
  if (this.aborted)
    return

  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTDIR': // totally normal. means it *does* exist.
      this.cache[this._makeAbs(f)] = 'FILE'
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false
      if (this.strict) {
        this.emit('error', er)
        // If the error is handled, then we abort
        // if not, we threw out of here
        this.abort()
      }
      if (!this.silent)
        console.error('glob error', er)
      break
  }

  return cb()
}

Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this
  this._readdir(abs, inGlobStar, function (er, entries) {
    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  })
}


Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
  //console.error('pgs2', prefix, remain[0], entries)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return cb()

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1)
  var gspref = prefix ? [ prefix ] : []
  var noGlobStar = gspref.concat(remainWithoutGlobStar)

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false, cb)

  var isSym = this.symlinks[abs]
  var len = entries.length

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return cb()

  for (var i = 0; i < len; i++) {
    var e = entries[i]
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar)
    this._process(instead, index, true, cb)

    var below = gspref.concat(entries[i], remain)
    this._process(below, index, true, cb)
  }

  cb()
}

Glob.prototype._processSimple = function (prefix, index, cb) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var self = this
  this._stat(prefix, function (er, exists) {
    self._processSimple2(prefix, index, er, exists, cb)
  })
}
Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

  //console.error('ps2', prefix, exists)

  if (!this.matches[index])
    this.matches[index] = Object.create(null)

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return cb()

  if (prefix && isAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix)
    if (prefix.charAt(0) === '/') {
      prefix = path.join(this.root, prefix)
    } else {
      prefix = path.resolve(this.root, prefix)
      if (trail)
        prefix += '/'
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/')

  // Mark this as a match
  this._emitMatch(index, prefix)
  cb()
}

// Returns either 'DIR', 'FILE', or false
Glob.prototype._stat = function (f, cb) {
  var abs = this._makeAbs(f)
  var needDir = f.slice(-1) === '/'

  if (f.length > this.maxLength)
    return cb()

  if (!this.stat && ownProp(this.cache, abs)) {
    var c = this.cache[abs]

    if (Array.isArray(c))
      c = 'DIR'

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return cb(null, c)

    if (needDir && c === 'FILE')
      return cb()

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }

  var exists
  var stat = this.statCache[abs]
  if (stat !== undefined) {
    if (stat === false)
      return cb(null, stat)
    else {
      var type = stat.isDirectory() ? 'DIR' : 'FILE'
      if (needDir && type === 'FILE')
        return cb()
      else
        return cb(null, type, stat)
    }
  }

  var self = this
  var statcb = inflight('stat\0' + abs, lstatcb_)
  if (statcb)
    fs.lstat(abs, statcb)

  function lstatcb_ (er, lstat) {
    if (lstat && lstat.isSymbolicLink()) {
      // If it's a symlink, then treat it as the target, unless
      // the target does not exist, then treat it as a file.
      return fs.stat(abs, function (er, stat) {
        if (er)
          self._stat2(f, abs, null, lstat, cb)
        else
          self._stat2(f, abs, er, stat, cb)
      })
    } else {
      self._stat2(f, abs, er, lstat, cb)
    }
  }
}

Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
  if (er) {
    this.statCache[abs] = false
    return cb()
  }

  var needDir = f.slice(-1) === '/'
  this.statCache[abs] = stat

  if (abs.slice(-1) === '/' && !stat.isDirectory())
    return cb(null, false, stat)

  var c = stat.isDirectory() ? 'DIR' : 'FILE'
  this.cache[abs] = this.cache[abs] || c

  if (needDir && c !== 'DIR')
    return cb()

  return cb(null, c, stat)
}

}).call(this,require('_process'))
},{"./common.js":60,"./sync.js":72,"_process":12,"assert":3,"events":9,"fs":2,"inflight":62,"inherits":64,"minimatch":65,"once":70,"path":11,"path-is-absolute":71,"util":19}],62:[function(require,module,exports){
(function (process){
var wrappy = require('wrappy')
var reqs = Object.create(null)
var once = require('once')

module.exports = wrappy(inflight)

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb)
    return null
  } else {
    reqs[key] = [cb]
    return makeres(key)
  }
}

function makeres (key) {
  return once(function RES () {
    var cbs = reqs[key]
    var len = cbs.length
    var args = slice(arguments)
    for (var i = 0; i < len; i++) {
      cbs[i].apply(null, args)
    }
    if (cbs.length > len) {
      // added more in the interim.
      // de-zalgo, just in case, but don't call again.
      cbs.splice(0, len)
      process.nextTick(function () {
        RES.apply(null, args)
      })
    } else {
      delete reqs[key]
    }
  })
}

function slice (args) {
  var length = args.length
  var array = []

  for (var i = 0; i < length; i++) array[i] = args[i]
  return array
}

}).call(this,require('_process'))
},{"_process":12,"once":70,"wrappy":63}],63:[function(require,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}],64:[function(require,module,exports){
module.exports=require(10)
},{"/home/joel/dev/the-graph/node_modules/grunt-browserify/node_modules/browserify/node_modules/inherits/inherits_browser.js":10}],65:[function(require,module,exports){
module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = { sep: '/' }
try {
  path = require('path')
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = require('brace-expansion')

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {}
  b = b || {}
  var t = {}
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}
  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = console.error

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  if (typeof pattern === 'undefined') {
    throw new Error('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  var options = this.options

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var plType
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        plType = stateChar
        patternListStack.push({ type: plType, start: i - 1, reStart: re.length })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        re += ')'
        plType = patternListStack.pop().type
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        switch (plType) {
          case '!':
            re += '[^/]*?)'
            break
          case '?':
          case '+':
          case '*':
            re += plType
            break
          case '@': break // the default anyway
        }
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i)
          try {
            RegExp('[' + cs + ']')
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE)
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
            hasMagic = hasMagic || sp[1]
            inClass = false
            continue
          }
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (var pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + 3)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2})*)(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) re = '(?=.)' + re

  if (addPatternStart) re = patternStart + re

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  var regExp = new RegExp('^' + re + '$', flags)

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = match
function match (f, partial) {
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase()
      } else {
        hit = f === p
      }
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

},{"brace-expansion":66,"path":11}],66:[function(require,module,exports){
var concatMap = require('concat-map');
var balanced = require('balanced-match');

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = /^(.*,)+(.+)?$/.test(m.body);
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}


},{"balanced-match":67,"concat-map":68}],67:[function(require,module,exports){
module.exports = balanced;
function balanced(a, b, str) {
  var bal = 0;
  var m = {};
  var ended = false;

  for (var i = 0; i < str.length; i++) {
    if (a == str.substr(i, a.length)) {
      if (!('start' in m)) m.start = i;
      bal++;
    }
    else if (b == str.substr(i, b.length) && 'start' in m) {
      ended = true;
      bal--;
      if (!bal) {
        m.end = i;
        m.pre = str.substr(0, m.start);
        m.body = (m.end - m.start > 1)
          ? str.substring(m.start + a.length, m.end)
          : '';
        m.post = str.slice(m.end + b.length);
        return m;
      }
    }
  }

  // if we opened more than we closed, find the one we closed
  if (bal && ended) {
    var start = m.start + a.length;
    m = balanced(a, b, str.substr(start));
    if (m) {
      m.start += start;
      m.end += start;
      m.pre = str.slice(0, start) + m.pre;
    }
    return m;
  }
}

},{}],68:[function(require,module,exports){
module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],69:[function(require,module,exports){
module.exports=require(63)
},{"/home/joel/dev/the-graph/node_modules/noflo/node_modules/read-installed/node_modules/read-package-json/node_modules/glob/node_modules/inflight/node_modules/wrappy/wrappy.js":63}],70:[function(require,module,exports){
var wrappy = require('wrappy')
module.exports = wrappy(once)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

},{"wrappy":69}],71:[function(require,module,exports){
(function (process){
'use strict';

function posix(path) {
	return path.charAt(0) === '/';
};

function win32(path) {
	// https://github.com/joyent/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
	var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
	var result = splitDeviceRe.exec(path);
	var device = result[1] || '';
	var isUnc = !!device && device.charAt(1) !== ':';

	// UNC paths are always absolute
	return !!result[2] || isUnc;
};

module.exports = process.platform === 'win32' ? win32 : posix;
module.exports.posix = posix;
module.exports.win32 = win32;

}).call(this,require('_process'))
},{"_process":12}],72:[function(require,module,exports){
(function (process){
module.exports = globSync
globSync.GlobSync = GlobSync

var fs = require('fs')
var minimatch = require('minimatch')
var Minimatch = minimatch.Minimatch
var Glob = require('./glob.js').Glob
var util = require('util')
var path = require('path')
var assert = require('assert')
var isAbsolute = require('path-is-absolute')
var common = require('./common.js')
var alphasort = common.alphasort
var alphasorti = common.alphasorti
var setopts = common.setopts
var ownProp = common.ownProp
var childrenIgnored = common.childrenIgnored

function globSync (pattern, options) {
  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  return new GlobSync(pattern, options).found
}

function GlobSync (pattern, options) {
  if (!pattern)
    throw new Error('must provide pattern')

  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  if (!(this instanceof GlobSync))
    return new GlobSync(pattern, options)

  setopts(this, pattern, options)

  if (this.noprocess)
    return this

  var n = this.minimatch.set.length
  this.matches = new Array(n)
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false)
  }
  this._finish()
}

GlobSync.prototype._finish = function () {
  assert(this instanceof GlobSync)
  if (this.realpath) {
    var self = this
    this.matches.forEach(function (matchset, index) {
      var set = self.matches[index] = Object.create(null)
      for (var p in matchset) {
        try {
          p = self._makeAbs(p)
          var real = fs.realpathSync(p, this.realpathCache)
          set[real] = true
        } catch (er) {
          if (er.syscall === 'stat')
            set[self._makeAbs(p)] = true
          else
            throw er
        }
      }
    })
  }
  common.finish(this)
}


GlobSync.prototype._process = function (pattern, index, inGlobStar) {
  assert(this instanceof GlobSync)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0
  while (typeof pattern[n] === 'string') {
    n ++
  }
  // now n is the index of the first one that is *not* a string.

  // See if there's anything else
  var prefix
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index)
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/')
      break
  }

  var remain = pattern.slice(n)

  // get the list of entries.
  var read
  if (prefix === null)
    read = '.'
  else if (isAbsolute(prefix) || isAbsolute(pattern.join('/'))) {
    if (!prefix || !isAbsolute(prefix))
      prefix = '/' + prefix
    read = prefix
  } else
    read = prefix

  var abs = this._makeAbs(read)

  //if ignored, skip processing
  if (childrenIgnored(this, read))
    return

  var isGlobStar = remain[0] === minimatch.GLOBSTAR
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar)
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar)
}


GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
  var entries = this._readdir(abs, inGlobStar)

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0]
  var negate = !!this.minimatch.negate
  var rawGlob = pn._glob
  var dotOk = this.dot || rawGlob.charAt(0) === '.'

  var matchedEntries = []
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    if (e.charAt(0) !== '.' || dotOk) {
      var m
      if (negate && !prefix) {
        m = !e.match(pn)
      } else {
        m = e.match(pn)
      }
      if (m)
        matchedEntries.push(e)
    }
  }

  var len = matchedEntries.length
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null)

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i]
      if (prefix) {
        if (prefix.slice(-1) !== '/')
          e = prefix + '/' + e
        else
          e = prefix + e
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path.join(this.root, e)
      }
      this.matches[index][e] = true
    }
    // This was the last one, and no stats were needed
    return
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift()
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i]
    var newPattern
    if (prefix)
      newPattern = [prefix, e]
    else
      newPattern = [e]
    this._process(newPattern.concat(remain), index, inGlobStar)
  }
}


GlobSync.prototype._emitMatch = function (index, e) {
  var abs = this._makeAbs(e)
  if (this.mark)
    e = this._mark(e)

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[this._makeAbs(e)]
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true
  if (this.stat)
    this._stat(e)
}


GlobSync.prototype._readdirInGlobStar = function (abs) {
  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false)

  var entries
  var lstat
  var stat
  try {
    lstat = fs.lstatSync(abs)
  } catch (er) {
    // lstat failed, doesn't exist
    return null
  }

  var isSym = lstat.isSymbolicLink()
  this.symlinks[abs] = isSym

  // If it's not a symlink or a dir, then it's definitely a regular file.
  // don't bother doing a readdir in that case.
  if (!isSym && !lstat.isDirectory())
    this.cache[abs] = 'FILE'
  else
    entries = this._readdir(abs, false)

  return entries
}

GlobSync.prototype._readdir = function (abs, inGlobStar) {
  var entries

  if (inGlobStar && !ownProp(this.symlinks, abs))
    return this._readdirInGlobStar(abs)

  if (ownProp(this.cache, abs)) {
    var c = this.cache[abs]
    if (!c || c === 'FILE')
      return null

    if (Array.isArray(c))
      return c
  }

  try {
    return this._readdirEntries(abs, fs.readdirSync(abs))
  } catch (er) {
    this._readdirError(abs, er)
    return null
  }
}

GlobSync.prototype._readdirEntries = function (abs, entries) {
  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i]
      if (abs === '/')
        e = abs + e
      else
        e = abs + '/' + e
      this.cache[e] = true
    }
  }

  this.cache[abs] = entries

  // mark and cache dir-ness
  return entries
}

GlobSync.prototype._readdirError = function (f, er) {
  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTDIR': // totally normal. means it *does* exist.
      this.cache[this._makeAbs(f)] = 'FILE'
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false
      if (this.strict)
        throw er
      if (!this.silent)
        console.error('glob error', er)
      break
  }
}

GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

  var entries = this._readdir(abs, inGlobStar)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1)
  var gspref = prefix ? [ prefix ] : []
  var noGlobStar = gspref.concat(remainWithoutGlobStar)

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false)

  var len = entries.length
  var isSym = this.symlinks[abs]

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return

  for (var i = 0; i < len; i++) {
    var e = entries[i]
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar)
    this._process(instead, index, true)

    var below = gspref.concat(entries[i], remain)
    this._process(below, index, true)
  }
}

GlobSync.prototype._processSimple = function (prefix, index) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var exists = this._stat(prefix)

  if (!this.matches[index])
    this.matches[index] = Object.create(null)

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return

  if (prefix && isAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix)
    if (prefix.charAt(0) === '/') {
      prefix = path.join(this.root, prefix)
    } else {
      prefix = path.resolve(this.root, prefix)
      if (trail)
        prefix += '/'
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/')

  // Mark this as a match
  this.matches[index][prefix] = true
}

// Returns either 'DIR', 'FILE', or false
GlobSync.prototype._stat = function (f) {
  var abs = this._makeAbs(f)
  var needDir = f.slice(-1) === '/'

  if (f.length > this.maxLength)
    return false

  if (!this.stat && ownProp(this.cache, abs)) {
    var c = this.cache[abs]

    if (Array.isArray(c))
      c = 'DIR'

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return c

    if (needDir && c === 'FILE')
      return false

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }

  var exists
  var stat = this.statCache[abs]
  if (!stat) {
    var lstat
    try {
      lstat = fs.lstatSync(abs)
    } catch (er) {
      return false
    }

    if (lstat.isSymbolicLink()) {
      try {
        stat = fs.statSync(abs)
      } catch (er) {
        stat = lstat
      }
    } else {
      stat = lstat
    }
  }

  this.statCache[abs] = stat

  var c = stat.isDirectory() ? 'DIR' : 'FILE'
  this.cache[abs] = this.cache[abs] || c

  if (needDir && c !== 'DIR')
    return false

  return c
}

GlobSync.prototype._mark = function (p) {
  return common.mark(this, p)
}

GlobSync.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
}

}).call(this,require('_process'))
},{"./common.js":60,"./glob.js":61,"_process":12,"assert":3,"fs":2,"minimatch":65,"path":11,"path-is-absolute":71,"util":19}],73:[function(require,module,exports){
'use strict';

var jju = require('jju');

function parse(text, reviver) {
    try {
        return JSON.parse(text, reviver);
    } catch (err) {
        // we expect this to throw with a more informative message
        jju.parse(text, {
            mode: 'json',
            reviver: reviver
        });

        // backup if jju is not as strict as JSON.parse; re-throw error
        // data-dependent code path, I do not know how to cover it
        throw err;
    }
}

exports.parse = parse;

},{"jju":74}],74:[function(require,module,exports){

module.exports.__defineGetter__('parse', function() {
	return require('./lib/parse').parse
})

module.exports.__defineGetter__('stringify', function() {
	return require('./lib/stringify').stringify
})

module.exports.__defineGetter__('tokenize', function() {
	return require('./lib/parse').tokenize
})

module.exports.__defineGetter__('update', function() {
	return require('./lib/document').update
})

module.exports.__defineGetter__('analyze', function() {
	return require('./lib/analyze').analyze
})

module.exports.__defineGetter__('utils', function() {
	return require('./lib/utils')
})

/**package
{ "name": "jju",
  "version": "0.0.0",
  "dependencies": {"js-yaml": "*"},
  "scripts": {"postinstall": "js-yaml package.yaml > package.json ; npm install"}
}
**/

},{"./lib/analyze":75,"./lib/document":76,"./lib/parse":77,"./lib/stringify":78,"./lib/utils":80}],75:[function(require,module,exports){
/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/jju
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var tokenize = require('./parse').tokenize

module.exports.analyze = function analyzeJSON(input, options) {
  if (options == null) options = {}

  if (!Array.isArray(input)) {
    input = tokenize(input, options)
  }

  var result = {
    has_whitespace: false,
    has_comments: false,
    has_newlines: false,
    has_trailing_comma: false,
    indent: '',
    newline: '\n',
    quote: '"',
    quote_keys: true,
  }

  var stats = {
    indent: {},
    newline: {},
    quote: {},
  }

  for (var i=0; i<input.length; i++) {
    if (input[i].type === 'newline') {
      if (input[i+1] && input[i+1].type === 'whitespace') {
        if (input[i+1].raw[0] === '\t') {
          // if first is tab, then indent is tab
          stats.indent['\t'] = (stats.indent['\t'] || 0) + 1
        }
        if (input[i+1].raw.match(/^\x20+$/)) {
          // if all are spaces, then indent is space
          // this can fail with mixed indent (4, 2 would display 3)
          var ws_len = input[i+1].raw.length
          var indent_len = input[i+1].stack.length + 1
          if (ws_len % indent_len === 0) {
            var t = Array(ws_len / indent_len + 1).join(' ')
            stats.indent[t] = (stats.indent[t] || 0) + 1
          }
        }
      }

      stats.newline[input[i].raw] = (stats.newline[input[i].raw] || 0) + 1
    }

    if (input[i].type === 'newline') {
      result.has_newlines = true
    }
    if (input[i].type === 'whitespace') {
      result.has_whitespace = true
    }
    if (input[i].type === 'comment') {
      result.has_comments = true
    }
    if (input[i].type === 'key') {
      if (input[i].raw[0] !== '"' && input[i].raw[0] !== "'") result.quote_keys = false
    }

    if (input[i].type === 'key' || input[i].type === 'literal') {
      if (input[i].raw[0] === '"' || input[i].raw[0] === "'") {
        stats.quote[input[i].raw[0]] = (stats.quote[input[i].raw[0]] || 0) + 1
      }
    }

    if (input[i].type === 'separator' && input[i].raw === ',') {
      for (var j=i+1; j<input.length; j++) {
        if (input[j].type === 'literal' || input[j].type === 'key') break
        if (input[j].type === 'separator') result.has_trailing_comma = true
      }
    }
  }

  for (var k in stats) {
    if (Object.keys(stats[k]).length) {
      result[k] = Object.keys(stats[k]).reduce(function(a, b) {
        return stats[k][a] > stats[k][b] ? a : b
      })
    }
  }

  return result
}


},{"./parse":77}],76:[function(require,module,exports){
/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/jju
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var assert = require('assert')
var tokenize = require('./parse').tokenize
var stringify = require('./stringify').stringify
var analyze = require('./analyze').analyze

function isObject(x) {
  return typeof(x) === 'object' && x !== null
}

function value_to_tokenlist(value, stack, options, is_key, indent) {
  options = Object.create(options)
  options._stringify_key = !!is_key

  if (indent) {
    options._prefix = indent.prefix.map(function(x) {
      return x.raw
    }).join('')
  }

  if (options._splitMin == null) options._splitMin = 0
  if (options._splitMax == null) options._splitMax = 0

  var stringified = stringify(value, options)

  if (is_key) {
    return [ { raw: stringified, type: 'key', stack: stack, value: value } ]
  }

  options._addstack = stack
  var result = tokenize(stringified, {
    _addstack: stack,
  })
  result.data = null
  return result
}

// '1.2.3' -> ['1','2','3']
function arg_to_path(path) {
  // array indexes
  if (typeof(path) === 'number') path = String(path)

  if (path === '') path = []
  if (typeof(path) === 'string') path = path.split('.')

  if (!Array.isArray(path)) throw Error('Invalid path type, string or array expected')
  return path
}

// returns new [begin, end] or false if not found
//
//          {x:3, xxx: 111, y: [111,  {q: 1, e: 2}  ,333]  }
// f('y',0) returns this       B^^^^^^^^^^^^^^^^^^^^^^^^E
// then f('1',1) would reduce it to   B^^^^^^^^^^E
function find_element_in_tokenlist(element, lvl, tokens, begin, end) {
  while(tokens[begin].stack[lvl] != element) {
    if (begin++ >= end) return false
  }
  while(tokens[end].stack[lvl] != element) {
    if (end-- < begin) return false
  }
  return [begin, end]
}

function is_whitespace(token_type) {
  return token_type === 'whitespace'
      || token_type === 'newline'
      || token_type === 'comment'
}

function find_first_non_ws_token(tokens, begin, end) {
  while(is_whitespace(tokens[begin].type)) {
    if (begin++ >= end) return false
  }
  return begin
}

function find_last_non_ws_token(tokens, begin, end) {
  while(is_whitespace(tokens[end].type)) {
    if (end-- < begin) return false
  }
  return end
}

/*
 * when appending a new element of an object/array, we are trying to
 * figure out the style used on the previous element
 *
 * return {prefix, sep1, sep2, suffix}
 *
 *      '    "key" :  "element"    \r\n'
 * prefix^^^^ sep1^ ^^sep2     ^^^^^^^^suffix
 *
 * begin - the beginning of the object/array
 * end - last token of the last element (value or comma usually)
 */
function detect_indent_style(tokens, is_array, begin, end, level) {
  var result = {
    sep1: [],
    sep2: [],
    suffix: [],
    prefix: [],
    newline: [],
  }

  if (tokens[end].type === 'separator' && tokens[end].stack.length !== level+1 && tokens[end].raw !== ',') {
    // either a beginning of the array (no last element) or other weird situation
    //
    // just return defaults
    return result
  }

  //                              ' "key"  : "value"  ,'
  // skipping last separator, we're now here        ^^
  if (tokens[end].type === 'separator')
    end = find_last_non_ws_token(tokens, begin, end - 1)
  if (end === false) return result

  //                              ' "key"  : "value"  ,'
  // skipping value                          ^^^^^^^
  while(tokens[end].stack.length > level) end--

  if (!is_array) {
    while(is_whitespace(tokens[end].type)) {
      if (end < begin) return result
      if (tokens[end].type === 'whitespace') {
        result.sep2.unshift(tokens[end])
      } else {
        // newline, comment or other unrecognized codestyle
        return result
      }
      end--
    }

    //                              ' "key"  : "value"  ,'
    // skipping separator                    ^
    assert.equal(tokens[end].type, 'separator')
    assert.equal(tokens[end].raw, ':')
    while(is_whitespace(tokens[--end].type)) {
      if (end < begin) return result
      if (tokens[end].type === 'whitespace') {
        result.sep1.unshift(tokens[end])
      } else {
        // newline, comment or other unrecognized codestyle
        return result
      }
    }

    assert.equal(tokens[end].type, 'key')
    end--
  }

  //                              ' "key"  : "value"  ,'
  // skipping key                   ^^^^^
  while(is_whitespace(tokens[end].type)) {
    if (end < begin) return result
    if (tokens[end].type === 'whitespace') {
      result.prefix.unshift(tokens[end])
    } else if (tokens[end].type === 'newline') {
      result.newline.unshift(tokens[end])
      return result
    } else {
      // comment or other unrecognized codestyle
      return result
    }
    end--
  }

  return result
}

function Document(text, options) {
  var self = Object.create(Document.prototype)

  if (options == null) options = {}
  //options._structure = true
  var tokens = self._tokens = tokenize(text, options)
  self._data = tokens.data
  tokens.data = null
  self._options = options

  var stats = analyze(text, options)
  if (options.indent == null) {
    options.indent = stats.indent
  }
  if (options.quote == null) {
    options.quote = stats.quote
  }
  if (options.quote_keys == null) {
    options.quote_keys = stats.quote_keys
  }
  if (options.no_trailing_comma == null) {
    options.no_trailing_comma = !stats.has_trailing_comma
  }
  return self
}

// return true if it's a proper object
//        throw otherwise
function check_if_can_be_placed(key, object, is_unset) {
  //if (object == null) return false
  function error(add) {
    return Error("You can't " + (is_unset ? 'unset' : 'set') + " key '" + key + "'" + add)
  }

  if (!isObject(object)) {
    throw error(' of an non-object')
  }
  if (Array.isArray(object)) {
    // array, check boundary
    if (String(key).match(/^\d+$/)) {
      key = Number(String(key))
      if (object.length < key || (is_unset && object.length === key)) {
        throw error(', out of bounds')
      } else if (is_unset && object.length !== key+1) {
        throw error(' in the middle of an array')
      } else {
        return true
      }
    } else {
      throw error(' of an array')
    }
  } else {
    // object
    return true
  }
}

// usage: document.set('path.to.something', 'value')
//    or: document.set(['path','to','something'], 'value')
Document.prototype.set = function(path, value) {
  path = arg_to_path(path)

  // updating this._data and check for errors
  if (path.length === 0) {
    if (value === undefined) throw Error("can't remove root document")
    this._data = value
    var new_key = false

  } else {
    var data = this._data

    for (var i=0; i<path.length-1; i++) {
      check_if_can_be_placed(path[i], data, false)
      data = data[path[i]]
    }
    if (i === path.length-1) {
      check_if_can_be_placed(path[i], data, value === undefined)
    }

    var new_key = !(path[i] in data)

    if (value === undefined) {
      if (Array.isArray(data)) {
        data.pop()
      } else {
        delete data[path[i]]
      }
    } else {
      data[path[i]] = value
    }
  }

  // for inserting document
  if (!this._tokens.length)
    this._tokens = [ { raw: '', type: 'literal', stack: [], value: undefined } ]

  var position = [
    find_first_non_ws_token(this._tokens, 0, this._tokens.length - 1),
    find_last_non_ws_token(this._tokens, 0, this._tokens.length - 1),
  ]
  for (var i=0; i<path.length-1; i++) {
    position = find_element_in_tokenlist(path[i], i, this._tokens, position[0], position[1])
    if (position == false) throw Error('internal error, please report this')
  }
  // assume that i == path.length-1 here

  if (path.length === 0) {
    var newtokens = value_to_tokenlist(value, path, this._options)
    // all good

  } else if (!new_key) {
    // replace old value with a new one (or deleting something)
    var pos_old = position
    position = find_element_in_tokenlist(path[i], i, this._tokens, position[0], position[1])

    if (value === undefined && position !== false) {
      // deleting element (position !== false ensures there's something)
      var newtokens = []

      if (!Array.isArray(data)) {
        // removing element from an object, `{x:1, key:CURRENT} -> {x:1}`
        // removing sep, literal and optional sep
        // ':'
        var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1)
        assert.equal(this._tokens[pos2].type, 'separator')
        assert.equal(this._tokens[pos2].raw, ':')
        position[0] = pos2

        // key
        var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1)
        assert.equal(this._tokens[pos2].type, 'key')
        assert.equal(this._tokens[pos2].value, path[path.length-1])
        position[0] = pos2
      }

      // removing comma in arrays and objects
      var pos2 = find_last_non_ws_token(this._tokens, pos_old[0], position[0] - 1)
      assert.equal(this._tokens[pos2].type, 'separator')
      if (this._tokens[pos2].raw === ',') {
        position[0] = pos2
      } else {
        // beginning of the array/object, so we should remove trailing comma instead
        pos2 = find_first_non_ws_token(this._tokens, position[1] + 1, pos_old[1])
        assert.equal(this._tokens[pos2].type, 'separator')
        if (this._tokens[pos2].raw === ',') {
          position[1] = pos2
        }
      }

    } else {
      var indent = pos2 !== false
                 ? detect_indent_style(this._tokens, Array.isArray(data), pos_old[0], position[1] - 1, i)
                 : {}
      var newtokens = value_to_tokenlist(value, path, this._options, false, indent)
    }

  } else {
    // insert new key, that's tricky
    var path_1 = path.slice(0, i)

    //  find a last separator after which we're inserting it
    var pos2 = find_last_non_ws_token(this._tokens, position[0] + 1, position[1] - 1)
    assert(pos2 !== false)

    var indent = pos2 !== false
               ? detect_indent_style(this._tokens, Array.isArray(data), position[0] + 1, pos2, i)
               : {}

    var newtokens = value_to_tokenlist(value, path, this._options, false, indent)

    // adding leading whitespaces according to detected codestyle
    var prefix = []
    if (indent.newline && indent.newline.length)
      prefix = prefix.concat(indent.newline)
    if (indent.prefix && indent.prefix.length)
      prefix = prefix.concat(indent.prefix)

    // adding '"key":' (as in "key":"value") to object values
    if (!Array.isArray(data)) {
      prefix = prefix.concat(value_to_tokenlist(path[path.length-1], path_1, this._options, true))
      if (indent.sep1 && indent.sep1.length)
        prefix = prefix.concat(indent.sep1)
      prefix.push({raw: ':', type: 'separator', stack: path_1})
      if (indent.sep2 && indent.sep2.length)
        prefix = prefix.concat(indent.sep2)
    }

    newtokens.unshift.apply(newtokens, prefix)

    // check if prev token is a separator AND they're at the same level
    if (this._tokens[pos2].type === 'separator' && this._tokens[pos2].stack.length === path.length-1) {
      // previous token is either , or [ or {
      if (this._tokens[pos2].raw === ',') {
        // restore ending comma
        newtokens.push({raw: ',', type: 'separator', stack: path_1})
      }
    } else {
      // previous token isn't a separator, so need to insert one
      newtokens.unshift({raw: ',', type: 'separator', stack: path_1})
    }

    if (indent.suffix && indent.suffix.length)
      newtokens.push.apply(newtokens, indent.suffix)

    assert.equal(this._tokens[position[1]].type, 'separator')
    position[0] = pos2+1
    position[1] = pos2
  }

  newtokens.unshift(position[1] - position[0] + 1)
  newtokens.unshift(position[0])
  this._tokens.splice.apply(this._tokens, newtokens)

  return this
}

// convenience method
Document.prototype.unset = function(path) {
  return this.set(path, undefined)
}

Document.prototype.get = function(path) {
  path = arg_to_path(path)

  var data = this._data
  for (var i=0; i<path.length; i++) {
    if (!isObject(data)) return undefined
    data = data[path[i]]
  }
  return data
}

Document.prototype.has = function(path) {
  path = arg_to_path(path)

  var data = this._data
  for (var i=0; i<path.length; i++) {
    if (!isObject(data)) return false
    data = data[path[i]]
  }
  return data !== undefined
}

// compare old object and new one, and change differences only
Document.prototype.update = function(value) {
  var self = this
  change([], self._data, value)
  return self

  function change(path, old_data, new_data) {
    if (!isObject(new_data) || !isObject(old_data)) {
      // if source or dest is primitive, just replace
      if (new_data !== old_data)
        self.set(path, new_data)

    } else if (Array.isArray(new_data) != Array.isArray(old_data)) {
      // old data is an array XOR new data is an array, replace as well
      self.set(path, new_data)

    } else if (Array.isArray(new_data)) {
      // both values are arrays here

      if (new_data.length > old_data.length) {
        // adding new elements, so going forward
        for (var i=0; i<new_data.length; i++) {
          path.push(String(i))
          change(path, old_data[i], new_data[i])
          path.pop()
        }

      } else {
        // removing something, so going backward
        for (var i=old_data.length-1; i>=0; i--) {
          path.push(String(i))
          change(path, old_data[i], new_data[i])
          path.pop()
        }
      }

    } else {
      // both values are objects here
      for (var i in new_data) {
        path.push(String(i))
        change(path, old_data[i], new_data[i])
        path.pop()
      }

      for (var i in old_data) {
        if (i in new_data) continue
        path.push(String(i))
        change(path, old_data[i], new_data[i])
        path.pop()
      }
    }
  }
}

Document.prototype.toString = function() {
  return this._tokens.map(function(x) {
    return x.raw
  }).join('')
}

module.exports.Document = Document

module.exports.update = function updateJSON(source, new_value, options) {
  return Document(source, options).update(new_value).toString()
}


},{"./analyze":75,"./parse":77,"./stringify":78,"assert":3}],77:[function(require,module,exports){
/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/jju
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

// RTFM: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf

var Uni = require('./unicode')

function isHexDigit(x) {
  return (x >= '0' && x <= '9')
      || (x >= 'A' && x <= 'F')
      || (x >= 'a' && x <= 'f')
}

function isOctDigit(x) {
  return x >= '0' && x <= '7'
}

function isDecDigit(x) {
  return x >= '0' && x <= '9'
}

var unescapeMap = {
  '\'': '\'',
  '"' : '"',
  '\\': '\\',
  'b' : '\b',
  'f' : '\f',
  'n' : '\n',
  'r' : '\r',
  't' : '\t',
  'v' : '\v',
  '/' : '/',
}

function formatError(input, msg, position, lineno, column, json5) {
  var result = msg + ' at ' + (lineno + 1) + ':' + (column + 1)
    , tmppos = position - column - 1
    , srcline = ''
    , underline = ''

  var isLineTerminator = json5 ? Uni.isLineTerminator : Uni.isLineTerminatorJSON

  // output no more than 70 characters before the wrong ones
  if (tmppos < position - 70) {
    tmppos = position - 70
  }

  while (1) {
    var chr = input[++tmppos]

    if (isLineTerminator(chr) || tmppos === input.length) {
      if (position >= tmppos) {
        // ending line error, so show it after the last char
        underline += '^'
      }
      break
    }
    srcline += chr

    if (position === tmppos) {
      underline += '^'
    } else if (position > tmppos) {
      underline += input[tmppos] === '\t' ? '\t' : ' '
    }

    // output no more than 78 characters on the string
    if (srcline.length > 78) break
  }

  return result + '\n' + srcline + '\n' + underline
}

function parse(input, options) {
  // parse as a standard JSON mode
  var json5 = !(options.mode === 'json' || options.legacy)
  var isLineTerminator = json5 ? Uni.isLineTerminator : Uni.isLineTerminatorJSON
  var isWhiteSpace = json5 ? Uni.isWhiteSpace : Uni.isWhiteSpaceJSON

  var length = input.length
    , lineno = 0
    , linestart = 0
    , position = 0
    , stack = []

  var tokenStart = function() {}
  var tokenEnd = function(v) {return v}

  /* tokenize({
       raw: '...',
       type: 'whitespace'|'comment'|'key'|'literal'|'separator'|'newline',
       value: 'number'|'string'|'whatever',
       path: [...],
     })
  */
  if (options._tokenize) {
    ;(function() {
      var start = null
      tokenStart = function() {
        if (start !== null) throw Error('internal error, token overlap')
        start = position
      }

      tokenEnd = function(v, type) {
        if (start != position) {
          var hash = {
            raw: input.substr(start, position-start),
            type: type,
            stack: stack.slice(0),
          }
          if (v !== undefined) hash.value = v
          options._tokenize.call(null, hash)
        }
        start = null
        return v
      }
    })()
  }

  function fail(msg) {
    var column = position - linestart

    if (!msg) {
      if (position < length) {
        var token = '\'' +
          JSON
            .stringify(input[position])
            .replace(/^"|"$/g, '')
            .replace(/'/g, "\\'")
            .replace(/\\"/g, '"')
          + '\''

        if (!msg) msg = 'Unexpected token ' + token
      } else {
        if (!msg) msg = 'Unexpected end of input'
      }
    }

    var error = SyntaxError(formatError(input, msg, position, lineno, column, json5))
    error.row = lineno + 1
    error.column = column + 1
    throw error
  }

  function newline(chr) {
    // account for <cr><lf>
    if (chr === '\r' && input[position] === '\n') position++
    linestart = position
    lineno++
  }

  function parseGeneric() {
    var result

    while (position < length) {
      tokenStart()
      var chr = input[position++]

      if (chr === '"' || (chr === '\'' && json5)) {
        return tokenEnd(parseString(chr), 'literal')

      } else if (chr === '{') {
        tokenEnd(undefined, 'separator')
        return parseObject()

      } else if (chr === '[') {
        tokenEnd(undefined, 'separator')
        return parseArray()

      } else if (chr === '-'
             ||  chr === '.'
             ||  isDecDigit(chr)
                 //           + number       Infinity          NaN
             ||  (json5 && (chr === '+' || chr === 'I' || chr === 'N'))
      ) {
        return tokenEnd(parseNumber(), 'literal')

      } else if (chr === 'n') {
        parseKeyword('null')
        return tokenEnd(null, 'literal')

      } else if (chr === 't') {
        parseKeyword('true')
        return tokenEnd(true, 'literal')

      } else if (chr === 'f') {
        parseKeyword('false')
        return tokenEnd(false, 'literal')

      } else {
        position--
        return tokenEnd(undefined)
      }
    }
  }

  function parseKey() {
    var result

    while (position < length) {
      tokenStart()
      var chr = input[position++]

      if (chr === '"' || (chr === '\'' && json5)) {
        return tokenEnd(parseString(chr), 'key')

      } else if (chr === '{') {
        tokenEnd(undefined, 'separator')
        return parseObject()

      } else if (chr === '[') {
        tokenEnd(undefined, 'separator')
        return parseArray()

      } else if (chr === '.'
             ||  isDecDigit(chr)
      ) {
        return tokenEnd(parseNumber(true), 'key')

      } else if (json5
             &&  Uni.isIdentifierStart(chr) || (chr === '\\' && input[position] === 'u')) {
        // unicode char or a unicode sequence
        var rollback = position - 1
        var result = parseIdentifier()

        if (result === undefined) {
          position = rollback
          return tokenEnd(undefined)
        } else {
          return tokenEnd(result, 'key')
        }

      } else {
        position--
        return tokenEnd(undefined)
      }
    }
  }

  function skipWhiteSpace() {
    tokenStart()
    while (position < length) {
      var chr = input[position++]

      if (isLineTerminator(chr)) {
        position--
        tokenEnd(undefined, 'whitespace')
        tokenStart()
        position++
        newline(chr)
        tokenEnd(undefined, 'newline')
        tokenStart()

      } else if (isWhiteSpace(chr)) {
        // nothing

      } else if (chr === '/'
             && json5
             && (input[position] === '/' || input[position] === '*')
      ) {
        position--
        tokenEnd(undefined, 'whitespace')
        tokenStart()
        position++
        skipComment(input[position++] === '*')
        tokenEnd(undefined, 'comment')
        tokenStart()

      } else {
        position--
        break
      }
    }
    return tokenEnd(undefined, 'whitespace')
  }

  function skipComment(multi) {
    while (position < length) {
      var chr = input[position++]

      if (isLineTerminator(chr)) {
        // LineTerminator is an end of singleline comment
        if (!multi) {
          // let parent function deal with newline
          position--
          return
        }

        newline(chr)

      } else if (chr === '*' && multi) {
        // end of multiline comment
        if (input[position] === '/') {
          position++
          return
        }

      } else {
        // nothing
      }
    }

    if (multi) {
      fail('Unclosed multiline comment')
    }
  }

  function parseKeyword(keyword) {
    // keyword[0] is not checked because it should've checked earlier
    var _pos = position
    var len = keyword.length
    for (var i=1; i<len; i++) {
      if (position >= length || keyword[i] != input[position]) {
        position = _pos-1
        fail()
      }
      position++
    }
  }

  function parseObject() {
    var result = options.null_prototype ? Object.create(null) : {}
      , empty_object = {}
      , is_non_empty = false

    while (position < length) {
      skipWhiteSpace()
      var item1 = parseKey()
      skipWhiteSpace()
      tokenStart()
      var chr = input[position++]
      tokenEnd(undefined, 'separator')

      if (chr === '}' && item1 === undefined) {
        if (!json5 && is_non_empty) {
          position--
          fail('Trailing comma in object')
        }
        return result

      } else if (chr === ':' && item1 !== undefined) {
        skipWhiteSpace()
        stack.push(item1)
        var item2 = parseGeneric()
        stack.pop()

        if (item2 === undefined) fail('No value found for key ' + item1)
        if (typeof(item1) !== 'string') {
          if (!json5 || typeof(item1) !== 'number') {
            fail('Wrong key type: ' + item1)
          }
        }

        if ((item1 in empty_object || empty_object[item1] != null) && options.reserved_keys !== 'replace') {
          if (options.reserved_keys === 'throw') {
            fail('Reserved key: ' + item1)
          } else {
            // silently ignore it
          }
        } else {
          if (typeof(options.reviver) === 'function') {
            item2 = options.reviver.call(null, item1, item2)
          }

          if (item2 !== undefined) {
            is_non_empty = true
            Object.defineProperty(result, item1, {
              value: item2,
              enumerable: true,
              configurable: true,
              writable: true,
            })
          }
        }

        skipWhiteSpace()

        tokenStart()
        var chr = input[position++]
        tokenEnd(undefined, 'separator')

        if (chr === ',') {
          continue

        } else if (chr === '}') {
          return result

        } else {
          fail()
        }

      } else {
        position--
        fail()
      }
    }

    fail()
  }

  function parseArray() {
    var result = []

    while (position < length) {
      skipWhiteSpace()
      stack.push(result.length)
      var item = parseGeneric()
      stack.pop()
      skipWhiteSpace()
      tokenStart()
      var chr = input[position++]
      tokenEnd(undefined, 'separator')

      if (item !== undefined) {
        if (typeof(options.reviver) === 'function') {
          item = options.reviver.call(null, String(result.length), item)
        }
        if (item === undefined) {
          result.length++
          item = true // hack for check below, not included into result
        } else {
          result.push(item)
        }
      }

      if (chr === ',') {
        if (item === undefined) {
          fail('Elisions are not supported')
        }

      } else if (chr === ']') {
        if (!json5 && item === undefined && result.length) {
          position--
          fail('Trailing comma in array')
        }
        return result

      } else {
        position--
        fail()
      }
    }
  }

  function parseNumber() {
    // rewind because we don't know first char
    position--

    var start = position
      , chr = input[position++]
      , t

    var to_num = function(is_octal) {
      var str = input.substr(start, position - start)

      if (is_octal) {
        var result = parseInt(str.replace(/^0o?/, ''), 8)
      } else {
        var result = Number(str)
      }

      if (Number.isNaN(result)) {
        position--
        fail('Bad numeric literal - "' + input.substr(start, position - start + 1) + '"')
      } else if (!json5 && !str.match(/^-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-]?[0-9]+)?$/i)) {
        // additional restrictions imposed by json
        position--
        fail('Non-json numeric literal - "' + input.substr(start, position - start + 1) + '"')
      } else {
        return result
      }
    }

    // ex: -5982475.249875e+29384
    //     ^ skipping this
    if (chr === '-' || (chr === '+' && json5)) chr = input[position++]

    if (chr === 'N' && json5) {
      parseKeyword('NaN')
      return NaN
    }

    if (chr === 'I' && json5) {
      parseKeyword('Infinity')

      // returning +inf or -inf
      return to_num()
    }

    if (chr >= '1' && chr <= '9') {
      // ex: -5982475.249875e+29384
      //        ^^^ skipping these
      while (position < length && isDecDigit(input[position])) position++
      chr = input[position++]
    }

    // special case for leading zero: 0.123456
    if (chr === '0') {
      chr = input[position++]

      //             new syntax, "0o777"           old syntax, "0777"
      var is_octal = chr === 'o' || chr === 'O' || isOctDigit(chr)
      var is_hex = chr === 'x' || chr === 'X'

      if (json5 && (is_octal || is_hex)) {
        while (position < length
           &&  (is_hex ? isHexDigit : isOctDigit)( input[position] )
        ) position++

        var sign = 1
        if (input[start] === '-') {
          sign = -1
          start++
        } else if (input[start] === '+') {
          start++
        }

        return sign * to_num(is_octal)
      }
    }

    if (chr === '.') {
      // ex: -5982475.249875e+29384
      //                ^^^ skipping these
      while (position < length && isDecDigit(input[position])) position++
      chr = input[position++]
    }

    if (chr === 'e' || chr === 'E') {
      chr = input[position++]
      if (chr === '-' || chr === '+') position++
      // ex: -5982475.249875e+29384
      //                       ^^^ skipping these
      while (position < length && isDecDigit(input[position])) position++
      chr = input[position++]
    }

    // we have char in the buffer, so count for it
    position--
    return to_num()
  }

  function parseIdentifier() {
    // rewind because we don't know first char
    position--

    var result = ''

    while (position < length) {
      var chr = input[position++]

      if (chr === '\\'
      &&  input[position] === 'u'
      &&  isHexDigit(input[position+1])
      &&  isHexDigit(input[position+2])
      &&  isHexDigit(input[position+3])
      &&  isHexDigit(input[position+4])
      ) {
        // UnicodeEscapeSequence
        chr = String.fromCharCode(parseInt(input.substr(position+1, 4), 16))
        position += 5
      }

      if (result.length) {
        // identifier started
        if (Uni.isIdentifierPart(chr)) {
          result += chr
        } else {
          position--
          return result
        }

      } else {
        if (Uni.isIdentifierStart(chr)) {
          result += chr
        } else {
          return undefined
        }
      }
    }

    fail()
  }

  function parseString(endChar) {
    // 7.8.4 of ES262 spec
    var result = ''

    while (position < length) {
      var chr = input[position++]

      if (chr === endChar) {
        return result

      } else if (chr === '\\') {
        if (position >= length) fail()
        chr = input[position++]

        if (unescapeMap[chr] && (json5 || (chr != 'v' && chr != "'"))) {
          result += unescapeMap[chr]

        } else if (json5 && isLineTerminator(chr)) {
          // line continuation
          newline(chr)

        } else if (chr === 'u' || (chr === 'x' && json5)) {
          // unicode/character escape sequence
          var off = chr === 'u' ? 4 : 2

          // validation for \uXXXX
          for (var i=0; i<off; i++) {
            if (position >= length) fail()
            if (!isHexDigit(input[position])) fail('Bad escape sequence')
            position++
          }

          result += String.fromCharCode(parseInt(input.substr(position-off, off), 16))
        } else if (json5 && isOctDigit(chr)) {
          if (chr < '4' && isOctDigit(input[position]) && isOctDigit(input[position+1])) {
            // three-digit octal
            var digits = 3
          } else if (isOctDigit(input[position])) {
            // two-digit octal
            var digits = 2
          } else {
            var digits = 1
          }
          position += digits - 1
          result += String.fromCharCode(parseInt(input.substr(position-digits, digits), 8))
          /*if (!isOctDigit(input[position])) {
            // \0 is allowed still
            result += '\0'
          } else {
            fail('Octal literals are not supported')
          }*/

        } else if (json5) {
          // \X -> x
          result += chr

        } else {
          position--
          fail()
        }

      } else if (isLineTerminator(chr)) {
        fail()

      } else {
        if (!json5 && chr.charCodeAt(0) < 32) {
          position--
          fail('Unexpected control character')
        }

        // SourceCharacter but not one of " or \ or LineTerminator
        result += chr
      }
    }

    fail()
  }

  skipWhiteSpace()
  var return_value = parseGeneric()
  if (return_value !== undefined || position < length) {
    skipWhiteSpace()

    if (position >= length) {
      if (typeof(options.reviver) === 'function') {
        return_value = options.reviver.call(null, '', return_value)
      }
      return return_value
    } else {
      fail()
    }

  } else {
    if (position) {
      fail('No data, only a whitespace')
    } else {
      fail('No data, empty input')
    }
  }
}

/*
 * parse(text, options)
 * or
 * parse(text, reviver)
 *
 * where:
 * text - string
 * options - object
 * reviver - function
 */
module.exports.parse = function parseJSON(input, options) {
  // support legacy functions
  if (typeof(options) === 'function') {
    options = {
      reviver: options
    }
  }

  if (input === undefined) {
    // parse(stringify(x)) should be equal x
    // with JSON functions it is not 'cause of undefined
    // so we're fixing it
    return undefined
  }

  // JSON.parse compat
  if (typeof(input) !== 'string') input = String(input)
  if (options == null) options = {}
  if (options.reserved_keys == null) options.reserved_keys = 'ignore'

  if (options.reserved_keys === 'throw' || options.reserved_keys === 'ignore') {
    if (options.null_prototype == null) {
      options.null_prototype = true
    }
  }

  try {
    return parse(input, options)
  } catch(err) {
    // jju is a recursive parser, so JSON.parse("{{{{{{{") could blow up the stack
    //
    // this catch is used to skip all those internal calls
    if (err instanceof SyntaxError && err.row != null && err.column != null) {
      var old_err = err
      err = SyntaxError(old_err.message)
      err.column = old_err.column
      err.row = old_err.row
    }
    throw err
  }
}

module.exports.tokenize = function tokenizeJSON(input, options) {
  if (options == null) options = {}

  options._tokenize = function(smth) {
    if (options._addstack) smth.stack.unshift.apply(smth.stack, options._addstack)
    tokens.push(smth)
  }

  var tokens = []
  tokens.data = module.exports.parse(input, options)
  return tokens
}


},{"./unicode":79}],78:[function(require,module,exports){
/*
 * Author: Alex Kocharin <alex@kocharin.ru>
 * GIT: https://github.com/rlidwka/jju
 * License: WTFPL, grab your copy here: http://www.wtfpl.net/txt/copying/
 */

var Uni = require('./unicode')

// Fix Function#name on browsers that do not support it (IE)
// http://stackoverflow.com/questions/6903762/function-name-not-supported-in-ie
if (!(function f(){}).name) {
  Object.defineProperty((function(){}).constructor.prototype, 'name', {
    get: function() {
      var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1]
      // For better performance only parse once, and then cache the
      // result through a new accessor for repeated access.
      Object.defineProperty(this, 'name', { value: name })
      return name
    }
  })
}

var special_chars = {
  0: '\\0', // this is not an octal literal
  8: '\\b',
  9: '\\t',
  10: '\\n',
  11: '\\v',
  12: '\\f',
  13: '\\r',
  92: '\\\\',
}

// for oddballs
var hasOwnProperty = Object.prototype.hasOwnProperty

// some people escape those, so I'd copy this to be safe
var escapable = /[\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/

function _stringify(object, options, recursiveLvl, currentKey) {
  var opt_json = options.mode === 'json'
  /*
   * Opinionated decision warning:
   *
   * Objects are serialized in the following form:
   * { type: 'Class', data: DATA }
   *
   * Class is supposed to be a function, and new Class(DATA) is
   * supposed to be equivalent to the original value
   */
  /*function custom_type() {
    return stringify({
      type: object.constructor.name,
      data: object.toString()
    })
  }*/

  // if add, it's an internal indentation, so we add 1 level and a eol
  // if !add, it's an ending indentation, so we just indent
  function indent(str, add) {
    var prefix = options._prefix ? options._prefix : ''
    if (!options.indent) return prefix + str
    var result = ''
    var count = recursiveLvl + (add || 0)
    for (var i=0; i<count; i++) result += options.indent
    return prefix + result + str + (add ? '\n' : '')
  }

  function _stringify_key(key) {
    if (options.quote_keys) return _stringify_str(key)
    if (String(Number(key)) == key && key[0] != '-') return key
    if (key == '') return _stringify_str(key)

    var result = ''
    for (var i=0; i<key.length; i++) {
      if (i > 0) {
        if (!Uni.isIdentifierPart(key[i]))
          return _stringify_str(key)

      } else {
        if (!Uni.isIdentifierStart(key[i]))
          return _stringify_str(key)
      }

      var chr = key.charCodeAt(i)

      if (options.ascii) {
        if (chr < 0x80) {
          result += key[i]

        } else {
          result += '\\u' + ('0000' + chr.toString(16)).slice(-4)
        }

      } else {
        if (escapable.exec(key[i])) {
          result += '\\u' + ('0000' + chr.toString(16)).slice(-4)

        } else {
          result += key[i]
        }
      }
    }

    return result
  }

  function _stringify_str(key) {
    var quote = options.quote
    var quoteChr = quote.charCodeAt(0)

    var result = ''
    for (var i=0; i<key.length; i++) {
      var chr = key.charCodeAt(i)

      if (chr < 0x10) {
        if (chr === 0 && !opt_json) {
          result += '\\0'
        } else if (chr >= 8 && chr <= 13 && (!opt_json || chr !== 11)) {
          result += special_chars[chr]
        } else if (!opt_json) {
          result += '\\x0' + chr.toString(16)
        } else {
          result += '\\u000' + chr.toString(16)
        }

      } else if (chr < 0x20) {
        if (!opt_json) {
          result += '\\x' + chr.toString(16)
        } else {
          result += '\\u00' + chr.toString(16)
        }

      } else if (chr >= 0x20 && chr < 0x80) {
        // ascii range
        if (chr === 47 && i && key[i-1] === '<') {
          // escaping slashes in </script>
          result += '\\' + key[i]

        } else if (chr === 92) {
          result += '\\\\'

        } else if (chr === quoteChr) {
          result += '\\' + quote

        } else {
          result += key[i]
        }

      } else if (options.ascii || Uni.isLineTerminator(key[i]) || escapable.exec(key[i])) {
        if (chr < 0x100) {
          if (!opt_json) {
            result += '\\x' + chr.toString(16)
          } else {
            result += '\\u00' + chr.toString(16)
          }

        } else if (chr < 0x1000) {
          result += '\\u0' + chr.toString(16)

        } else if (chr < 0x10000) {
          result += '\\u' + chr.toString(16)

        } else {
          throw Error('weird codepoint')
        }
      } else {
        result += key[i]
      }
    }
    return quote + result + quote
  }

  function _stringify_object() {
    if (object === null) return 'null'
    var result = []
      , len = 0
      , braces

    if (Array.isArray(object)) {
      braces = '[]'
      for (var i=0; i<object.length; i++) {
        var s = _stringify(object[i], options, recursiveLvl+1, String(i))
        if (s === undefined) s = 'null'
        len += s.length + 2
        result.push(s + ',')
      }

    } else {
      braces = '{}'
      var fn = function(key) {
        var t = _stringify(object[key], options, recursiveLvl+1, key)
        if (t !== undefined) {
          t = _stringify_key(key) + ':' + (options.indent ? ' ' : '') + t + ','
          len += t.length + 1
          result.push(t)
        }
      }

      if (Array.isArray(options.replacer)) {
        for (var i=0; i<options.replacer.length; i++)
          if (hasOwnProperty.call(object, options.replacer[i]))
            fn(options.replacer[i])
      } else {
        var keys = Object.keys(object)
        if (options.sort_keys)
          keys = keys.sort(typeof(options.sort_keys) === 'function'
                           ? options.sort_keys : undefined)
        keys.forEach(fn)
      }
    }

    // objects shorter than 30 characters are always inlined
    // objects longer than 60 characters are always splitted to multiple lines
    // anything in the middle depends on indentation level
    len -= 2
    if (options.indent && (len > options._splitMax - recursiveLvl * options.indent.length || len > options._splitMin) ) {
      // remove trailing comma in multiline if asked to
      if (options.no_trailing_comma && result.length) {
        result[result.length-1] = result[result.length-1].substring(0, result[result.length-1].length-1)
      }

      var innerStuff = result.map(function(x) {return indent(x, 1)}).join('')
      return braces[0]
          + (options.indent ? '\n' : '')
          + innerStuff
          + indent(braces[1])
    } else {
      // always remove trailing comma in one-lined arrays
      if (result.length) {
        result[result.length-1] = result[result.length-1].substring(0, result[result.length-1].length-1)
      }

      var innerStuff = result.join(options.indent ? ' ' : '')
      return braces[0]
          + innerStuff
          + braces[1]
    }
  }

  function _stringify_nonobject(object) {
    if (typeof(options.replacer) === 'function') {
      object = options.replacer.call(null, currentKey, object)
    }

    switch(typeof(object)) {
      case 'string':
        return _stringify_str(object)

      case 'number':
        if (object === 0 && 1/object < 0) {
          // Opinionated decision warning:
          //
          // I want cross-platform negative zero in all js engines
          // I know they're equal, but why lose that tiny bit of
          // information needlessly?
          return '-0'
        }
        if (options.mode === 'json' && !Number.isFinite(object)) {
          // json don't support infinity (= sucks)
          return 'null'
        }
        return object.toString()

      case 'boolean':
        return object.toString()

      case 'undefined':
        return undefined

      case 'function':
//        return custom_type()

      default:
        // fallback for something weird
        return JSON.stringify(object)
    }
  }

  if (options._stringify_key) {
    return _stringify_key(object)
  }

  if (typeof(object) === 'object') {
    if (object === null) return 'null'

    var str
    if (typeof(str = object.toJSON5) === 'function' && options.mode !== 'json') {
      object = str.call(object, currentKey)

    } else if (typeof(str = object.toJSON) === 'function') {
      object = str.call(object, currentKey)
    }

    if (object === null) return 'null'
    if (typeof(object) !== 'object') return _stringify_nonobject(object)

    if (object.constructor === Number || object.constructor === Boolean || object.constructor === String) {
      object = object.valueOf()
      return _stringify_nonobject(object)

    } else if (object.constructor === Date) {
      // only until we can't do better
      return _stringify_nonobject(object.toISOString())

    } else {
      if (typeof(options.replacer) === 'function') {
        object = options.replacer.call(null, currentKey, object)
        if (typeof(object) !== 'object') return _stringify_nonobject(object)
      }

      return _stringify_object(object)
    }
  } else {
    return _stringify_nonobject(object)
  }
}

/*
 * stringify(value, options)
 * or
 * stringify(value, replacer, space)
 *
 * where:
 * value - anything
 * options - object
 * replacer - function or array
 * space - boolean or number or string
 */
module.exports.stringify = function stringifyJSON(object, options, _space) {
  // support legacy syntax
  if (typeof(options) === 'function' || Array.isArray(options)) {
    options = {
      replacer: options
    }
  } else if (typeof(options) === 'object' && options !== null) {
    // nothing to do
  } else {
    options = {}
  }
  if (_space != null) options.indent = _space

  if (options.indent == null) options.indent = '\t'
  if (options.quote == null) options.quote = "'"
  if (options.ascii == null) options.ascii = false
  if (options.mode == null) options.mode = 'simple'

  if (options.mode === 'json') {
    // json only supports double quotes (= sucks)
    options.quote = '"'

    // json don't support trailing commas (= sucks)
    options.no_trailing_comma = true

    // json don't support unquoted property names (= sucks)
    options.quote_keys = true
  }

  // why would anyone use such objects?
  if (typeof(options.indent) === 'object') {
    if (options.indent.constructor === Number
    ||  options.indent.constructor === Boolean
    ||  options.indent.constructor === String)
      options.indent = options.indent.valueOf()
  }

  // gap is capped at 10 characters
  if (typeof(options.indent) === 'number') {
    if (options.indent >= 0) {
      options.indent = Array(Math.min(~~options.indent, 10) + 1).join(' ')
    } else {
      options.indent = false
    }
  } else if (typeof(options.indent) === 'string') {
    options.indent = options.indent.substr(0, 10)
  }

  if (options._splitMin == null) options._splitMin = 50
  if (options._splitMax == null) options._splitMax = 70

  return _stringify(object, options, 0, '')
}


},{"./unicode":79}],79:[function(require,module,exports){

// This is autogenerated with esprima tools, see:
// https://github.com/ariya/esprima/blob/master/esprima.js
//
// PS: oh God, I hate Unicode

// ECMAScript 5.1/Unicode v6.3.0 NonAsciiIdentifierStart:

var Uni = module.exports

module.exports.isWhiteSpace = function isWhiteSpace(x) {
  // section 7.2, table 2
  return x === '\u0020'
      || x === '\u00A0'
      || x === '\uFEFF' // <-- this is not a Unicode WS, only a JS one
      || (x >= '\u0009' && x <= '\u000D') // 9 A B C D

      // + whitespace characters from unicode, category Zs
      || x === '\u1680'
      || x === '\u180E'
      || (x >= '\u2000' && x <= '\u200A') // 0 1 2 3 4 5 6 7 8 9 A
      || x === '\u2028'
      || x === '\u2029'
      || x === '\u202F'
      || x === '\u205F'
      || x === '\u3000'
}

module.exports.isWhiteSpaceJSON = function isWhiteSpaceJSON(x) {
  return x === '\u0020'
      || x === '\u0009'
      || x === '\u000A'
      || x === '\u000D'
}

module.exports.isLineTerminator = function isLineTerminator(x) {
  // ok, here is the part when JSON is wrong
  // section 7.3, table 3
  return x === '\u000A'
      || x === '\u000D'
      || x === '\u2028'
      || x === '\u2029'
}

module.exports.isLineTerminatorJSON = function isLineTerminatorJSON(x) {
  return x === '\u000A'
      || x === '\u000D'
}

module.exports.isIdentifierStart = function isIdentifierStart(x) {
  return x === '$'
      || x === '_'
      || (x >= 'A' && x <= 'Z')
      || (x >= 'a' && x <= 'z')
      || (x >= '\u0080' && Uni.NonAsciiIdentifierStart.test(x))
}

module.exports.isIdentifierPart = function isIdentifierPart(x) {
  return x === '$'
      || x === '_'
      || (x >= 'A' && x <= 'Z')
      || (x >= 'a' && x <= 'z')
      || (x >= '0' && x <= '9') // <-- addition to Start
      || (x >= '\u0080' && Uni.NonAsciiIdentifierPart.test(x))
}

module.exports.NonAsciiIdentifierStart = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/

// ECMAScript 5.1/Unicode v6.3.0 NonAsciiIdentifierPart:

module.exports.NonAsciiIdentifierPart = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/

},{}],80:[function(require,module,exports){
var FS  = require('fs')
var jju = require('../')

// this function registers json5 extension, so you
// can do `require("./config.json5")` kind of thing
module.exports.register = function() {
  var r = require, e = 'extensions'
  r[e]['.json5'] = function(m, f) {
    /*eslint no-sync:0*/
    m.exports = jju.parse(FS.readFileSync(f, 'utf8'))
  }
}

// this function monkey-patches JSON.parse, so it
// will return an exact position of error in case
// of parse failure
module.exports.patch_JSON_parse = function() {
  var _parse = JSON.parse
  JSON.parse = function(text, rev) {
    try {
      return _parse(text, rev)
    } catch(err) {
      // this call should always throw
      require('jju').parse(text, {
        mode: 'json',
        legacy: true,
        reviver: rev,
        reserved_keys: 'replace',
        null_prototype: false,
      })

      // if it didn't throw, but original parser did,
      // this is an error in this library and should be reported
      throw err
    }
  }
}

// this function is an express/connect middleware
// that accepts uploads in application/json5 format
module.exports.middleware = function() {
  return function(req, res, next) {
    throw Error('this function is removed, use express-json5 instead')
  }
}


},{"../":74,"fs":2,"jju":74}],81:[function(require,module,exports){
module.exports=[
"http",
"events",
"util",
"domain",
"cluster",
"buffer",
"stream",
"crypto",
"tls",
"fs",
"string_decoder",
"path",
"net",
"dgram",
"dns",
"https",
"url",
"punycode",
"readline",
"repl",
"vm",
"child_process",
"assert",
"zlib",
"tty",
"os",
"querystring"
]

},{}],82:[function(require,module,exports){
module.exports = extractDescription

// Extracts description from contents of a readme file in markdown format
function extractDescription (d) {
  if (!d) return;
  if (d === "ERROR: No README data found!") return;
  // the first block of text before the first heading
  // that isn't the first line heading
  d = d.trim().split('\n')
  for (var s = 0; d[s] && d[s].trim().match(/^(#|$)/); s ++);
  var l = d.length
  for (var e = s + 1; e < l && d[e].trim(); e ++);
  return d.slice(s, e).join(' ').trim()
}

},{}],83:[function(require,module,exports){
var semver = require("semver")
var parseGitHubURL = require("github-url-from-git")
var depTypes = ["dependencies","devDependencies","optionalDependencies"]
var extractDescription = require("./extract_description")
var url = require("url")
var typos = require("./typos")
var coreModuleNames = require("./core_module_names")
var githubUserRepo = require("github-url-from-username-repo")

var fixer = module.exports = {
  // default warning function
  warn: function() {},

  fixRepositoryField: function(data) {
    if (data.repositories) {
      this.warn("repositories");
      data.repository = data.repositories[0]
    }
    if (!data.repository) return this.warn("missingRepository")
    if (typeof data.repository === "string") {
      data.repository = {
        type: "git",
        url: data.repository
      }
    }
    var r = data.repository.url || ""
    if (r) {
      var ghurl = parseGitHubURL(r)
      if (ghurl) {
        r = ghurl.replace(/^https?:\/\//, 'git://')
      } else if (githubUserRepo(r)) {
        // repo has 'user/reponame' filled in as repo
        data.repository.url = githubUserRepo(r)
      }
    }

    if (r.match(/github.com\/[^\/]+\/[^\/]+\.git\.git$/)) {
      this.warn("brokenGitUrl", r)
    }
  }

, fixTypos: function(data) {
    Object.keys(typos.topLevel).forEach(function (d) {
      if (data.hasOwnProperty(d)) {
        this.warn("typo", d, typos.topLevel[d])
      }
    }, this)
  }

, fixScriptsField: function(data) {
    if (!data.scripts) return
    if (typeof data.scripts !== "object") {
      this.warn("nonObjectScripts")
      delete data.scripts
    }
    Object.keys(data.scripts).forEach(function (k) {
      if (typeof data.scripts[k] !== "string") {
        this.warn("nonStringScript")
        delete data.scripts[k]
      } else if (typos.script[k]) {
        this.warn("typo", k, typos.script[k], "scripts")
      }
    }, this)
  }

, fixFilesField: function(data) {
    var files = data.files
    if (files && !Array.isArray(files)) {
      this.warn("nonArrayFiles")
      delete data.files
    } else if (data.files) {
      data.files = data.files.filter(function(file) {
        if (!file || typeof file !== "string") {
          this.warn("invalidFilename", file)
          return false
        } else {
          return true
        }
      }, this)
    }
  }

, fixBinField: function(data) {
    if (!data.bin) return;
    if (typeof data.bin === "string") {
      var b = {}
      b[data.name] = data.bin
      data.bin = b
    }
  }

, fixManField: function(data) {
    if (!data.man) return;
    if (typeof data.man === "string") {
      data.man = [ data.man ]
    }
  }
, fixBundleDependenciesField: function(data) {
    var bdd = "bundledDependencies"
    var bd = "bundleDependencies"
    if (data[bdd] && !data[bd]) {
      data[bd] = data[bdd]
      delete data[bdd]
    }
    if (data[bd] && !Array.isArray(data[bd])) {
      this.warn("nonArrayBundleDependencies")
      delete data[bd]
    } else if (data[bd]) {
      data[bd] = data[bd].filter(function(bd) {
        if (!bd || typeof bd !== 'string') {
          this.warn("nonStringBundleDependency", bd)
          return false
        } else {
          if (!data.dependencies) {
            data.dependencies = {}
          }
          if (!data.dependencies.hasOwnProperty(bd)) {
            this.warn("nonDependencyBundleDependency", bd)
            data.dependencies[bd] = "*"
          }
          return true
        }
      }, this)
    }
  }

, fixDependencies: function(data, strict) {
    var loose = !strict
    objectifyDeps(data, this.warn)
    addOptionalDepsToDeps(data, this.warn)
    this.fixBundleDependenciesField(data)

    ;['dependencies','devDependencies'].forEach(function(deps) {
      if (!(deps in data)) return
      if (!data[deps] || typeof data[deps] !== "object") {
        this.warn("nonObjectDependencies", deps)
        delete data[deps]
        return
      }
      Object.keys(data[deps]).forEach(function (d) {
        var r = data[deps][d]
        if (typeof r !== 'string') {
          this.warn("nonStringDependency", d, JSON.stringify(r))
          delete data[deps][d]
        }
        // "/" is not allowed as packagename for publishing, but for git-urls
        // normalize shorthand-urls
        if (githubUserRepo(data[deps][d])) {
          data[deps][d] = 'git+' + githubUserRepo(data[deps][d])
        }
      }, this)
    }, this)
  }

, fixModulesField: function (data) {
    if (data.modules) {
      this.warn("deprecatedModules")
      delete data.modules
    }
  }

, fixKeywordsField: function (data) {
    if (typeof data.keywords === "string") {
      data.keywords = data.keywords.split(/,\s+/)
    }
    if (data.keywords && !Array.isArray(data.keywords)) {
      delete data.keywords
      this.warn("nonArrayKeywords")
    } else if (data.keywords) {
      data.keywords = data.keywords.filter(function(kw) {
        if (typeof kw !== "string" || !kw) {
          this.warn("nonStringKeyword");
          return false
        } else {
          return true
        }
      }, this)
    }
  }

, fixVersionField: function(data, strict) {
    // allow "loose" semver 1.0 versions in non-strict mode
    // enforce strict semver 2.0 compliance in strict mode
    var loose = !strict
    if (!data.version) {
      data.version = ""
      return true
    }
    if (!semver.valid(data.version, loose)) {
      throw new Error('Invalid version: "'+ data.version + '"')
    }
    data.version = semver.clean(data.version, loose)
    return true
  }

, fixPeople: function(data) {
    modifyPeople(data, unParsePerson)
    modifyPeople(data, parsePerson)
  }

, fixNameField: function(data, strict) {
    if (!data.name && !strict) {
      data.name = ""
      return
    }
    if (typeof data.name !== "string") {
      throw new Error("name field must be a string.")
    }
    if (!strict)
      data.name = data.name.trim()
    ensureValidName(data.name, strict)
    if (coreModuleNames.indexOf(data.name) !== -1)
      this.warn("conflictingName", data.name)
  }


, fixDescriptionField: function (data) {
    if (data.description && typeof data.description !== 'string') {
      this.warn("nonStringDescription")
      delete data.description
    }
    if (data.readme && !data.description)
      data.description = extractDescription(data.readme)
      if(data.description === undefined) delete data.description;
    if (!data.description) this.warn("missingDescription")
  }

, fixReadmeField: function (data) {
    if (!data.readme) {
      this.warn("missingReadme")
      data.readme = "ERROR: No README data found!"
    }
  }

, fixBugsField: function(data) {
    if (!data.bugs && data.repository && data.repository.url) {
      var gh = parseGitHubURL(data.repository.url)
      if(gh) {
        if(gh.match(/^https:\/\/github.com\//))
          data.bugs = {url: gh + "/issues"}
        else // gist url
          data.bugs = {url: gh}
      }
    }
    else if(data.bugs) {
      var emailRe = /^.+@.*\..+$/
      if(typeof data.bugs == "string") {
        if(emailRe.test(data.bugs))
          data.bugs = {email:data.bugs}
        else if(url.parse(data.bugs).protocol)
          data.bugs = {url: data.bugs}
        else
          this.warn("nonEmailUrlBugsString")
      }
      else {
        bugsTypos(data.bugs, this.warn)
        var oldBugs = data.bugs
        data.bugs = {}
        if(oldBugs.url) {
          if(typeof(oldBugs.url) == "string" && url.parse(oldBugs.url).protocol)
            data.bugs.url = oldBugs.url
          else
            this.warn("nonUrlBugsUrlField")
        }
        if(oldBugs.email) {
          if(typeof(oldBugs.email) == "string" && emailRe.test(oldBugs.email))
            data.bugs.email = oldBugs.email
          else
            this.warn("nonEmailBugsEmailField")
        }
      }
      if(!data.bugs.email && !data.bugs.url) {
        delete data.bugs
        this.warn("emptyNormalizedBugs")
      }
    }
  }

, fixHomepageField: function(data) {
    if (!data.homepage && data.repository && data.repository.url) {
      var gh = parseGitHubURL(data.repository.url)
      if (gh)
          data.homepage = gh
      else
        return true
    } else if (!data.homepage)
      return true

    if(typeof data.homepage !== "string") {
      this.warn("nonUrlHomepage")
      return delete data.homepage
    }
    if(!url.parse(data.homepage).protocol) {
      this.warn("missingProtocolHomepage")
      data.homepage = "http://" + data.homepage
    }
  }
}

function isValidScopedPackageName(spec) {
  if (spec.charAt(0) !== '@') return false

  var rest = spec.slice(1).split('/')
  if (rest.length !== 2) return false

  return rest[0] && rest[1] &&
    rest[0] === encodeURIComponent(rest[0]) &&
    rest[1] === encodeURIComponent(rest[1])
}

function isCorrectlyEncodedName(spec) {
  return !spec.match(/[\/@\s\+%:]/) &&
    spec === encodeURIComponent(spec)
}

function ensureValidName (name, strict) {
  if (name.charAt(0) === "." ||
      !(isValidScopedPackageName(name) || isCorrectlyEncodedName(name)) ||
      (strict && name !== name.toLowerCase()) ||
      name.toLowerCase() === "node_modules" ||
      name.toLowerCase() === "favicon.ico") {
        throw new Error("Invalid name: " + JSON.stringify(name))
  }
}

function modifyPeople (data, fn) {
  if (data.author) data.author = fn(data.author)
  ;["maintainers", "contributors"].forEach(function (set) {
    if (!Array.isArray(data[set])) return;
    data[set] = data[set].map(fn)
  })
  return data
}

function unParsePerson (person) {
  if (typeof person === "string") return person
  var name = person.name || ""
  var u = person.url || person.web
  var url = u ? (" ("+u+")") : ""
  var e = person.email || person.mail
  var email = e ? (" <"+e+">") : ""
  return name+email+url
}

function parsePerson (person) {
  if (typeof person !== "string") return person
  var name = person.match(/^([^\(<]+)/)
  var url = person.match(/\(([^\)]+)\)/)
  var email = person.match(/<([^>]+)>/)
  var obj = {}
  if (name && name[0].trim()) obj.name = name[0].trim()
  if (email) obj.email = email[1];
  if (url) obj.url = url[1];
  return obj
}

function addOptionalDepsToDeps (data, warn) {
  var o = data.optionalDependencies
  if (!o) return;
  var d = data.dependencies || {}
  Object.keys(o).forEach(function (k) {
    d[k] = o[k]
  })
  data.dependencies = d
}

function depObjectify (deps, type, warn) {
  if (!deps) return {}
  if (typeof deps === "string") {
    deps = deps.trim().split(/[\n\r\s\t ,]+/)
  }
  if (!Array.isArray(deps)) return deps
  warn("deprecatedArrayDependencies", type)
  var o = {}
  deps.filter(function (d) {
    return typeof d === "string"
  }).forEach(function(d) {
    d = d.trim().split(/(:?[@\s><=])/)
    var dn = d.shift()
    var dv = d.join("")
    dv = dv.trim()
    dv = dv.replace(/^@/, "")
    o[dn] = dv
  })
  return o
}

function objectifyDeps (data, warn) {
  depTypes.forEach(function (type) {
    if (!data[type]) return;
    data[type] = depObjectify(data[type], type, warn)
  })
}

function bugsTypos(bugs, warn) {
  if (!bugs) return
  Object.keys(bugs).forEach(function (k) {
    if (typos.bugs[k]) {
      warn("typo", k, typos.bugs[k], "bugs")
      bugs[typos.bugs[k]] = bugs[k]
      delete bugs[k]
    }
  })
}

},{"./core_module_names":81,"./extract_description":82,"./typos":86,"github-url-from-git":88,"github-url-from-username-repo":89,"semver":91,"url":17}],84:[function(require,module,exports){
var util = require("util")
var messages = require("./warning_messages.json")

module.exports = function() {
  var args = Array.prototype.slice.call(arguments, 0)
  var warningName = args.shift()
  if (warningName == "typo") {
    return makeTypoWarning.apply(null,args)
  }
  else {
    var msgTemplate = messages[warningName] ? messages[warningName] : warningName + ": '%s'"
    args.unshift(msgTemplate)
    return util.format.apply(null, args)
  }
}

function makeTypoWarning (providedName, probableName, field) {
  if (field) {
    providedName = field + "['" + providedName + "']"
    probableName = field + "['" + probableName + "']"
  }
  return util.format(messages.typo, providedName, probableName)
}
},{"./warning_messages.json":87,"util":19}],85:[function(require,module,exports){
module.exports = normalize

var fixer = require("./fixer")
var makeWarning = require("./make_warning")

var fieldsToFix = ['name','version','description','repository','modules','scripts'
                  ,'files','bin','man','bugs','keywords','readme','homepage']
var otherThingsToFix = ['dependencies','people', 'typos']

var thingsToFix = fieldsToFix.map(function(fieldName) { 
  return ucFirst(fieldName) + "Field"
})
// two ways to do this in CoffeeScript on only one line, sub-70 chars:
// thingsToFix = fieldsToFix.map (name) -> ucFirst(name) + "Field"
// thingsToFix = (ucFirst(name) + "Field" for name in fieldsToFix)
thingsToFix = thingsToFix.concat(otherThingsToFix)

function normalize (data, warn, strict) {
  if(warn === true) warn = null, strict = true
  if(!strict) strict = false
  if(!warn || data.private) warn = function(msg) { /* noop */ }

  if (data.scripts && 
      data.scripts.install === "node-gyp rebuild" && 
      !data.scripts.preinstall) {
    data.gypfile = true
  }
  fixer.warn = function() { warn(makeWarning.apply(null, arguments)) }
  thingsToFix.forEach(function(thingName) {
    fixer["fix" + ucFirst(thingName)](data, strict)
  })
  data._id = data.name + "@" + data.version
}

function ucFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

},{"./fixer":83,"./make_warning":84}],86:[function(require,module,exports){
module.exports={
  "topLevel": { 
    "dependancies": "dependencies"
   ,"dependecies": "dependencies"
   ,"depdenencies": "dependencies"
   ,"devEependencies": "devDependencies"
   ,"depends": "dependencies"
   ,"dev-dependencies": "devDependencies"
   ,"devDependences": "devDependencies"
   ,"devDepenencies": "devDependencies"
   ,"devdependencies": "devDependencies"
   ,"repostitory": "repository"
   ,"repo": "repository"
   ,"prefereGlobal": "preferGlobal"
   ,"hompage": "homepage"
   ,"hampage": "homepage"
   ,"autohr": "author"
   ,"autor": "author"
   ,"contributers": "contributors"
   ,"publicationConfig": "publishConfig"
   ,"script": "scripts"
  },
  "bugs": { "web": "url", "name": "url" },
  "script": { "server": "start", "tests": "test" }
}

},{}],87:[function(require,module,exports){
module.exports={
  "repositories": "'repositories' (plural) Not supported. Please pick one as the 'repository' field"
  ,"missingRepository": "No repository field."
  ,"brokenGitUrl": "Probably broken git url: %s"
  ,"nonObjectScripts": "scripts must be an object"
  ,"nonStringScript": "script values must be string commands"
  ,"nonArrayFiles": "Invalid 'files' member"
  ,"invalidFilename": "Invalid filename in 'files' list: %s"
  ,"nonArrayBundleDependencies": "Invalid 'bundleDependencies' list. Must be array of package names"
  ,"nonStringBundleDependency": "Invalid bundleDependencies member: %s"
  ,"nonDependencyBundleDependency": "Non-dependency in bundleDependencies: %s"
  ,"nonObjectDependencies": "%s field must be an object"
  ,"nonStringDependency": "Invalid dependency: %s %s"
  ,"deprecatedArrayDependencies": "specifying %s as array is deprecated"
  ,"deprecatedModules": "modules field is deprecated"
  ,"nonArrayKeywords": "keywords should be an array of strings"
  ,"nonStringKeyword": "keywords should be an array of strings"
  ,"conflictingName": "%s is also the name of a node core module."
  ,"nonStringDescription": "'description' field should be a string"
  ,"missingDescription": "No description"
  ,"missingReadme": "No README data"
  ,"nonEmailUrlBugsString": "Bug string field must be url, email, or {email,url}"
  ,"nonUrlBugsUrlField": "bugs.url field must be a string url. Deleted."
  ,"nonEmailBugsEmailField": "bugs.email field must be a string email. Deleted."
  ,"emptyNormalizedBugs": "Normalized value of bugs field is an empty object. Deleted."
  ,"nonUrlHomepage": "homepage field must be a string url. Deleted."
  ,"missingProtocolHomepage": "homepage field must start with a protocol."
  ,"typo": "%s should probably be %s."
}

},{}],88:[function(require,module,exports){
// convert git:// form url to github URL, e.g.,
// git://github.com/bcoe/foo.git
// https://github.com/bcoe/foo.
function githubUrlFromGit(url, opts){
  try {
    var m = re(opts).exec(url.replace(/\.git(#.*)?$/, ''));
    var host = m[1];
    var path = m[2];
    return 'https://' + host + '/' + path;
  } catch (err) {
    // ignore
  }
};

// generate the git:// parsing regex
// with options, e.g., the ability
// to specify multiple GHE domains.
function re(opts) {
  opts = opts || {};
  // whitelist of URLs that should be treated as GitHub repos.
  var baseUrls = ['gist.github.com', 'github.com'].concat(opts.extraBaseUrls || []);
  // build regex from whitelist.
  return new RegExp(
    /^(?:https?:\/\/|git:\/\/|git\+ssh:\/\/|git\+https:\/\/)?(?:[^@]+@)?/.source +
    '(' + baseUrls.join('|') + ')' +
    /[:\/]([^\/]+\/[^\/]+?|[0-9]+)$/.source
  );
}

githubUrlFromGit.re = re();

module.exports = githubUrlFromGit;

},{}],89:[function(require,module,exports){
module.exports = getUrl

function getUrl (r, forBrowser) {
  if (!r) return null
  // Regex taken from https://github.com/npm/npm-package-arg/commit/01dce583c64afae07b66a2a8a6033aeba871c3cd
  // Note: This does not fully test the git ref format.
  // See https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html
  //
  // The only way to do this properly would be to shell out to
  // git-check-ref-format, and as this is a fast sync function,
  // we don't want to do that. Just let git fail if it turns
  // out that the commit-ish is invalid.
  // GH usernames cannot start with . or -
  if (/^[^@%\/\s\.-][^:@%\/\s]*\/[^@\s\/%]+(?:#.*)?$/.test(r)) {
    if (forBrowser)
      r = r.replace("#", "/tree/")
    return "https://github.com/" + r
  }

  return null
}

},{}],90:[function(require,module,exports){
var fs
try {
  fs = require('graceful-fs')
} catch (er) {
  fs = require('fs')
}

var path = require('path')

var glob = require('glob')
var normalizeData = require('normalize-package-data')
var safeJSON = require('json-parse-helpfulerror')

module.exports = readJson

// put more stuff on here to customize.
readJson.extraSet = [
  gypfile,
  serverjs,
  scriptpath,
  authors,
  readme,
  mans,
  bins,
  githead
]

var typoWarned = {}

function readJson (file, log_, strict_, cb_) {
  var log, strict, cb
  for (var i = 1; i < arguments.length - 1; i++) {
    if (typeof arguments[i] === 'boolean') {
      strict = arguments[i]
    } else if (typeof arguments[i] === 'function') {
      log = arguments[i]
    }
  }

  if (!log) log = function () {}
  cb = arguments[ arguments.length - 1 ]

  readJson_(file, log, strict, cb)
}

function readJson_ (file, log, strict, cb) {
  fs.readFile(file, 'utf8', function (er, d) {
    parseJson(file, er, d, log, strict, cb)
  })
}

function stripBOM (content) {
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1)
  return content
}

function parseJson (file, er, d, log, strict, cb) {
  if (er && er.code === 'ENOENT') return indexjs(file, er, log, strict, cb)
  if (er) return cb(er)

  try {
    d = safeJSON.parse(stripBOM(d))
  } catch (er) {
    d = parseIndex(d)
    if (!d) return cb(parseError(er, file))
  }

  extras(file, d, log, strict, cb)
}

function indexjs (file, er, log, strict, cb) {
  if (path.basename(file) === 'index.js') return cb(er)

  var index = path.resolve(path.dirname(file), 'index.js')
  fs.readFile(index, 'utf8', function (er2, d) {
    if (er2) return cb(er)

    d = parseIndex(d)
    if (!d) return cb(er)

    extras(file, d, log, strict, cb)
  })
}

readJson.extras = extras
function extras (file, data, log_, strict_, cb_) {
  var log, strict, cb
  for (var i = 2; i < arguments.length - 1; i++) {
    if (typeof arguments[i] === 'boolean') {
      strict = arguments[i]
    } else if (typeof arguments[i] === 'function') {
      log = arguments[i]
    }
  }

  if (!log) log = function () {}
  cb = arguments[i]

  var set = readJson.extraSet
  var n = set.length
  var errState = null
  set.forEach(function (fn) {
    fn(file, data, then)
  })

  function then (er) {
    if (errState) return
    if (er) return cb(errState = er)
    if (--n > 0) return
    final(file, data, log, strict, cb)
  }
}

function scriptpath (file, data, cb) {
  if (!data.scripts) return cb(null, data)
  var k = Object.keys(data.scripts)
  k.forEach(scriptpath_, data.scripts)
  cb(null, data)
}

function scriptpath_ (key) {
  var s = this[key]
  // This is never allowed, and only causes problems
  if (typeof s !== 'string') return delete this[key]

  var spre = /^(\.[\/\\])?node_modules[\/\\].bin[\\\/]/
  if (s.match(spre)) {
    this[key] = this[key].replace(spre, '')
  }
}

function gypfile (file, data, cb) {
  var dir = path.dirname(file)
  var s = data.scripts || {}
  if (s.install || s.preinstall) return cb(null, data)

  glob('*.gyp', { cwd: dir }, function (er, files) {
    if (er) return cb(er)
    gypfile_(file, data, files, cb)
  })
}

function gypfile_ (file, data, files, cb) {
  if (!files.length) return cb(null, data)
  var s = data.scripts || {}
  s.install = 'node-gyp rebuild'
  data.scripts = s
  data.gypfile = true
  return cb(null, data)
}

function serverjs (file, data, cb) {
  var dir = path.dirname(file)
  var s = data.scripts || {}
  if (s.start) return cb(null, data)
  glob('server.js', { cwd: dir }, function (er, files) {
    if (er) return cb(er)
    serverjs_(file, data, files, cb)
  })
}

function serverjs_ (file, data, files, cb) {
  if (!files.length) return cb(null, data)
  var s = data.scripts || {}
  s.start = 'node server.js'
  data.scripts = s
  return cb(null, data)
}

function authors (file, data, cb) {
  if (data.contributors) return cb(null, data)
  var af = path.resolve(path.dirname(file), 'AUTHORS')
  fs.readFile(af, 'utf8', function (er, ad) {
    // ignore error.  just checking it.
    if (er) return cb(null, data)
    authors_(file, data, ad, cb)
  })
}

function authors_ (file, data, ad, cb) {
  ad = ad.split(/\r?\n/g).map(function (line) {
    return line.replace(/^\s*#.*$/, '').trim()
  }).filter(function (line) {
    return line
  })
  data.contributors = ad
  return cb(null, data)
}

function readme (file, data, cb) {
  if (data.readme) return cb(null, data)
  var dir = path.dirname(file)
  var globOpts = { cwd: dir, nocase: true, mark: true }
  glob('{README,README.*}', globOpts, function (er, files) {
    if (er) return cb(er)
    // don't accept directories.
    files = files.filter(function (file) {
      return !file.match(/\/$/)
    })
    if (!files.length) return cb()
    var fn = preferMarkdownReadme(files)
    var rm = path.resolve(dir, fn)
    readme_(file, data, rm, cb)
  })
}

function preferMarkdownReadme (files) {
  var fallback = 0
  var re = /\.m?a?r?k?d?o?w?n?$/i
  for (var i = 0; i < files.length; i++) {
    if (files[i].match(re)) {
      return files[i]
    } else if (files[i].match(/README$/)) {
      fallback = i
    }
  }
  // prefer README.md, followed by README; otherwise, return
  // the first filename (which could be README)
  return files[fallback]
}

function readme_ (file, data, rm, cb) {
  var rmfn = path.basename(rm)
  fs.readFile(rm, 'utf8', function (er, rm) {
    // maybe not readable, or something.
    if (er) return cb()
    data.readme = rm
    data.readmeFilename = rmfn
    return cb(er, data)
  })
}

function mans (file, data, cb) {
  var m = data.directories && data.directories.man
  if (data.man || !m) return cb(null, data)
  m = path.resolve(path.dirname(file), m)
  glob('**/*.[0-9]', { cwd: m }, function (er, mans) {
    if (er) return cb(er)
    mans_(file, data, mans, cb)
  })
}

function mans_ (file, data, mans, cb) {
  var m = data.directories && data.directories.man
  data.man = mans.map(function (mf) {
    return path.resolve(path.dirname(file), m, mf)
  })
  return cb(null, data)
}

function bins (file, data, cb) {
  if (Array.isArray(data.bin)) return bins_(file, data, data.bin, cb)

  var m = data.directories && data.directories.bin
  if (data.bin || !m) return cb(null, data)

  m = path.resolve(path.dirname(file), m)
  glob('**', { cwd: m }, function (er, bins) {
    if (er) return cb(er)
    bins_(file, data, bins, cb)
  })
}

function bins_ (file, data, bins, cb) {
  var m = data.directories && data.directories.bin || '.'
  data.bin = bins.reduce(function (acc, mf) {
    if (mf && mf.charAt(0) !== '.') {
      var f = path.basename(mf)
      acc[f] = path.join(m, mf)
    }
    return acc
  }, {})
  return cb(null, data)
}

function githead (file, data, cb) {
  if (data.gitHead) return cb(null, data)
  var dir = path.dirname(file)
  var head = path.resolve(dir, '.git/HEAD')
  fs.readFile(head, 'utf8', function (er, head) {
    if (er) return cb(null, data)
    githead_(file, data, dir, head, cb)
  })
}

function githead_ (file, data, dir, head, cb) {
  if (!head.match(/^ref: /)) {
    data.gitHead = head.trim()
    return cb(null, data)
  }
  var headFile = head.replace(/^ref: /, '').trim()
  headFile = path.resolve(dir, '.git', headFile)
  fs.readFile(headFile, 'utf8', function (er, head) {
    if (er || !head) return cb(null, data)
    head = head.replace(/^ref: /, '').trim()
    data.gitHead = head
    return cb(null, data)
  })
}

/**
 * Warn if the bin references don't point to anything.  This might be better in
 * normalize-package-data if it had access to the file path.
 */
function checkBinReferences_ (file, data, warn, cb) {
  if (!(data.bin instanceof Object)) return cb()

  var keys = Object.keys(data.bin)
  var keysLeft = keys.length
  if (!keysLeft) return cb()

  function handleExists (relName, result) {
    keysLeft--
    if (!result) warn('No bin file found at ' + relName)
    if (!keysLeft) cb()
  }

  keys.forEach(function (key) {
    var dirName = path.dirname(file)
    var relName = data.bin[key]
    var binPath = path.resolve(dirName, relName)
    fs.exists(binPath, handleExists.bind(null, relName))
  })
}

function final (file, data, log, strict, cb) {
  var pId = makePackageId(data)

  function warn (msg) {
    if (typoWarned[pId]) return
    if (log) log('package.json', pId, msg)
  }

  try {
    normalizeData(data, warn, strict)
  } catch (error) {
    return cb(error)
  }

  checkBinReferences_(file, data, warn, function () {
    typoWarned[pId] = true
    cb(null, data)
  })
}

function makePackageId (data) {
  var name = cleanString(data.name)
  var ver = cleanString(data.version)
  return name + '@' + ver
}

function cleanString (str) {
  return (!str || typeof (str) !== 'string') ? '' : str.trim()
}

// /**package { "name": "foo", "version": "1.2.3", ... } **/
function parseIndex (data) {
  data = data.split(/^\/\*\*package(?:\s|$)/m)

  if (data.length < 2) return null
  data = data[1]
  data = data.split(/\*\*\/$/m)

  if (data.length < 2) return null
  data = data[0]
  data = data.replace(/^\s*\*/mg, '')

  try {
    return safeJSON.parse(data)
  } catch (er) {
    return null
  }
}

function parseError (ex, file) {
  var e = new Error('Failed to parse json\n' + ex.message)
  e.code = 'EJSONPARSE'
  e.file = file
  return e
}

},{"fs":2,"glob":61,"graceful-fs":58,"json-parse-helpfulerror":73,"normalize-package-data":85,"path":11}],91:[function(require,module,exports){
;(function(exports) {

// export the class if we are in a Node-like system.
if (typeof module === 'object' && module.exports === exports)
  exports = module.exports = SemVer;

// The debug function is excluded entirely from the minified version.

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0';

// The actual regexps go on exports.re
var re = exports.re = [];
var src = exports.src = [];
var R = 0;

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

var NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
var NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';


// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

var NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';


// ## Main Version
// Three dot-separated numeric identifiers.

var MAINVERSION = R++;
src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')';

var MAINVERSIONLOOSE = R++;
src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

var PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
                            '|' + src[NONNUMERICIDENTIFIER] + ')';

var PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
                                 '|' + src[NONNUMERICIDENTIFIER] + ')';


// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

var PRERELEASE = R++;
src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

var PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

var BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

var BUILD = R++;
src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';


// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

var FULL = R++;
var FULLPLAIN = 'v?' + src[MAINVERSION] +
                src[PRERELEASE] + '?' +
                src[BUILD] + '?';

src[FULL] = '^' + FULLPLAIN + '$';

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
                 src[PRERELEASELOOSE] + '?' +
                 src[BUILD] + '?';

var LOOSE = R++;
src[LOOSE] = '^' + LOOSEPLAIN + '$';

var GTLT = R++;
src[GTLT] = '((?:<|>)?=?)';

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
var XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
var XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

var XRANGEPLAIN = R++;
src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:(' + src[PRERELEASE] + ')' +
                   ')?)?)?';

var XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:(' + src[PRERELEASELOOSE] + ')' +
                        ')?)?)?';

// >=2.x, for example, means >=2.0.0-0
// <1.x would be the same as "<1.0.0-0", though.
var XRANGE = R++;
src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
var XRANGELOOSE = R++;
src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

// Tilde ranges.
// Meaning is "reasonably at or greater than"
var LONETILDE = R++;
src[LONETILDE] = '(?:~>?)';

var TILDETRIM = R++;
src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
var tildeTrimReplace = '$1~';

var TILDE = R++;
src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
var TILDELOOSE = R++;
src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

// Caret ranges.
// Meaning is "at least and backwards compatible with"
var LONECARET = R++;
src[LONECARET] = '(?:\\^)';

var CARETTRIM = R++;
src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
var caretTrimReplace = '$1^';

var CARET = R++;
src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
var CARETLOOSE = R++;
src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

// A simple gt/lt/eq thing, or just "" to indicate "any version"
var COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
var COMPARATOR = R++;
src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';


// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
var COMPARATORTRIM = R++;
src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

// this one has to use the /g flag
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
var comparatorTrimReplace = '$1$2$3';


// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
var HYPHENRANGE = R++;
src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
                   '\\s+-\\s+' +
                   '(' + src[XRANGEPLAIN] + ')' +
                   '\\s*$';

var HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s+-\\s+' +
                        '(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s*$';

// Star ranges basically just allow anything at all.
var STAR = R++;
src[STAR] = '(<|>)?=?\\s*\\*';

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  ;
  if (!re[i])
    re[i] = new RegExp(src[i]);
}

exports.parse = parse;
function parse(version, loose) {
  var r = loose ? re[LOOSE] : re[FULL];
  return (r.test(version)) ? new SemVer(version, loose) : null;
}

exports.valid = valid;
function valid(version, loose) {
  var v = parse(version, loose);
  return v ? v.version : null;
}


exports.clean = clean;
function clean(version, loose) {
  var s = parse(version.trim().replace(/^[=v]+/, ""), loose);
  return s ? s.version : null;
}

exports.SemVer = SemVer;

function SemVer(version, loose) {
  if (version instanceof SemVer) {
    if (version.loose === loose)
      return version;
    else
      version = version.version;
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version);
  }

  if (!(this instanceof SemVer))
    return new SemVer(version, loose);

  ;
  this.loose = loose;
  var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);

  if (!m)
    throw new TypeError('Invalid Version: ' + version);

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  // numberify any prerelease numeric ids
  if (!m[4])
    this.prerelease = [];
  else
    this.prerelease = m[4].split('.').map(function(id) {
      return (/^[0-9]+$/.test(id)) ? +id : id;
    });

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function() {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  if (this.prerelease.length)
    this.version += '-' + this.prerelease.join('.');
  return this.version;
};

SemVer.prototype.inspect = function() {
  return '<SemVer "' + this + '">';
};

SemVer.prototype.toString = function() {
  return this.version;
};

SemVer.prototype.compare = function(other) {
  ;
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return this.compareMain(other) || this.comparePre(other);
};

SemVer.prototype.compareMain = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch);
};

SemVer.prototype.comparePre = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length)
    return -1;
  else if (!this.prerelease.length && other.prerelease.length)
    return 1;
  else if (!this.prerelease.length && !other.prerelease.length)
    return 0;

  var i = 0;
  do {
    var a = this.prerelease[i];
    var b = other.prerelease[i];
    ;
    if (a === undefined && b === undefined)
      return 0;
    else if (b === undefined)
      return 1;
    else if (a === undefined)
      return -1;
    else if (a === b)
      continue;
    else
      return compareIdentifiers(a, b);
  } while (++i);
};

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function(release) {
  switch (release) {
    case 'premajor':
      this.inc('major');
      this.inc('pre');
      break;
    case 'preminor':
      this.inc('minor');
      this.inc('pre');
      break;
    case 'prepatch':
      // If this is already a prerelease, it will bump to the next version
      // drop any prereleases that might already exist, since they are not
      // relevant at this point.
      this.prerelease.length = 0;
      this.inc('patch');
      this.inc('pre');
      break;
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case 'prerelease':
      if (this.prerelease.length === 0)
        this.inc('patch');
      this.inc('pre');
      break;
    case 'major':
      this.major++;
      this.minor = -1;
    case 'minor':
      this.minor++;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0)
        this.patch++;
      this.prerelease = [];
      break;
    // This probably shouldn't be used publically.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0)
        this.prerelease = [0];
      else {
        var i = this.prerelease.length;
        while (--i >= 0) {
          if (typeof this.prerelease[i] === 'number') {
            this.prerelease[i]++;
            i = -2;
          }
        }
        if (i === -1) // didn't increment anything
          this.prerelease.push(0);
      }
      break;

    default:
      throw new Error('invalid increment argument: ' + release);
  }
  this.format();
  return this;
};

exports.inc = inc;
function inc(version, release, loose) {
  try {
    return new SemVer(version, loose).inc(release).version;
  } catch (er) {
    return null;
  }
}

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers(a, b) {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return (anum && !bnum) ? -1 :
         (bnum && !anum) ? 1 :
         a < b ? -1 :
         a > b ? 1 :
         0;
}

exports.rcompareIdentifiers = rcompareIdentifiers;
function rcompareIdentifiers(a, b) {
  return compareIdentifiers(b, a);
}

exports.compare = compare;
function compare(a, b, loose) {
  return new SemVer(a, loose).compare(b);
}

exports.compareLoose = compareLoose;
function compareLoose(a, b) {
  return compare(a, b, true);
}

exports.rcompare = rcompare;
function rcompare(a, b, loose) {
  return compare(b, a, loose);
}

exports.sort = sort;
function sort(list, loose) {
  return list.sort(function(a, b) {
    return exports.compare(a, b, loose);
  });
}

exports.rsort = rsort;
function rsort(list, loose) {
  return list.sort(function(a, b) {
    return exports.rcompare(a, b, loose);
  });
}

exports.gt = gt;
function gt(a, b, loose) {
  return compare(a, b, loose) > 0;
}

exports.lt = lt;
function lt(a, b, loose) {
  return compare(a, b, loose) < 0;
}

exports.eq = eq;
function eq(a, b, loose) {
  return compare(a, b, loose) === 0;
}

exports.neq = neq;
function neq(a, b, loose) {
  return compare(a, b, loose) !== 0;
}

exports.gte = gte;
function gte(a, b, loose) {
  return compare(a, b, loose) >= 0;
}

exports.lte = lte;
function lte(a, b, loose) {
  return compare(a, b, loose) <= 0;
}

exports.cmp = cmp;
function cmp(a, op, b, loose) {
  var ret;
  switch (op) {
    case '===': ret = a === b; break;
    case '!==': ret = a !== b; break;
    case '': case '=': case '==': ret = eq(a, b, loose); break;
    case '!=': ret = neq(a, b, loose); break;
    case '>': ret = gt(a, b, loose); break;
    case '>=': ret = gte(a, b, loose); break;
    case '<': ret = lt(a, b, loose); break;
    case '<=': ret = lte(a, b, loose); break;
    default: throw new TypeError('Invalid operator: ' + op);
  }
  return ret;
}

exports.Comparator = Comparator;
function Comparator(comp, loose) {
  if (comp instanceof Comparator) {
    if (comp.loose === loose)
      return comp;
    else
      comp = comp.value;
  }

  if (!(this instanceof Comparator))
    return new Comparator(comp, loose);

  ;
  this.loose = loose;
  this.parse(comp);

  if (this.semver === ANY)
    this.value = '';
  else
    this.value = this.operator + this.semver.version;
}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m)
    throw new TypeError('Invalid comparator: ' + comp);

  this.operator = m[1];
  if (this.operator === '=')
    this.operator = '';

  // if it literally is just '>' or '' then allow anything.
  if (!m[2])
    this.semver = ANY;
  else {
    this.semver = new SemVer(m[2], this.loose);

    // <1.2.3-rc DOES allow 1.2.3-beta (has prerelease)
    // >=1.2.3 DOES NOT allow 1.2.3-beta
    // <=1.2.3 DOES allow 1.2.3-beta
    // However, <1.2.3 does NOT allow 1.2.3-beta,
    // even though `1.2.3-beta < 1.2.3`
    // The assumption is that the 1.2.3 version has something you
    // *don't* want, so we push the prerelease down to the minimum.
    if (this.operator === '<' && !this.semver.prerelease.length) {
      this.semver.prerelease = ['0'];
      this.semver.format();
    }
  }
};

Comparator.prototype.inspect = function() {
  return '<SemVer Comparator "' + this + '">';
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {
  ;
  return (this.semver === ANY) ? true :
         cmp(version, this.operator, this.semver, this.loose);
};


exports.Range = Range;
function Range(range, loose) {
  if ((range instanceof Range) && range.loose === loose)
    return range;

  if (!(this instanceof Range))
    return new Range(range, loose);

  this.loose = loose;

  // First, split based on boolean or ||
  this.raw = range;
  this.set = range.split(/\s*\|\|\s*/).map(function(range) {
    return this.parseRange(range.trim());
  }, this).filter(function(c) {
    // throw out any that are not relevant for whatever reason
    return c.length;
  });

  if (!this.set.length) {
    throw new TypeError('Invalid SemVer Range: ' + range);
  }

  this.format();
}

Range.prototype.inspect = function() {
  return '<SemVer Range "' + this.range + '">';
};

Range.prototype.format = function() {
  this.range = this.set.map(function(comps) {
    return comps.join(' ').trim();
  }).join('||').trim();
  return this.range;
};

Range.prototype.toString = function() {
  return this.range;
};

Range.prototype.parseRange = function(range) {
  var loose = this.loose;
  range = range.trim();
  ;
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  ;
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
  ;

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[TILDETRIM], tildeTrimReplace);

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[CARETTRIM], caretTrimReplace);

  // normalize spaces
  range = range.split(/\s+/).join(' ');

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var set = range.split(' ').map(function(comp) {
    return parseComparator(comp, loose);
  }).join(' ').split(/\s+/);
  if (this.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function(comp) {
      return !!comp.match(compRe);
    });
  }
  set = set.map(function(comp) {
    return new Comparator(comp, loose);
  });

  return set;
};

// Mostly just for testing and legacy API reasons
exports.toComparators = toComparators;
function toComparators(range, loose) {
  return new Range(range, loose).set.map(function(comp) {
    return comp.map(function(c) {
      return c.value;
    }).join(' ').trim().split(' ');
  });
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator(comp, loose) {
  ;
  comp = replaceCarets(comp, loose);
  ;
  comp = replaceTildes(comp, loose);
  ;
  comp = replaceXRanges(comp, loose);
  ;
  comp = replaceStars(comp, loose);
  ;
  return comp;
}

function isX(id) {
  return !id || id.toLowerCase() === 'x' || id === '*';
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceTilde(comp, loose);
  }).join(' ');
}

function replaceTilde(comp, loose) {
  var r = loose ? re[TILDELOOSE] : re[TILDE];
  return comp.replace(r, function(_, M, m, p, pr) {
    ;
    var ret;

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0-0 <' + (+M + 1) + '.0.0-0';
    else if (isX(p))
      // ~1.2 == >=1.2.0- <1.3.0-
      ret = '>=' + M + '.' + m + '.0-0 <' + M + '.' + (+m + 1) + '.0-0';
    else if (pr) {
      ;
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      ret = '>=' + M + '.' + m + '.' + p + pr +
            ' <' + M + '.' + (+m + 1) + '.0-0';
    } else
      // ~1.2.3 == >=1.2.3-0 <1.3.0-0
      ret = '>=' + M + '.' + m + '.' + p + '-0' +
            ' <' + M + '.' + (+m + 1) + '.0-0';

    ;
    return ret;
  });
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceCaret(comp, loose);
  }).join(' ');
}

function replaceCaret(comp, loose) {
  var r = loose ? re[CARETLOOSE] : re[CARET];
  return comp.replace(r, function(_, M, m, p, pr) {
    ;
    var ret;
    if (pr) {
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
    } else
      pr = '';

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0-0 <' + (+M + 1) + '.0.0-0';
    else if (isX(p)) {
      if (M === '0')
        ret = '>=' + M + '.' + m + '.0-0 <' + M + '.' + (+m + 1) + '.0-0';
      else
        ret = '>=' + M + '.' + m + '.0-0 <' + (+M + 1) + '.0.0-0';
    } else if (M === '0')
      ret = '=' + M + '.' + m + '.' + p + pr;
    else if (pr)
      ret = '>=' + M + '.' + m + '.' + p + pr +
            ' <' + (+M + 1) + '.0.0-0';
    else
      ret = '>=' + M + '.' + m + '.' + p + '-0' +
            ' <' + (+M + 1) + '.0.0-0';

    ;
    return ret;
  });
}

function replaceXRanges(comp, loose) {
  ;
  return comp.split(/\s+/).map(function(comp) {
    return replaceXRange(comp, loose);
  }).join(' ');
}

function replaceXRange(comp, loose) {
  comp = comp.trim();
  var r = loose ? re[XRANGELOOSE] : re[XRANGE];
  return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
    ;
    var xM = isX(M);
    var xm = xM || isX(m);
    var xp = xm || isX(p);
    var anyX = xp;

    if (gtlt === '=' && anyX)
      gtlt = '';

    if (gtlt && anyX) {
      // replace X with 0, and then append the -0 min-prerelease
      if (xM)
        M = 0;
      if (xm)
        m = 0;
      if (xp)
        p = 0;

      if (gtlt === '>') {
        // >1 => >=2.0.0-0
        // >1.2 => >=1.3.0-0
        // >1.2.3 => >= 1.2.4-0
        gtlt = '>=';
        if (xM) {
          // no change
        } else if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else if (xp) {
          m = +m + 1;
          p = 0;
        }
      }


      ret = gtlt + M + '.' + m + '.' + p + '-0';
    } else if (xM) {
      // allow any
      ret = '*';
    } else if (xm) {
      // append '-0' onto the version, otherwise
      // '1.x.x' matches '2.0.0-beta', since the tag
      // *lowers* the version value
      ret = '>=' + M + '.0.0-0 <' + (+M + 1) + '.0.0-0';
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0-0 <' + M + '.' + (+m + 1) + '.0-0';
    }

    ;

    return ret;
  });
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp, loose) {
  ;
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[STAR], '');
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0-0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0-0 <3.5.0-0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0-0 <3.5.0-0
function hyphenReplace($0,
                       from, fM, fm, fp, fpr, fb,
                       to, tM, tm, tp, tpr, tb) {

  if (isX(fM))
    from = '';
  else if (isX(fm))
    from = '>=' + fM + '.0.0-0';
  else if (isX(fp))
    from = '>=' + fM + '.' + fm + '.0-0';
  else
    from = '>=' + from;

  if (isX(tM))
    to = '';
  else if (isX(tm))
    to = '<' + (+tM + 1) + '.0.0-0';
  else if (isX(tp))
    to = '<' + tM + '.' + (+tm + 1) + '.0-0';
  else if (tpr)
    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
  else
    to = '<=' + to;

  return (from + ' ' + to).trim();
}


// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function(version) {
  if (!version)
    return false;
  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version))
      return true;
  }
  return false;
};

function testSet(set, version) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version))
      return false;
  }
  return true;
}

exports.satisfies = satisfies;
function satisfies(version, range, loose) {
  try {
    range = new Range(range, loose);
  } catch (er) {
    return false;
  }
  return range.test(version);
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying(versions, range, loose) {
  return versions.filter(function(version) {
    return satisfies(version, range, loose);
  }).sort(function(a, b) {
    return rcompare(a, b, loose);
  })[0] || null;
}

exports.validRange = validRange;
function validRange(range, loose) {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, loose).range || '*';
  } catch (er) {
    return null;
  }
}

// Determine if version is less than all the versions possible in the range
exports.ltr = ltr;
function ltr(version, range, loose) {
  return outside(version, range, '<', loose);
}

// Determine if version is greater than all the versions possible in the range.
exports.gtr = gtr;
function gtr(version, range, loose) {
  return outside(version, range, '>', loose);
}

exports.outside = outside;
function outside(version, range, hilo, loose) {
  version = new SemVer(version, loose);
  range = new Range(range, loose);

  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt;
      ltefn = lte;
      ltfn = lt;
      comp = '>';
      ecomp = '>=';
      break;
    case '<':
      gtfn = lt;
      ltefn = gte;
      ltfn = gt;
      comp = '<';
      ecomp = '<=';
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }

  // If it satisifes the range it is not outside
  if (satisfies(version, range, loose)) {
    return false;
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    var high = null;
    var low = null;

    comparators.forEach(function(comparator) {
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, loose)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, loose)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false;
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false;
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false;
    }
  }
  return true;
}

// Use the define() function if we're in AMD land
if (typeof define === 'function' && define.amd)
  define(exports);

})(
  typeof exports === 'object' ? exports :
  typeof define === 'function' && define.amd ? {} :
  semver = {}
);

},{}],92:[function(require,module,exports){
(function (process){

/*
usage:

// do something to a list of things
asyncMap(myListOfStuff, function (thing, cb) { doSomething(thing.foo, cb) }, cb)
// do more than one thing to each item
asyncMap(list, fooFn, barFn, cb)

*/

module.exports = asyncMap

function asyncMap () {
  var steps = Array.prototype.slice.call(arguments)
    , list = steps.shift() || []
    , cb_ = steps.pop()
  if (typeof cb_ !== "function") throw new Error(
    "No callback provided to asyncMap")
  if (!list) return cb_(null, [])
  if (!Array.isArray(list)) list = [list]
  var n = steps.length
    , data = [] // 2d array
    , errState = null
    , l = list.length
    , a = l * n
  if (!a) return cb_(null, [])
  function cb (er) {
    if (er && !errState) errState = er

    var argLen = arguments.length
    for (var i = 1; i < argLen; i ++) if (arguments[i] !== undefined) {
      data[i - 1] = (data[i - 1] || []).concat(arguments[i])
    }
    // see if any new things have been added.
    if (list.length > l) {
      var newList = list.slice(l)
      a += (list.length - l) * n
      l = list.length
      process.nextTick(function () {
        newList.forEach(function (ar) {
          steps.forEach(function (fn) { fn(ar, cb) })
        })
      })
    }

    if (--a === 0) cb_.apply(null, [errState].concat(data))
  }
  // expect the supplied cb function to be called
  // "n" times for each thing in the array.
  list.forEach(function (ar) {
    steps.forEach(function (fn) { fn(ar, cb) })
  })
}

}).call(this,require('_process'))
},{"_process":12}],93:[function(require,module,exports){
module.exports = bindActor
function bindActor () {
  var args = 
        Array.prototype.slice.call
        (arguments) // jswtf.
    , obj = null
    , fn
  if (typeof args[0] === "object") {
    obj = args.shift()
    fn = args.shift()
    if (typeof fn === "string")
      fn = obj[ fn ]
  } else fn = args.shift()
  return function (cb) {
    fn.apply(obj, args.concat(cb)) }
}

},{}],94:[function(require,module,exports){
module.exports = chain
var bindActor = require("./bind-actor.js")
chain.first = {} ; chain.last = {}
function chain (things, cb) {
  var res = []
  ;(function LOOP (i, len) {
    if (i >= len) return cb(null,res)
    if (Array.isArray(things[i]))
      things[i] = bindActor.apply(null,
        things[i].map(function(i){
          return (i===chain.first) ? res[0]
           : (i===chain.last)
             ? res[res.length - 1] : i }))
    if (!things[i]) return LOOP(i + 1, len)
    things[i](function (er, data) {
      if (er) return cb(er, res)
      if (data !== undefined) res = res.concat(data)
      LOOP(i + 1, len)
    })
  })(0, things.length) }

},{"./bind-actor.js":93}],95:[function(require,module,exports){
exports.asyncMap = require("./async-map")
exports.bindActor = require("./bind-actor")
exports.chain = require("./chain")

},{"./async-map":92,"./bind-actor":93,"./chain":94}],96:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = extend;
function extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || typeof add !== 'object') return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

},{}],97:[function(require,module,exports){

// Walk through the file-system "database" of installed
// packages, and create a data object related to the
// installed versions of each package.

/*
This will traverse through all node_modules folders,
resolving the dependencies object to the object corresponding to
the package that meets that dep, or just the version/range if
unmet.

Assuming that you had this folder structure:

/path/to
+-- package.json { name = "root" }
`-- node_modules
    +-- foo {bar, baz, asdf}
    | +-- node_modules
    |   +-- bar { baz }
    |   `-- baz
    `-- asdf

where "foo" depends on bar, baz, and asdf, bar depends on baz,
and bar and baz are bundled with foo, whereas "asdf" is at
the higher level (sibling to foo), you'd get this object structure:

{ <package.json data>
, path: "/path/to"
, parent: null
, dependencies:
  { foo :
    { version: "1.2.3"
    , path: "/path/to/node_modules/foo"
    , parent: <Circular: root>
    , dependencies:
      { bar:
        { parent: <Circular: foo>
        , path: "/path/to/node_modules/foo/node_modules/bar"
        , version: "2.3.4"
        , dependencies: { baz: <Circular: foo.dependencies.baz> }
        }
      , baz: { ... }
      , asdf: <Circular: asdf>
      }
    }
  , asdf: { ... }
  }
}

Unmet deps are left as strings.
Extraneous deps are marked with extraneous:true
deps that don't meet a requirement are marked with invalid:true
deps that don't meet a peer requirement are marked with peerInvalid:true

to READ(packagefolder, parentobj, name, reqver)
obj = read package.json
installed = ./node_modules/*
if parentobj is null, and no package.json
  obj = {dependencies:{<installed>:"*"}}
deps = Object.keys(obj.dependencies)
obj.path = packagefolder
obj.parent = parentobj
if name, && obj.name !== name, obj.invalid = true
if reqver, && obj.version !satisfies reqver, obj.invalid = true
if !reqver && parentobj, obj.extraneous = true
for each folder in installed
  obj.dependencies[folder] = READ(packagefolder+node_modules+folder,
                                  obj, folder, obj.dependencies[folder])
# walk tree to find unmet deps
for each dep in obj.dependencies not in installed
  r = obj.parent
  while r
    if r.dependencies[dep]
      if r.dependencies[dep].verion !satisfies obj.dependencies[dep]
        WARN
        r.dependencies[dep].invalid = true
      obj.dependencies[dep] = r.dependencies[dep]
      r = null
    else r = r.parent
return obj


TODO:
1. Find unmet deps in parent directories, searching as node does up
as far as the left-most node_modules folder.
2. Ignore anything in node_modules that isn't a package folder.

*/

try {
  var fs = require("graceful-fs")
} catch (er) {
  var fs = require("fs")
}

var path = require("path")
var asyncMap = require("slide").asyncMap
var semver = require("semver")
var readJson = require("read-package-json")
var url = require("url")
var util = require("util")
var extend = require("util-extend")

module.exports = readInstalled

function readInstalled (folder, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  } else {
    opts = extend({}, opts)
  }

  if (typeof opts.depth !== 'number')
    opts.depth = Infinity

  opts.depth = Math.max(0, opts.depth)

  if (typeof opts.log !== 'function')
    opts.log = function () {}

  opts.dev = !!opts.dev

  readInstalled_(folder, null, null, null, 0, opts, function (er, obj) {
    if (er) return cb(er)
    // now obj has all the installed things, where they're installed
    // figure out the inheritance links, now that the object is built.
    resolveInheritance(obj, opts)
    markExtraneous(obj)
    cb(null, obj)
  })
}

var rpSeen = {}
function readInstalled_ (folder, parent, name, reqver, depth, opts, cb) {
  var installed
    , obj
    , real
    , link

  fs.readdir(path.resolve(folder, "node_modules"), function (er, i) {
    // error indicates that nothing is installed here
    if (er) i = []
    installed = i.filter(function (f) { return f.charAt(0) !== "." })
    next()
  })

  readJson(path.resolve(folder, "package.json"), function (er, data) {
    obj = copy(data)

    if (!parent) {
      obj = obj || true
      er = null
    }
    return next(er)
  })

  fs.lstat(folder, function (er, st) {
    if (er) {
      if (!parent) real = true
      return next(er)
    }
    fs.realpath(folder, function (er, rp) {
      //console.error("realpath(%j) = %j", folder, rp)
      real = rp
      if (st.isSymbolicLink()) link = rp
      next(er)
    })
  })

  var errState = null
    , called = false
  function next (er) {
    if (errState) return
    if (er) {
      errState = er
      return cb(null, [])
    }
    //console.error('next', installed, obj && typeof obj, name, real)
    if (!installed || !obj || !real || called) return
    called = true
    if (rpSeen[real]) return cb(null, rpSeen[real])
    if (obj === true) {
      obj = {dependencies:{}, path:folder}
      installed.forEach(function (i) { obj.dependencies[i] = "*" })
    }
    if (name && obj.name !== name) obj.invalid = true
    obj.realName = name || obj.name
    obj.dependencies = obj.dependencies || {}

    // "foo":"http://blah" and "foo":"latest" are always presumed valid
    if (reqver
        && semver.validRange(reqver, true)
        && !semver.satisfies(obj.version, reqver, true)) {
      obj.invalid = true
    }

    if (parent) {
      var deps = parent.dependencies || {}
      var inDeps = name in deps
      var devDeps = parent.devDependencies || {}
      var inDev = opts.dev && (name in devDeps)
      if (!inDeps && !inDev) {
        obj.extraneous = true
      }
    }

    obj.path = obj.path || folder
    obj.realPath = real
    obj.link = link
    if (parent && !obj.link) obj.parent = parent
    rpSeen[real] = obj
    obj.depth = depth
    //if (depth >= opts.depth) return cb(null, obj)
    asyncMap(installed, function (pkg, cb) {
      var rv = obj.dependencies[pkg]
      if (!rv && obj.devDependencies && opts.dev)
        rv = obj.devDependencies[pkg]

      if (depth > opts.depth) {
        obj.dependencies = {}
        return cb(null, obj)
      }

      readInstalled_( path.resolve(folder, "node_modules/"+pkg)
                    , obj, pkg, obj.dependencies[pkg], depth + 1, opts
                    , cb )

    }, function (er, installedData) {
      if (er) return cb(er)
      installedData.forEach(function (dep) {
        obj.dependencies[dep.realName] = dep
      })

      // any strings here are unmet things.  however, if it's
      // optional, then that's fine, so just delete it.
      if (obj.optionalDependencies) {
        Object.keys(obj.optionalDependencies).forEach(function (dep) {
          if (typeof obj.dependencies[dep] === "string") {
            delete obj.dependencies[dep]
          }
        })
      }
      return cb(null, obj)
    })
  }
}

// starting from a root object, call findUnmet on each layer of children
var riSeen = []
function resolveInheritance (obj, opts) {
  if (typeof obj !== "object") return
  if (riSeen.indexOf(obj) !== -1) return
  riSeen.push(obj)
  if (typeof obj.dependencies !== "object") {
    obj.dependencies = {}
  }
  Object.keys(obj.dependencies).forEach(function (dep) {
    findUnmet(obj.dependencies[dep], opts)
  })
  Object.keys(obj.dependencies).forEach(function (dep) {
    resolveInheritance(obj.dependencies[dep], opts)
  })
  findUnmet(obj, opts)
}

// find unmet deps by walking up the tree object.
// No I/O
var fuSeen = []
function findUnmet (obj, opts) {
  if (fuSeen.indexOf(obj) !== -1) return
  fuSeen.push(obj)
  //console.error("find unmet", obj.name, obj.parent && obj.parent.name)
  var deps = obj.dependencies = obj.dependencies || {}

  //console.error(deps)
  Object.keys(deps)
    .filter(function (d) { return typeof deps[d] === "string" })
    .forEach(function (d) {
      //console.error("find unmet", obj.name, d, deps[d])
      var r = obj.parent
        , found = null
      while (r && !found && typeof deps[d] === "string") {
        // if r is a valid choice, then use that.
        found = r.dependencies[d]
        if (!found && r.realName === d) found = r

        if (!found) {
          r = r.link ? null : r.parent
          continue
        }
        // "foo":"http://blah" and "foo":"latest" are always presumed valid
        if ( typeof deps[d] === "string"
            && semver.validRange(deps[d], true)
            && !semver.satisfies(found.version, deps[d], true)) {
          // the bad thing will happen
          opts.log("unmet dependency", obj.path + " requires "+d+"@'"+deps[d]
             +"' but will load\n"
             +found.path+",\nwhich is version "+found.version
             )
          found.invalid = true
        }
        deps[d] = found
      }

    })

  var peerDeps = obj.peerDependencies = obj.peerDependencies || {}
  Object.keys(peerDeps).forEach(function (d) {
    var dependency

    if (!obj.parent) {
      dependency = obj.dependencies[d]

      // read it as a missing dep
      if (!dependency) {
        obj.dependencies[d] = peerDeps[d]
      }
    } else {
      var r = obj.parent
      while (r && !dependency) {
        dependency = r.dependencies && r.dependencies[d]
        r = r.link ? null : r.parent
      }
    }

    if (!dependency) {
      // mark as a missing dep!
      obj.dependencies[d] = peerDeps[d]
    } else if (!semver.satisfies(dependency.version, peerDeps[d], true)) {
      dependency.peerInvalid = true
    } else {
      dependency.extraneous = dependency.extraneous || false
    }
  })

  return obj
}

function recursivelyMarkExtraneous (obj, extraneous) {
  // stop recursion if we're not changing anything
  if (obj.extraneous === extraneous) return

  obj.extraneous = extraneous
  var deps = obj.dependencies = obj.dependencies || {}
  Object.keys(deps).forEach(function(d){
    recursivelyMarkExtraneous(deps[d], extraneous)
  });
}

function markExtraneous (obj) {
  // start from the root object and mark as non-extraneous all modules that haven't been previously flagged as
  // extraneous then propagate to all their dependencies
  var deps = obj.dependencies = obj.dependencies || {}
  Object.keys(deps).forEach(function(d){
    if (!deps[d].extraneous){
      recursivelyMarkExtraneous(deps[d], false);
    }
  });
}

function copy (obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(copy)

  var o = {}
  for (var i in obj) o[i] = copy(obj[i])
  return o
}

},{"fs":2,"graceful-fs":58,"path":11,"read-package-json":90,"semver":91,"slide":95,"url":17,"util":19,"util-extend":96}],98:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}]},{},[1]);
