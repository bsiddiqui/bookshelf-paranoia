'use strict'

exports.up = (knex) => knex.schema.createTable('sessions', (table) => {
  table.increments()
  table.integer('user_id').references('users.id')
  table.text('token')
  table.timestamp('deleted_at')
  table.timestamps()
})

exports.down = (knex) => knex.schema.dropTable('sessions')
