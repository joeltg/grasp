
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'Error', ->
  it 'Concurrent # error and both callbacks', (next) ->
    current = 0
    error_called = false
    error_assert = (err) ->
      current.should.eql 9
      err.message.should.eql 'Multiple errors (2)'
      err.errors.length.should.eql 2
      err.errors[0].message.should.eql 'Testing error in 6'
      err.errors[1].message.should.eql 'Testing error in 7'
    each( [ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9}, {id: 10}, {id: 11} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      setTimeout ->
        if element.id is 6 or element.id is 7
          next new Error "Testing error in #{element.id}"
        else 
          next()
      , 100
    .on 'error', (err) ->
      error_assert err
      error_called = true
    .on 'end', (err) ->
      false.should.be.ok
    .on 'both', (err) ->
      error_called.should.be.ok 
      error_assert err
      next()
  it 'Concurrent handle thrown error', (next) ->
    current = 0
    error_called = false
    error_assert = (err) ->
      current.should.eql 6
      err.message.should.eql 'Testing error in 6'
      err.should.not.have.property 'errors'
    each( [ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9}, {id: 10}, {id: 11} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      if element.id is 6 or element.id is 7
        throw new Error "Testing error in #{element.id}"
      else 
        next()
    .on 'error', (err) ->
      error_assert err
      error_called = true
    .on 'end', (err) ->
      false.should.not.be.ok
    .on 'both', (err) ->
      error_called.should.be.ok 
      error_assert err
      next()
  it 'Parallel # multiple errors # error callback', (next) ->
    # when multiple errors are thrown, a new error object is created
    # with a message indicating the number of errors. The original 
    # errors are available as an array in the second argument of the
    # `error` event.
    current = 0
    each( [{id: 1}, {id: 2}, {id: 3}, {id: 4}] )
    .parallel( true )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      setTimeout ->
        if element.id is 1 or element.id is 3
          next( new Error "Testing error in #{element.id}" )
        else
          next()
      , 100
    .on 'error', (err) ->
      err.message.should.eql 'Multiple errors (2)'
      err.errors.length.should.eql 2
      err.errors[0].message.should.eql 'Testing error in 1'
      err.errors[1].message.should.eql 'Testing error in 3'
      return next()
    .on 'end', (err) ->
      false.should.be.ok 
  it 'Parallel # single error # error callback', (next) ->
    # when on one error is thrown, the error is passed to
    # the `error` event as is as well as a single element array 
    # of the second argument.
    current = 0
    each( [{id: 1}, {id: 2}, {id: 3}, {id: 4}] )
    .parallel( true )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      setTimeout ->
        if element.id is 3
          next( new Error "Testing error in #{element.id}" )
        else
          next()
      , 100
    .on 'error', (err) ->
      err.message.should.eql 'Testing error in 3'
      return next()
    .on 'end', (err) ->
      false.should.be.ok 
  it 'Parallel # async # both callback', (next) ->
    current = 0
    each( [{id: 1}, {id: 2}, {id: 3}, {id: 4}] )
    .parallel( true )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      setTimeout ->
        if element.id is 1 or element.id is 3
          next( new Error "Testing error in #{element.id}" )
        else
          next()
      , 100
    .on 'both', (err) ->
      err.message.should.eql 'Multiple errors (2)'
      err.errors.length.should.eql 2
      err.errors[0].message.should.eql 'Testing error in 1', 
      err.errors[1].message.should.eql 'Testing error in 3'
      return next()
    .on 'end', (err) ->
      false.should.be.ok 
  it 'Parallel # sync # both callback', (next) ->
    current = 0
    each( [{id: 1}, {id: 2}, {id: 3}, {id: 4}] )
    .parallel( true )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      if element.id is 1 or element.id is 3
        next( new Error "Testing error in #{element.id}" )
      else setTimeout next, 100
    .on 'both', (err) ->
      # In this specific case, since the item handler
      # send error sequentially, we are only receiving
      # one error
      err.message.should.eql 'Testing error in 1'
      next()
  it 'Sequential # sync # error callback', (next) ->
    current = 0
    each( [ {id: 1}, {id: 2}, {id: 3} ] )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      if element.id is 2
        next( new Error 'Testing error' )
      else next()
    .on 'error', (err) ->
      err.message.should.eql 'Testing error'
      next()
    .on 'end', (err) ->
      false.should.be.ok 
  it 'Sequential # async # error callback', (next) ->
    current = 0
    each( [ {id: 1}, {id: 2}, {id: 3} ] )
    .on 'item', (element, index, next) ->
      index.should.eql current
      current++
      if element.id is 2
        setTimeout -> 
          next( new Error 'Testing error' )
        , 100
      else setTimeout next, 100
    .on 'error', (err) ->
      err.message.should.eql 'Testing error'
      next()
    .on 'end', (err) ->
      false.should.be.ok 
  it 'catch undefined', (next) ->
    each( [ 1, 2, 3 ] )
    .on 'item', (element, index, next) ->
      Toto.should.throw.an.error
    .on 'error', (err) ->
      err.message.should.eql 'Toto is not defined'
      next()
    .on 'end', (err) ->
      false.should.be.ok 
  it 'catch TypeError in concurrent mode', (next) ->
    each( [ 1, 2, 3 ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      undefined.should.throw.an.error
    .on 'error', (err) ->
      err.message.should.eql 'Cannot read property \'should\' of undefined'
      next()
    .on 'end', (err) ->
      false.should.be.ok
  it 'rethrow if error inside end', (next) ->
    lsts = process.listeners 'uncaughtException'
    process.removeAllListeners 'uncaughtException'
    process.on 'uncaughtException', (err) ->
      err.message.should.eql 'nonexistentFunc is not defined'
      process.removeAllListeners 'uncaughtException'
      for lst in lsts
        process.on 'uncaughtException', lst
      next()
    count = 0
    eacher = each()
    .parallel(null)
    .times(10)
    .on 'item', (element, index, next) ->
      count++
      return next() if index < 5
      return eacher.end() if index is 5
      false.should.be.ok
    .on 'error', (err) ->
      next err
    .on 'end', ->
      nonexistentFunc()
  