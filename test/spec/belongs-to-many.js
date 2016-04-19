'use strict'

let co = require('co')
let lab = exports.lab = require('lab').script()
let expect = require('code').expect

let db = require('../db')
let Article = db.bookshelf.model('Article')

lab.experiment('belongsToMany relation', () => {
  lab.beforeEach(co.wrap(function * () {
    yield db.reset()
    yield db.knex.seed.run()
  }))

  lab.test('should work', co.wrap(function * () {
    let article = yield Article.forge({ id: 1 }).fetch({ withRelated: 'tags' })
    let tags = article.related('tags')

    // Soft delete one tag
    yield article.related('tags').at(0).destroy()

    // Try to query again
    article = yield Article.forge({ id: 1 }).fetch({ withRelated: 'tags' })
    expect(article.related('tags').length).to.be.below(tags.length)
    expect(article.related('tags').findWhere({ id: tags.at(0).id })).to.not.exist()

    // Query with override
    article = yield Article.forge({ id: 1 }).fetch({
      withRelated: 'tags',
      withDeleted: true
    })

    expect(article.related('tags').length).to.equal(tags.length)
    expect(article.related('tags').findWhere({ id: tags.at(0).id })).to.exist()
    expect(article.related('tags').at(0).get('deleted_at')).to.be.a.number()
  }))
})
