'use strict'

let timestamper = require('../../fixtures/timestamper')

exports.seed = (knex, Promise) => {
  let sessions = timestamper([
    {
      id: 1,
      user_id: 1,
      token: 'UGVyc29uYWwgTG9hbiBBY2NvdW50IFNTTCBHbG9iYWwgQ29uY3JldGU='
    },
    {
      id: 2,
      user_id: 2,
      token: 'YXJjaGl2ZSBCdWNraW5naGFtc2hpcmUgQWdlbnQgcGluaw=='
    },
    {
      id: 3,
      user_id: 3,
      token: 'SW52ZXN0bWVudCBBY2NvdW50IFJlZmluZWQgYmFja2dyb3VuZCBGb3JnZXM='
    }
  ])

  return Promise.join(
    knex('sessions').del(),
    knex('sessions').insert(sessions)
  )
}
