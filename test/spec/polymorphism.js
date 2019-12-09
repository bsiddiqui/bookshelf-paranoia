'use strict'

const co = require('co')
const lab = exports.lab = require('@hapi/lab').script()
const expect = require('@hapi/code').expect

const db = require('../db')
const ArticleOrTag = db.bookshelf.model('ArticleOrTag')
const Tag = db.bookshelf.model('Tag')
const Article = db.bookshelf.model('Article')

lab.experiment('polymorphism', () => {
  lab.beforeEach(co.wrap(function * () {
    yield db.reset()
    yield db.knex.seed.run()
  }))

  lab.test('morph to one should work', co.wrap(function * () {
    let sources = yield ArticleOrTag.forge()
      .orderBy('id', 'ASC')
      .fetchAll({ withRelated: 'source' })

    const copy = sources.clone()
    yield sources.at(0).destroy()

    sources = yield ArticleOrTag.forge()
      .orderBy('id', 'ASC')
      .fetchAll({ withRelated: 'source' })

    const withDeleted = yield ArticleOrTag.forge()
      .orderBy('id', 'ASC')
      .fetchAll({
        withRelated: 'source',
        withDeleted: true
      })

    expect(sources.at(0).id).to.not.equal(copy.at(0).id)
    expect(sources.length).to.be.below(copy.length)
    expect(withDeleted.length).to.equal(copy.length)
  }))

  lab.test('morphMany should work', co.wrap(function * () {
    let article = yield Article.forge({ id: 2 }).fetch({ withRelated: 'articlesOrTags' })
    const clone = article.clone()

    yield article.related('articlesOrTags').at(0).destroy()
    article = yield Article.forge({ id: 2 }).fetch({ withRelated: 'articlesOrTags' })
    const withDeleted = yield Article.forge({ id: 2 }).fetch({
      withRelated: 'articlesOrTags',
      withDeleted: true
    })

    expect(article.related('articlesOrTags').length).to.be.below(clone.related('articlesOrTags').length)
    expect(withDeleted.related('articlesOrTags').length).to.equal(clone.related('articlesOrTags').length)
  }))

  lab.test('morphOne should work', co.wrap(function * () {
    let tag = yield Tag.forge({ id: 1 }).fetch({ withRelated: 'articleOrTag' })
    expect(tag.related('articleOrTag').id).to.equal(1)

    yield tag.related('articleOrTag').destroy()
    tag = yield Tag.forge({ id: 1 }).fetch({ withRelated: 'articleOrTag' })
    const withDeleted = yield Tag.forge({ id: 1 }).fetch({
      withRelated: 'articleOrTag',
      withDeleted: true
    })

    expect(tag.related('articleOrTag').id).to.be.undefined()
    expect(withDeleted.related('articleOrTag').id).to.equal(1)
  }))
})
