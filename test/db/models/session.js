'use strict'

const db = require('../')

module.exports = db.bookshelf.model('Session', {
  tableName: 'sessions',
  softDelete: true,

  user: function () {
    return this.belongsToOne('User')
  }
})
