'use strict'

exports.up = (knex) => knex.schema.createTable('articles', (table) => {
  table.increments()
  table.integer('user_id').references('users.id')
  table.string('title')
  table.string('body')
  table.timestamp('deleted_at')
  table.timestamps()
})

exports.down = (knex) => knex.schema.dropTable('articles')
