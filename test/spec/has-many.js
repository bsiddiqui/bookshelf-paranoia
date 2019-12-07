'use strict'

const co = require('co')
const lab = exports.lab = require('@hapi/lab').script()
const expect = require('@hapi/code').expect

const db = require('../db')
const Article = db.bookshelf.model('Article')

lab.experiment('hasMany relation', () => {
  lab.beforeEach(co.wrap(function * () {
    yield db.reset()
    yield db.knex.seed.run()
  }))

  lab.test('should work', co.wrap(function * () {
    let article = yield Article.forge({ id: 1 }).fetch({ withRelated: 'comments' })
    const comments = article.related('comments')

    // Soft delete one tag
    yield article.related('comments').at(0).destroy()

    // Try to query again
    article = yield Article.forge({ id: 1 }).fetch({ withRelated: 'comments' })
    expect(article.related('comments').length).to.be.below(comments.length)
    expect(article.related('comments').find(item => item.id === comments.at(0).id)).to.not.exist()

    // Query with override
    article = yield Article.forge({ id: 1 }).fetch({
      withRelated: 'comments',
      withDeleted: true
    })

    expect(article.related('comments').length).to.equal(comments.length)
    expect(article.related('comments').find(item => item.id === comments.at(0).id)).to.exist()
    expect(article.related('comments').at(0).get('deleted_at')).to.be.a.number()
  }))
})
