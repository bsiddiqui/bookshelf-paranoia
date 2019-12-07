'use strict'

const timestamper = require('../../fixtures/timestamper')

exports.seed = knex => {
  const articlesOrTags = timestamper([
    {
      id: 1,
      source_id: 1,
      source_type: 'tags'
    },
    {
      id: 2,
      source_id: 1,
      source_type: 'articles'
    },
    {
      id: 3,
      source_id: 2,
      source_type: 'tags'
    },
    {
      id: 4,
      source_id: 2,
      source_type: 'articles'
    },
    {
      id: 5,
      source_id: 2,
      source_type: 'articles'
    }
  ])

  return Promise.all([
    knex('article_or_tag').del(),
    knex('article_or_tag').insert(articlesOrTags)
  ])
}
