'use strict'

let db = require('../')

module.exports = db.bookshelf.model('Comment', {
  tableName: 'comments',
  softDelete: true,

  user: function () {
    return this.belongsTo('User')
  },

  article: function () {
    return this.belongsTo('Article')
  }
})
