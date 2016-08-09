'use strict'

exports.up = (knex) => knex.schema.createTable('article_or_tag', (table) => {
  table.increments()
  table.string('source_type').notNullable()
  table.integer('source_id').notNullable()
  table.timestamp('deleted_at')
  table.timestamps()
})

exports.down = (knex) => knex.schema.dropTable('article_or_tag')
