'use strict'

let fs = require('fs')
let config = require('./knexfile')
let knex = require('knex')(config.development)
let bookshelf = require('bookshelf')(knex)

// Install all necessary plugins
bookshelf.plugin('registry')
bookshelf.plugin(require('../../'))

module.exports = {
  knex,
  bookshelf,
  reset: () => knex.raw('SELECT name FROM sqlite_master WHERE type = "table"')
    .then((tables) => {
      let promises = tables
      .filter((table) => !table.name.match(/^sqlite/))
      .map((table) => knex.raw(`DROP TABLE IF EXISTS ${table.name}`))

      return Promise.all(promises)
    })
    .then(() => knex.migrate.latest())
}

// Load all models
fs.readdirSync(`${__dirname}/models`)
.forEach((model) => require(`${__dirname}/models/${model}`))
