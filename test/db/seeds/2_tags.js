'use strict'

const timestamper = require('../../fixtures/timestamper')

exports.seed = knex => {
  const tags = timestamper([
    { id: 1, name: 'deposit' },
    { id: 2, name: 'Costa Rican Colon' },
    { id: 3, name: 'Bedfordshire' }
  ])

  return Promise.all([
    knex('tags').del(),
    knex('tags').insert(tags)
  ])
}
