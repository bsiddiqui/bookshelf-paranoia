'use strict'

const co = require('co')
const db = require('../db')

exports.generate = co.wrap(function * (tableName, tableSchema, bookshelfConfig) {
  // Setup the new table
  yield db.knex.schema.createTable(tableName, tableSchema)

  // Create a new bookshelf instance and hook it
  const bookshelf = require('bookshelf')(db.knex)
  bookshelfConfig.call(bookshelfConfig, bookshelf)

  return bookshelf
})

exports.altFieldTable = co.wrap(function * (bookshelfConfig) {
  const bookshelf = yield exports.generate('test', (table) => {
    table.increments()
    table.timestamp('deleted')
  }, bookshelfConfig)

  // Create one row for testing
  yield bookshelf.knex('test').insert({ id: 1 })

  return bookshelf
})

exports.sentinelTable = co.wrap(function * (bookshelfConfig) {
  const bookshelf = yield exports.generate('test', (table) => {
    table.increments()
    table.integer('value')
    table.timestamp('deleted_at')
    table.boolean('active').nullable()
    table.unique(['value', 'active'])
  }, bookshelfConfig)

  // Create one row for testing
  yield bookshelf.knex('test').insert({ id: 1 })

  return bookshelf
})
