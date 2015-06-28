
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'sync', ->
  describe 'undefined', ->
    it 'default to true', (next) ->
      current = 0
      each( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] )
      .parallel( 4 )
      .sync()
      .on 'item', (element, index) ->
        index.should.eql current
        element.should.eql current
        current++
      .on 'end', ->
        current.should.eql 10
        next()
  describe 'false', ->
    it 'run async', (next) ->
      current = 0
      each( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] )
      .parallel( 4 )
      .sync( false )
      .on 'item', (element, next) ->
        typeof next is 'function'
        current++
      .on 'end', ->
        current.should.eql 10
        next()
  describe 'true', ->
    it 'run item event synchronously', (next) ->
      current = 0
      each( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] )
      .parallel( 4 )
      .sync( true )
      .on 'item', (element, index) ->
        index.should.eql current
        element.should.eql current
        current++
      .on 'end', ->
        current.should.eql 10
        next()
    it 'emit thrown error', (next) ->
      current = 0
      each( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] )
      .parallel( 4 )
      .sync( true )
      .on 'item', (element, index) ->
        throw new Error 'Argh'
      .on 'error', (err) ->
        err.message.should.eql 'Argh'
        next()
    it 'emit returned error', (next) ->
      current = 0
      each( [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] )
      .parallel( 4 )
      .sync( true )
      .on 'item', (element, index) ->
        return new Error 'Argh'
      .on 'error', (err) ->
        err.message.should.eql 'Argh'
        next()