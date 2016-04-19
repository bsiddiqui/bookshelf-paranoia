'use strict'

exports.up = (knex) => knex.schema.createTable('comments', (table) => {
  table.increments()
  table.integer('user_id').references('users.id')
  table.integer('article_id').references('articles.id')
  table.text('text')
  table.timestamp('deleted_at')
  table.timestamps()
})

exports.down = (knex) => knex.schema.dropTable('comments')
