
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'Concurrent', ->
  it 'array # multiple elements # async callbacks', (next) ->
    current = 0
    end_called = false
    each( [ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      element.id.should.eql current
      setTimeout next, 100
    .on 'end', ->
      current.should.eql 9
      end_called = true
    .on 'both', (err) ->
      should.not.exist err
      end_called.should.be.ok
      next()
  it 'array # one element # async callbacks', (next) ->
    current = 0
    each( [ {id: 1} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      element.id.should.eql current
      setTimeout next, 100
    .on 'error', (err) ->
      should.not.exist err
    .on 'end', ->
      current.should.eql 1
      setTimeout next, 100
  it 'array # empty', (next) ->
    current = 0
    each( [] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      current++
      next()
    .on 'error', (err) ->
      should.not.exist err
    .on 'both', ->
      current.should.eql 0
      next()
  it 'array sync callback', (next) ->
    current = 0
    each( [ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      element.id.should.eql current
      next()
    .on 'error', (err) ->
      should.not.exist err
    .on 'end', ->
      current.should.eql 9
      next()
  it 'object async callbacks', (next) ->
    current = 0
    each( id_1: 1, id_2: 2, id_3: 3, id_4: 4, id_5: 5, id_6: 6, id_7: 7, id_8: 8, id_9: 9 )
    .parallel( 4 )
    .on 'item', (key, value, next) ->
      current++
      key.should.eql "id_#{current}"
      value.should.eql current
      setTimeout next, 100
    .on 'error', (err) ->
      should.not.exist err
    .on 'end', ->
      current.should.eql 9
      setTimeout next, 100
  it 'object sync callbacks', (next) ->
    current = 0
    each( id_1: 1, id_2: 2, id_3: 3, id_4: 4, id_5: 5, id_6: 6, id_7: 7, id_8: 8, id_9: 9 )
    .parallel( 4 )
    .on 'item', (key, value, next) ->
      current++
      key.should.eql "id_#{current}"
      value.should.eql current
      next()
    .on 'error', (err) ->
      should.not.exist err
    .on 'end', ->
      current.should.eql 9
      next()
  it 'function', (next) ->
    current = 0
    each( (c) -> c() )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      element.should.be.a.Function
      element next
    .on 'error', (err) ->
      should.not.exist err
    .on 'end', ->
      current.should.eql 1
      next()
