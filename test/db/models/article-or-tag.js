'use strict'

const db = require('../')

module.exports = db.bookshelf.model('ArticleOrTag', {
  tableName: 'article_or_tag',
  softDelete: true,

  source: function () {
    return this.morphTo('source', 'Article', 'Tag')
  }
})
