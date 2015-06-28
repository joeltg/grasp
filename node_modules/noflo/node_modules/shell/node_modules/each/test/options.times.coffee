
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'Sequential', ->
  it 'should run nothing 10 times', (next) ->
    started = ended = 0
    each()
    .parallel(null)
    .times(10)
    .on 'item', (element, index, next) ->
      # Check provided values
      started.should.eql ended
      should.not.exist element
      index.should.eql 0
      started++
      setTimeout ->
        ended++
        started.should.eql ended
        next()
      , 10
    .on 'end', ->
      started.should.eql 10
      next()
  it 'should run an array 10 times', (next) ->
    started = ended = 0
    data = ['a', 'b', 'c']
    each(data)
    .parallel(null)
    .times(10)
    .on 'item', (element, index, next) ->
      # Check provided values
      started.should.eql ended
      element.should.eql data[Math.floor started / 10]
      index.should.eql Math.floor started / 10
      started++
      setTimeout ->
        ended++
        started.should.eql ended
        next()
      , 10
    .on 'end', ->
      started.should.eql 30
      next()

describe 'Parallel', ->
  it 'should run nothing 10 times', (next) ->
    started = ended = 0
    each()
    .parallel(true)
    .times(10)
    .on 'item', (element, index, next) ->
      started.should.eql 0
      ended.should.eql 0
      process.nextTick -> started++
      setTimeout ->
        ended++
        started.should.eql 10
        next()
      , 10
    .on 'end', ->
      started.should.eql 10
      next()
  it 'should run an array 10 times', (next) ->
    started = ended = 0
    each(['a', 'b', 'c'])
    .parallel(true)
    .times(10)
    .on 'item', (element, index, next) ->
      started.should.eql 0
      ended.should.eql 0
      process.nextTick -> started++
      setTimeout ->
        ended++
        started.should.eql 30
        next()
      , 10
    .on 'end', ->
      started.should.eql 30
      next()

describe 'Concurrent', ->
  it 'should run nothing 10 times', (next) ->
    started = ended = 0
    each()
    .parallel(3)
    .times(10)
    .on 'item', (element, index, next) ->
      process.nextTick -> started++
      setTimeout ->
        ended++
        (started % 3).should.eql 0 unless started is 10
        ended.should.be.above started - 3
        next()
      , 100
    .on 'end', ->
      started.should.eql 10
      next()
  it 'should run an array 10 times', (next) ->
    started = ended = 0
    each(['a', 'b', 'c'])
    .parallel(3)
    .times(10)
    .on 'item', (element, index, next) ->
      started++
      setTimeout ->
        running = started - ended
        total = 10 * 3
        if started is 30
        then running.should.eql started - ended
        else running.should.eql 3
        ended++
        next()
      , 100
    .on 'end', ->
      ended.should.eql 30
      next()