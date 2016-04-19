'use strict'

exports.up = (knex) => knex.schema.createTable('users', (table) => {
  table.increments()
  table.string('name')
  table.string('email')
  table.timestamps()
})

exports.down = (knex) => knex.schema.dropTable('users')
