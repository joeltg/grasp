
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'Sequential', ->
  describe 'mode', ->
    it 'is default', (next) ->
      current = 0
      id2_called = false
      each( [ {id: 1}, {id: 2}, {id: 3} ] )
      .parallel(null)
      .on 'item', (element, index, next) ->
        id2_called = true if element.id is 2
        if index is 0 then setTimeout ->
          id2_called.should.not.be.ok
          next()
        , 100 else next()
      .on 'end', ->
        next()
  describe 'input', ->
    it 'array', (next) ->
      current = 0
      end_called = false
      each( [ {id: 1}, {id: 2}, {id: 3} ] )
      .on 'item', (element, index, next) ->
        index.should.eql current
        current++
        element.id.should.eql current
        setTimeout next, 100
      .on 'end', ->
        current.should.eql 3
        end_called = true
      .on 'both', (err) ->
        should.not.exist err
        end_called.should.be.ok
        next()
    it 'object', (next) ->
      current = 0
      each( {id_1: 1, id_2: 2, id_3: 3} )
      .on 'item', (key, value, next) ->
        current++
        key.should.eql "id_#{current}"
        value.should.eql current
        setTimeout next, 100
      .on 'error', (err) ->
        should.not.exist err
      .on 'end', ->
        current.should.eql 3
        next()
    it 'undefined', (next) ->
      current = 0
      each( undefined )
      .on 'item', (element, index, next) ->
        should.not.exist true
      .on 'error', (err) ->
        should.not.exist err
      .on 'end', ->
        current.should.eql 0
        next()
    it 'null', (next) ->
      current = 0
      each( null )
      .on 'item', (element, index, next) ->
        should.not.exist true
      .on 'error', (err) ->
        should.not.exist err
      .on 'end', ->
        current.should.eql 0
        next()
    it 'string', (next) ->
      current = 0
      each( 'id_1' )
      .on 'item', (element, index, next) ->
        index.should.eql current
        current++
        element.should.eql "id_1"
        setTimeout next, 100
      .on 'error', (err) ->
        should.not.exist err
      .on 'end', ->
        current.should.eql 1
        next()
    it 'number', (next) ->
      current = 0
      each( 3.14 )
      .on 'item', (element, index, next) ->
        index.should.eql current
        current++
        element.should.eql 3.14
        setTimeout next, 100
      .on 'error', (err) ->
        should.not.exist err
      .on 'end', ->
        current.should.eql 1
        next()
    it 'function', (next) ->
      current = 0
      source = (c) -> c()
      each(source)
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
  describe 'multiple call error', ->
    it 'with end already thrown', (next) ->
      # Nothing we can do here, end has been thrown and we can not wait for it
      # Catch the uncatchable
      lsts = process.listeners 'uncaughtException'
      process.removeAllListeners 'uncaughtException'
      process.on 'uncaughtException', (err) ->
        # Test
        ended.should.be.ok
        err.message.should.eql 'Multiple call detected'
        # Cleanup and finish
        process.removeAllListeners 'uncaughtException'
        for lst in lsts
          process.on 'uncaughtException', lst
        next()
      # Run the test
      ended = false
      each( [ 'a', 'b', 'c' ] )
      .parallel(1)
      .on 'item', (item, next) ->
        next()
        # We only want to generate one error
        return unless item is 'a'
        process.nextTick next
      .on 'error', (err) ->
        false.should.be.ok
      .on 'end', ->
        ended = true
    it 'with end not yet thrown', (next) ->
      ended = false
      each( [ 'a', 'b', 'c' ] )
      .parallel(1)
      .on 'item', (item, next) ->
        process.nextTick ->
          next()
          # We only want to generate one error
          return unless item is 'a'
          process.nextTick next
      .on 'error', (err) ->
        ended.should.not.be.ok
        err.message.should.eql 'Multiple call detected'
        next()
      .on 'end', ->
        ended = true

