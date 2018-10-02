'use strict'

let co = require('co')
let lab = exports.lab = require('lab').script()
let expect = require('code').expect

let db = require('../db')
let customDb = require('../fixtures/custom-db')
let Comment = db.bookshelf.model('Comment')
let User = db.bookshelf.model('User')

lab.experiment('general tests', () => {
  lab.beforeEach(co.wrap(function * () {
    yield db.reset()
    yield db.knex.seed.run()
  }))

  lab.test('should work', co.wrap(function * () {
    let model = yield Comment.forge({ id: 1 }).destroy()

    let comment = yield Comment.forge({ id: 1 }).fetch()
    expect(comment).to.be.null()

    comment = yield db.knex('comments').select('*').where('id', 1)
    expect(comment[0].deleted_at).to.be.a.number()
    expect(model.get('deleted_at')).to.be.a.date()
  }))

  lab.test('works with nullValue override', co.wrap(function * () {
    const nullValue = '0000-00-00 00:00:00'

    const bookshelf = yield customDb.sentinelTable((bookshelf) => {
      bookshelf.plugin(require('../../'), { nullValue })
    })

    const Model = bookshelf.Model.extend({
      tableName: 'test',
      softDelete: true
    })

    const model = yield Model.forge({
      id: 1,
      deleted_at: nullValue
    }).save()

    yield model.destroy()

    const deletedModel = yield Model.forge({ id: 1 }).fetch()
    expect(deletedModel).to.be.null()

    const knexModels = yield db.knex('test').select('*').where('id', 1)
    expect(knexModels[0].deleted_at).to.be.a.number()
    expect(model.get('deleted_at')).to.be.a.date()
  }))

  lab.test('should not be able to delete twice', co.wrap(function * () {
    yield Comment.forge({ id: 1 }).destroy()

    const error = yield Comment.forge({ id: 1 })
      .destroy({ require: true })
      .catch((err) => err)

    expect(error).to.be.instanceOf(Comment.NoRowsDeletedError)
  }))

  lab.test('should work with user-provided time as Date', co.wrap(function * () {
    const now = new Date()
    let model = yield Comment.forge({ id: 1 }).destroy({ date: now })

    let comment = yield Comment.forge({ id: 1 }).fetch()
    expect(comment).to.be.null()

    comment = yield db.knex('comments').select('*').where('id', 1)
    expect(comment[0].deleted_at).to.be.a.number()
    expect(model.get('deleted_at')).to.be.a.date()
    expect(model.get('deleted_at').getTime()).to.equal(now.getTime())
  }))

  lab.test('should work with user-provided time as milliseconds', co.wrap(function * () {
    const now = Date.now()
    let model = yield Comment.forge({ id: 1 }).destroy({ date: now })

    let comment = yield Comment.forge({ id: 1 }).fetch()
    expect(comment).to.be.null()

    comment = yield db.knex('comments').select('*').where('id', 1)
    expect(comment[0].deleted_at).to.be.a.number()
    expect(model.get('deleted_at')).to.be.a.date()
    expect(model.get('deleted_at').getTime()).to.equal(now)
  }))

  lab.test('should work with transactions', co.wrap(function * () {
    let err = yield db.bookshelf.transaction((transacting) => {
      return Comment.forge({ id: 1 })
        .destroy({ transacting })
        .then(() => { throw new Error('Rollback this transaction') })
    })
      .catch((err) => err)

    expect(err.message).to.equal('Rollback this transaction')

    let comment = yield Comment.forge({ id: 1 }).fetch()
    expect(comment.get('deleted_at')).to.be.null()
  }))

  lab.experiment('errors', () => {
    lab.test('should throw when required', co.wrap(function * () {
      let err = yield Comment.forge({ id: 12345 })
        .destroy({ require: true })
        .catch((err) => err)

      expect(err).to.be.an.error('No Rows Deleted')
    }))

    lab.test('should not throw when required if a row was soft deleted', co.wrap(function * () {
      yield Comment.forge({ id: 1 }).destroy({ require: true })

      let comment = yield Comment.forge({ id: 1 }).fetch()
      expect(comment).to.be.null()
    }))

    lab.test('allows for filtered catch', co.wrap(function * () {
      let err = yield Comment.forge({ id: 12345 })
        .destroy({ require: true })
        .catch(db.bookshelf.Model.NoRowsDeletedError, (err) => err)

      expect(err).to.be.an.error('No Rows Deleted')
    }))
  })

  lab.test('should preserve original query object', co.wrap(function * () {
    yield Comment.forge({ article_id: 1 }).query((qb) => qb.where('id', 1)).destroy()
    let comment1 = yield Comment.forge({ id: 1 }).fetch()
    let comment2 = yield Comment.forge({ id: 2 }).fetch()
    expect(comment1).to.be.null()
    expect(comment2).to.not.be.null()
  }))

  lab.test('should delete according to query object', co.wrap(function * () {
    yield Comment.query((qb) => qb.where('id', 2)).destroy()
    let comment = yield Comment.forge({ id: 1 }).fetch()
    expect(comment).to.not.be.null()
  }))

  lab.test('should allow override when destroying', co.wrap(function * () {
    yield Comment.forge({ id: 1 }).destroy()

    let comment = yield db.knex('comments').select('*').where('id', 1)
    expect(comment[0].deleted_at).to.be.a.number()

    yield Comment.forge({ id: 1 }).destroy({ hardDelete: true })

    comment = yield db.knex('comments').select('*').where('id', 1)
    expect(comment[0]).to.be.undefined()
  }))

  lab.test('should properly update the document when using query', co.wrap(function * () {
    yield Comment.where({ id: 1 }).destroy()

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

  lab.test('should correctly emit events', co.wrap(function * () {
    let events = []
    let model = Comment.forge({ id: 1 })

    model.on('destroying', (model, options) => events.push(['destroying', model, options]))
    model.on('destroyed', (model, options) => events.push(['destroyed', model, options]))

    yield model.destroy({ customOption: true })

    expect(events).to.have.length(2)
    expect(events[0][0]).to.equal('destroying')
    expect(events[0][1].get('id')).to.equal(1)
    expect(events[0][2]).to.deep.contain({
      softDelete: true,
      customOption: true
    })
    expect(events[1][0]).to.equal('destroyed')
    expect(events[1][1].get('id')).to.equal(1)
    expect(events[1][2]).to.deep.contain({
      softDelete: true,
      customOption: true
    })
  }))

  lab.test('should hard delete when models do not have soft delete configured', co.wrap(function * () {
    yield User.forge({ id: 1 }).destroy()

    expect(yield db.knex('users').select('*').where('id', 1)).to.have.length(0)
  }))

  lab.test('should allow overriding the field name', co.wrap(function * () {
    // Create a new bookshelf instance
    let bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), { field: 'deleted' })
    })

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

  lab.test('should allow overriding the destroyed event', co.wrap(function * () {
    // Create a new bookshelf instance
    let bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), {
        field: 'deleted',
        events: { destroyed: false }
      })
    })

    // Create the model that corresponds to our newly created table
    let Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })
    let events = []

    let model = Model.forge({ id: 1 })
    model.on('destroying', (model, options) => events.push(['destroying', model, options]))
    model.on('destroyed', (model, options) => events.push(['destroyed', model, options]))

    yield model.destroy()

    expect(events).to.have.length(1)
    expect(events[0][0]).to.equal('destroying')
  }))

  lab.test('should allow overriding the destroying event', co.wrap(function * () {
    // Create a new bookshelf instance
    let bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), {
        field: 'deleted',
        events: { destroying: false }
      })
    })

    // Create the model that corresponds to our newly created table
    let Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })
    let events = []

    let model = Model.forge({ id: 1 })
    model.on('destroying', (model, options) => events.push(['destroying', model, options]))
    model.on('destroyed', (model, options) => events.push(['destroyed', model, options]))

    yield model.destroy()

    expect(events).to.have.length(1)
    expect(events[0][0]).to.equal('destroyed')
  }))

  lab.test('should allow overriding the saving event', co.wrap(function * () {
    // Create a new bookshelf instance
    let bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), {
        field: 'deleted',
        events: {
          destroying: false,
          updating: false,
          saving: true
        }
      })
    })

    // Create the model that corresponds to our newly created table
    let Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })
    let events = []

    let model = Model.forge({ id: 1 })
    model.on('saving', (model, attrs, options) => events.push([model, attrs, options]))

    yield model.destroy()

    expect(events).to.have.length(1)
    expect(events[0][0].id).to.equal(1)
    expect(events[0][1].deleted).to.be.a.date()
    expect(events[0][2].previousAttributes.deleted).to.not.exist()
  }))

  lab.test('should allow overriding the updating event', co.wrap(function * () {
    // Create a new bookshelf instance
    let bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), {
        field: 'deleted',
        events: {
          destroying: false,
          updating: true,
          saving: true
        }
      })
    })

    // Create the model that corresponds to our newly created table
    let Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })
    let events = []

    let model = Model.forge({ id: 1 })
    model.on('updating', (model, attrs, options) => events.push([model, attrs, options]))

    yield model.destroy()

    expect(events).to.have.length(1)
    expect(events[0][0].id).to.equal(1)
    expect(events[0][1].deleted).to.be.a.date()
    expect(events[0][2].previousAttributes.deleted).to.not.exist()
  }))

  lab.test('should allow overriding the saved event', co.wrap(function * () {
    // Create a new bookshelf instance
    let bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), {
        field: 'deleted',
        events: {
          destroyed: false,
          updated: false,
          saved: true
        }
      })
    })

    // Create the model that corresponds to our newly created table
    let Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })
    let events = []

    let model = Model.forge({ id: 1 })
    model.on('saved', (model, attrs, options) => events.push([model, attrs, options]))

    yield model.destroy()

    expect(events).to.have.length(1)
    expect(events[0][0].id).to.equal(1)
    expect(events[0][1]).to.equal(1)
    expect(events[0][2].previousAttributes.deleted).to.not.exist()
  }))

  lab.test('should allow overriding the updated event', co.wrap(function * () {
    // Create a new bookshelf instance
    let bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), {
        field: 'deleted',
        events: {
          destroyed: false,
          updated: true,
          saved: false
        }
      })
    })

    // Create the model that corresponds to our newly created table
    let Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })
    let events = []

    let model = Model.forge({ id: 1 })
    model.on('updated', (model, attrs, options) => events.push([model, attrs, options]))

    yield model.destroy()

    expect(events).to.have.length(1)
    expect(events[0][0].id).to.equal(1)
    expect(events[0][1]).to.equal(1)
    expect(events[0][2].previousAttributes.deleted).to.not.exist()
  }))

  lab.test('should allow disabling events', co.wrap(function * () {
    // Create a new bookshelf instance
    let bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), {
        field: 'deleted',
        events: false
      })
    })

    // Create the model that corresponds to our newly created table
    let Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })
    let events = []

    let model = Model.forge({ id: 1 })
    model.on('destroying', (model, options) => events.push(['destroying', model, options]))
    model.on('destroyed', (model, options) => events.push(['destroyed', model, options]))

    yield model.destroy()

    expect(events).to.have.length(0)
  }))

  lab.test('should pass query to events like bookshelf', co.wrap(function * () {
    let model = Comment.forge({ id: 3 })

    model.on('destroying', (model, options) => {
      expect(options.query).to.exist()
    })

    yield model.destroy()
  }))
})
