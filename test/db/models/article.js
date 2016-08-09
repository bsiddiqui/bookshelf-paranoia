'use strict'

let db = require('../')

module.exports = db.bookshelf.model('Article', {
  tableName: 'articles',
  softDelete: true,

  user: function () {
    return this.belongsToOne('User')
  },

  comments: function () {
    return this.hasMany('Comment')
  },

  tags: function () {
    return this.belongsToMany('Tag').through('ArticleTag')
  },

  articlesOrTags: function () {
    return this.morphMany('ArticleOrTag', 'source')
  }
})
