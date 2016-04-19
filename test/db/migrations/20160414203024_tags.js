'use strict'

exports.up = (knex) => knex.schema.createTable('tags', (table) => {
  table.increments()
  table.string('name')
  table.timestamp('deleted_at')
  table.timestamps()
})

exports.down = (knex) => knex.schema.dropTable('tags')
