'use strict'

const co = require('co')
const lab = exports.lab = require('@hapi/lab').script()
const expect = require('@hapi/code').expect

const db = require('../db')
const Comment = db.bookshelf.model('Comment')

lab.experiment('belongsTo relation', () => {
  lab.beforeEach(co.wrap(function * () {
    yield db.reset()
    yield db.knex.seed.run()
  }))

  lab.test('should work', co.wrap(function * () {
    let comment = yield Comment.forge({ id: 1 }).fetch({ withRelated: 'article' })

    // Soft delete that user
    yield comment.related('article').destroy()

    // Try to query again
    comment = yield Comment.forge({ id: 1 }).fetch({ withRelated: 'article' })
    expect(comment.related('article').has('id')).to.be.false()

    // Query with override
    comment = yield Comment.forge({ id: 1 }).fetch({
      withRelated: 'article',
      withDeleted: true
    })

    expect(comment.related('article').id).to.be.a.number()
    expect(comment.related('article').get('deleted_at')).to.be.a.number()
  }))
})
