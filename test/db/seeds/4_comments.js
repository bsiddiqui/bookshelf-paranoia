'use strict'

let timestamper = require('../../fixtures/timestamper')

exports.seed = (knex, Promise) => {
  let comments = timestamper([
    {
      id: 1,
      user_id: 1,
      article_id: 1,
      text: 'Try to reboot the AI port, maybe it will bypass the mobile card'
    },
    {
      id: 2,
      user_id: 2,
      article_id: 1,
      text: 'If we compress the driver, we can get to the XSS feed through the virtual JBOD port!'
    },
    {
      id: 3,
      user_id: 1,
      article_id: 2,
      text: 'Use the primary AGP firewall, then you can transmit the optical capacitor.'
    },
    {
      id: 4,
      user_id: 3,
      article_id: 3,
      text: 'Use the open-source GB system, then you can input the optical system...'
    },
    {
      id: 5,
      user_id: 2,
      article_id: 3,
      text: 'If we hack the pixel, we can get to the GB matrix through the online COM application!'
    },
    {
      id: 6,
      user_id: 3,
      article_id: 2,
      text: 'I\'ll calculate the cross-platform AGP protocol, that should bandwidth the SAS firewall'
    }
  ])

  return Promise.join(
    knex('comments').del(),
    knex('comments').insert(comments)
  )
}
