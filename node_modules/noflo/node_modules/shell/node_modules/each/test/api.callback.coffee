
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'Callback', ->
  describe 'array', ->
    it 'should provide only next argument', (next) ->
      each( [ 'a', 'b', 'c' ] )
      .on 'item', (next) ->
        arguments.length.should.eql 1
        next()
      .on 'end', -> next()
    it 'should provide element and next argument', (next) ->
      each( [ 'a', 'b', 'c' ] )
      .on 'item', (element, next) ->
        ['a', 'b', 'c'].should.containEql element
        next()
      .on 'end', -> next()
    it 'should provide element, index and next argument', (next) ->
      each( [ 'a', 'b', 'c' ] )
      .on 'item', (element, index, next) ->
        ['a', 'b', 'c'].should.containEql element
        index.should.be.a.Number
        next()
      .on 'end', -> next()
    it 'throw error with no argument', (next) ->
      each( ['a', 'b', 'c'] )
      .on 'item', () ->
        false.should.be.true
      .on 'error', (err) ->
        err.message.should.eql 'Invalid arguments in item callback'
        next()
  describe 'object', ->
    it 'should provide only next argument', (next) ->
      each( {a: 1, b: 2, c: 3} )
      .on 'item', (next) ->
        arguments.length.should.eql 1
        next()
      .on 'end', -> next()
    it 'should provide value and next argument', (next) ->
      each( {a: 1, b: 2, c: 3} )
      .on 'item', (value, next) ->
        value.should.be.a.Number
        next()
      .on 'end', -> next()
    it 'should provide key, value and next argument', (next) ->
      each( {a: 1, b: 2, c: 3} )
      .on 'item', (key, value, next) ->
        ['a', 'b', 'c'].should.containEql key
        value.should.be.a.Number
        next()
      .on 'end', -> next()
    it 'should provide key, value, index and next argument', (next) ->
      each( {a: 1, b: 2, c: 3} )
      .on 'item', (key, value, counter, next) ->
        ['a', 'b', 'c'].should.containEql key
        value.should.be.a.Number
        counter.should.be.a.Number
        next()
      .on 'end', -> next()
    it 'throw error with no argument', (next) ->
      each( {a: 1, b: 2, c: 3} )
      .on 'item', () ->
        false.should.be.true
      .on 'error', (err) ->
        err.message.should.eql 'Invalid arguments in item callback'
        next()
