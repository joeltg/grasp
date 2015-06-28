
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'Close', ->
  it 'should work in sequential', (next) ->
    count = 0
    eacher = each([0,1,2,3,4,5,6,7,8,9])
    .parallel(false)
    .on 'item', (element, next) ->
      count++
      return next() if count < 5
      return eacher.close() if count is 5
      false.should.be.ok
    .on 'error', (err) ->
      next err
    .on 'end', ->
      count.should.eql 5
      next()
  it 'should work in parallel', (next) ->
    count = 0
    eacher = each([0,1,2,3,4,5,6,7,8,9])
    .parallel(true)
    .on 'item', (element, next) ->
      count++
      return next() if count < 5
      return eacher.close() if count is 5
      false.should.be.ok
    .on 'error', (err) ->
      next err
    .on 'end', ->
      count.should.eql 5
      next()
  it 'should work with times', (next) ->
    count = 0
    eacher = each()
    .parallel(false)
    .times(10)
    .on 'item', (element, next) ->
      count++
      return next() if count < 5
      return eacher.close() if count is 5
      false.should.be.ok
    .on 'error', (err) ->
      next err
    .on 'end', ->
      count.should.eql 5
      next()