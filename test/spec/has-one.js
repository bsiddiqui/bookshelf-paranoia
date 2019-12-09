'use strict'

const co = require('co')
const lab = exports.lab = require('@hapi/lab').script()
const expect = require('@hapi/code').expect

const db = require('../db')
const User = db.bookshelf.model('User')

lab.experiment('hasOne relation', () => {
  lab.beforeEach(co.wrap(function * () {
    yield db.reset()
    yield db.knex.seed.run()
  }))

  lab.test('should work', co.wrap(function * () {
    let user = yield User.forge({ id: 1 }).fetch({ withRelated: 'session' })

    // Soft delete that user
    yield user.related('session').destroy()

    // Try to query again
    user = yield User.forge({ id: 1 }).fetch({ withRelated: 'session' })
    expect(user.related('session').has('id')).to.be.false()

    // Query with override
    user = yield User.forge({ id: 1 }).fetch({
      withRelated: 'session',
      withDeleted: true
    })

    expect(user.related('session').id).to.be.a.number()
    expect(user.related('session').get('deleted_at')).to.be.a.number()
  }))
})
