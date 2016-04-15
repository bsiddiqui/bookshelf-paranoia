'use strict'

let timestamper = require('../../fixtures/timestamper')

exports.seed = (knex, Promise) => {
  let users = timestamper([
    { id: 1, name: 'Amira Dooley', email: 'Raina_Kunde14@hotmail.com' },
    { id: 2, name: 'Joaquin Leffler', email: 'Brandyn_Collier44@yahoo.com' },
    { id: 3, name: 'Chaim Herman', email: 'Emmie.Stehr@yahoo.com' }
  ])

  return Promise.join(
    knex('users').del(),
    knex('users').insert(users)
  )
}
