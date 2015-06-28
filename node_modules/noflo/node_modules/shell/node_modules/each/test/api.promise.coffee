
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'promise', ->
  describe 'async', ->
    it 'run arguments only contains next', (next) ->
      each( [ 'a', 'b', 'c' ] )
      .run (next) ->
        arguments.length.should.eql 1
        next()
      .then -> next()
    it 'run arguments contains element and next', (next) ->
      elements = []
      each( [ 'a', 'b', 'c' ] )
      .run (element, next) ->
        elements.push element
        next()
      .then (err) ->
        return next err if err
        elements.should.eql [ 'a', 'b', 'c' ]
        next()
  describe 'sync', ->
    it 'run arguments is empty', (next) ->
      each( [ 'a', 'b', 'c' ] )
      .run ->
        arguments.length.should.eql 0
      .then -> next()
    it 'run arguments contains element', (next) ->
      elements = []
      each( [ 'a', 'b', 'c' ] )
      .sync()
      .run (element) ->
        elements.push element
      .then (err) ->
        return next err if err
        elements.should.eql [ 'a', 'b', 'c' ]
        next()