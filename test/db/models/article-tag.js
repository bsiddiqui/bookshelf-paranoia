'use strict'

const db = require('../')

module.exports = db.bookshelf.model('ArticleTag', {
  tableName: 'articles_tags',

  tag: function () {
    return this.hasOne('Tag')
  },

  article: function () {
    return this.hasOne('Article')
  }
})
