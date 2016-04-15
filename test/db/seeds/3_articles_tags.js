'use strict'

let timestamper = require('../../fixtures/timestamper')

exports.seed = (knex, Promise) => {
  let articlesTags = timestamper([
    { id: 1, article_id: 1, tag_id: 1 },
    { id: 2, article_id: 1, tag_id: 2 },
    { id: 3, article_id: 2, tag_id: 3 },
    { id: 4, article_id: 2, tag_id: 1 },
    { id: 5, article_id: 3, tag_id: 2 },
    { id: 6, article_id: 3, tag_id: 3 },
    { id: 7, article_id: 3, tag_id: 1 }
  ])

  return Promise.join(
    knex('articles_tags').del(),
    knex('articles_tags').insert(articlesTags)
  )
}
