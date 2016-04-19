'use strict'

let co = require('co')
let lab = exports.lab = require('lab').script()
let expect = require('code').expect

let db = require('../db')
let Comment = db.bookshelf.model('Comment')
let User = db.bookshelf.model('User')

lab.experiment('general tests', () => {
  lab.beforeEach(co.wrap(function * () {
    yield db.reset()
    yield db.knex.seed.run()
  }))

  lab.test('should work', co.wrap(function * () {
    yield Comment.forge({ id: 1 }).destroy()

    let comment = yield Comment.forge({ id: 1 }).fetch()
    expect(comment).to.be.null()

    comment = yield db.knex('comments').select('*').where('id', 1)
    expect(comment[0].deleted_at).to.be.a.number()
  }))

  lab.test('should allow override when destroying', co.wrap(function * () {
    yield Comment.forge({ id: 1 }).destroy()

    let comment = yield db.knex('comments').select('*').where('id', 1)
    expect(comment[0].deleted_at).to.be.a.number()

    yield Comment.forge({ id: 1 }).destroy({ hardDelete: true })

    comment = yield db.knex('comments').select('*').where('id', 1)
    expect(comment[0]).to.be.undefined()
  }))

  lab.test('should allow querying soft deleted models', co.wrap(function * () {
    yield Comment.forge({ id: 1 }).destroy()

    let comment = yield Comment.forge({ id: 1 }).fetch()
    expect(comment).to.be.null()

    comment = yield Comment.forge({ id: 1 }).fetch({ withDeleted: true })
    expect(comment.id).to.equal(1)
    expect(comment.get('deleted_at')).to.be.a.number()
  }))

  lab.test('should hard delete when models do not have soft delete configured', co.wrap(function * () {
    yield User.forge({ id: 1 }).destroy()

    expect(yield db.knex('users').select('*').where('id', 1)).to.have.length(0)
  }))

  lab.test('should allow overriding the field name', co.wrap(function * () {
    // Setup the new table
    yield db.knex.schema.createTable('test', (table) => {
      table.increments()
      table.timestamp('deleted')
    })

    // Insert one row for testing
    yield db.knex('test').insert({ id: 1 })

    // Create a new bookshelf instance
    let bookshelf = require('bookshelf')(db.knex)
    bookshelf.plugin(require('../../'), { field: 'deleted' })

    // Create the model that corresponds to our newly created table
    let Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })
    yield Model.forge({ id: 1 }).destroy()

    // Try to fetch it trough the model
    let test = yield Model.forge({ id: 1 }).fetch()
    expect(test).to.be.null()

    // Now try to fetch it directly though knex
    test = yield db.knex('test').select('*').where('id', 1)
    expect(test[0].deleted).to.be.a.number()
  }))
})

