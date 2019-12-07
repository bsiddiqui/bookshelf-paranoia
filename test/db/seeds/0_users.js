'use strict'

const timestamper = require('../../fixtures/timestamper')

exports.seed = knex => {
  const users = timestamper([
    { id: 1, name: 'Amira Dooley', email: 'Raina_Kunde14@hotmail.com' },
    { id: 2, name: 'Joaquin Leffler', email: 'Brandyn_Collier44@yahoo.com' },
    { id: 3, name: 'Chaim Herman', email: 'Emmie.Stehr@yahoo.com' }
  ])

  return Promise.all([
    knex('users').del(),
    knex('users').insert(users)
  ])
}
