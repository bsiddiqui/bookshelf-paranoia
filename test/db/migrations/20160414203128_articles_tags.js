'use strict'

exports.up = (knex) => knex.schema.createTable('articles_tags', (table) => {
  table.increments()
  table.integer('tag_id').references('tags.id')
  table.integer('article_id').references('articles.id')
  table.timestamps()
})

exports.down = (knex) => knex.schema.dropTable('articles_tags')
