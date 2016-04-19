'use strict'

let db = require('../')

module.exports = db.bookshelf.model('User', {
  tableName: 'users',

  comments: function () {
    return this.hasMany('Comment')
  },

  session: function () {
    return this.hasOne('Session')
  },

  articles: function () {
    return this.hasMany('Article')
  }
})
