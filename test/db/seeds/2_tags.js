'use strict'

let timestamper = require('../../fixtures/timestamper')

exports.seed = (knex, Promise) => {
  let tags = timestamper([
    { id: 1, name: 'deposit' },
    { id: 2, name: 'Costa Rican Colon' },
    { id: 3, name: 'Bedfordshire' }
  ])

  return Promise.join(
    knex('tags').del(),
    knex('tags').insert(tags)
  )
}
