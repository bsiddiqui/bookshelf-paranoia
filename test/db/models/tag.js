'use strict'

let db = require('../')

module.exports = db.bookshelf.model('Tag', {
  tableName: 'tags',
  softDelete: true,

  articles: function () {
    return this.belongsToMany('Article').through('ArticleTag')
  }
})
