'use strict'

let timestamper = require('../../fixtures/timestamper')

exports.seed = (knex, Promise) => {
  let articles = timestamper([
    {
      id: 1,
      user_id: 1,
      title: 'Payment PNG Cuban Peso Peso Convertible',
      body: 'IB silver synergistic clicks-and-mortar Pennsylvania action-items web-readiness Saudi Arabia Gorgeous Fresh Pizza holistic'
    },
    {
      id: 2,
      user_id: 1,
      title: 'Needs-based intuitive',
      body: 'Generic Plastic Pants Nebraska Fresh Som Pataca override quantify COM Keyboard pixel'
    },
    {
      id: 3,
      user_id: 2,
      title: 'Firewall Investor Iowa',
      body: 'Intelligent Frozen Keyboard Industrial yellow Auto Loan Account transmit red HDD Upgradable Electronics Unbranded'
    }
  ])

  return Promise.join(
    knex('articles').del(),
    knex('articles').insert(articles)
  )
}
