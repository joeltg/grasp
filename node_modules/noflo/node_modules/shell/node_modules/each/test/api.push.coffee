

should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'Write', ->

  it 'accept array elements', (next) ->
    each()
    .push('hello')
    .push('each')
    .on 'item', (item, index, next) ->
      item.should.eql 'hello' if index is 0
      next()
    .on 'both', (err, count) ->
      should.not.exist err
      count.should.eql 2
      next()

  it 'accept key value elements', (next) ->
    each()
    .push('hello', 'each')
    .push('youre', 'welcome')
    .on 'item', (key, value, next) ->
      value.should.eql 'each' if key is 'hello'
      next()
    .on 'both', (err, count) ->
      should.not.exist err
      count.should.eql 2
      next()
