
should = require 'should'
each = if process.env.EACH_COV then require '../lib-cov/each' else require '../lib/each'

describe 'files', ->
  it 'should traverse a globing expression', (next) ->
    files = []
    each()
    .parallel(true)
    .files("#{__dirname}/../test/mode.*.coffee")
    .on 'item', (file, next) ->
      files.push file
      process.nextTick next
    .on 'end', ->
      files.length.should.eql 2
      next()
  it 'should traverse multiple globing expressions', (next) ->
    files = []
    each()
    .parallel(true)
    .files([
      "#{__dirname}/../src/*.coffee"
      "#{__dirname}/../test/mode.*.coffee"
    ])
    .on 'item', (file, next) ->
      files.push file
      process.nextTick next
    .on 'end', ->
      files.length.should.eql 3
      next()
  it 'should call end if no match', (next) ->
    files = []
    each()
    .parallel(true)
    .files("#{__dirname}/../test/does/not/exist")
    .on 'item', (file, next) ->
      files.push file
      process.nextTick next
    .on 'end', ->
      files.should.eql []
      next()
  it 'should emit if match a file', (next) ->
    files = []
    each()
    .parallel(true)
    .files("#{__dirname}/api.files.coffee")
    .on 'item', (file, next) ->
      files.push file
      process.nextTick next
    .on 'end', ->
      files.should.eql ["#{__dirname}/api.files.coffee"]
      next()
  it 'should emit if match a directory', (next) ->
    files = []
    each()
    .parallel(true)
    .files(__dirname)
    .on 'item', (file, next) ->
      files.push file
      process.nextTick next
    .on 'end', ->
      files.should.eql [__dirname]
      next()

