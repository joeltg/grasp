
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'Readable Stream', ->
  it 'next before resume', (next) ->
    eacher = each( [ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      if element.id is 2
        eacher.pause()
        setTimeout ->
          eacher.resume()
        , 100
      next()
    .on 'both', (err, errors) ->
      should.not.exist err
      next()
  it 'next after resume', (next) ->
    eacher = each( [ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      if element.id is 2
        eacher.pause()
        setTimeout ->
          eacher.resume()
          next()
        , 100
      else
        next()
    .on 'both', (err, errors) ->
      should.not.exist err
      next()
  it 'multiple pause # next before resume', (next) ->
    eacher = each( [ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      if element.id % 2 is 0
        eacher.pause()
        setTimeout ->
          eacher.resume()
          next()
        , 10 * element.id
      else
        next()
    .on 'both', (err, errors) ->
      should.not.exist err
      next()
  it 'multiple pause # next after resume', (next) ->
    eacher = each( [ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}, {id: 8}, {id: 9} ] )
    .parallel( 4 )
    .on 'item', (element, index, next) ->
      if element.id % 2 is 0
        eacher.pause()
        setTimeout ->
          eacher.resume()
        , 10 * element.id
      next()
    .on 'both', (err, errors) ->
      should.not.exist err
      next()
