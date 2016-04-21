'use strict'

let co = require('co')
let db = require('../db')

exports.generate = co.wrap(function * (tableName, tableSchema, bookshelfConfig) {
  // Setup the new table
  yield db.knex.schema.createTable(tableName, tableSchema)

  // Create a new bookshelf instance and hook it
  let bookshelf = require('bookshelf')(db.knex)
  bookshelfConfig.call(bookshelfConfig, bookshelf)

  return bookshelf
})

exports.testTable = co.wrap(function * (bookshelfConfig) {
  let bookshelf = yield exports.generate('test', (table) => {
    table.increments()
    table.timestamp('deleted')
  }, bookshelfConfig)

  // Create one row for testing
  yield bookshelf.knex('test').insert({ id: 1 })

  return bookshelf
})
