'use strict'

const co = require('co')
const lab = exports.lab = require('@hapi/lab').script()
const expect = require('@hapi/code').expect

const db = require('../db')
const customDb = require('../fixtures/custom-db')

lab.experiment('sentinel', () => {
  lab.beforeEach(co.wrap(function * () {
    yield db.reset()
    yield db.knex.seed.run()
  }))

  lab.test('should set the sentinel column to true on creation', co.wrap(function * () {
    const bookshelf = yield customDb.sentinelTable((bookshelf) => {
      bookshelf.plugin(require('../../'), { sentinel: 'active' })
    })
    const Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })

    const model = yield Model.forge().save()
    expect(model.get('active')).to.satisfy(v => v === true || v === 1 || v === '1')
  }))

  lab.test('should null the sentinel column on deletion', co.wrap(function * () {
    const bookshelf = yield customDb.sentinelTable((bookshelf) => {
      bookshelf.plugin(require('../../'), { sentinel: 'active' })
    })
    const Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })

    const model = yield Model.forge().save().then((model) => model.destroy())
    expect(model.get('active')).to.be.null()
  }))

  lab.test('should do nothing if the sentinel setting is null', co.wrap(function * () {
    const bookshelf = yield customDb.sentinelTable((bookshelf) => {
      bookshelf.plugin(require('../../'), { sentinel: null })
    })
    const Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })

    const model = yield Model.forge().save()
    expect(model.has('active')).to.be.false()
  }))

  lab.test('should do nothing if soft deletion is not enabled', co.wrap(function * () {
    const bookshelf = yield customDb.sentinelTable((bookshelf) => {
      bookshelf.plugin(require('../../'), { sentinel: 'active' })
    })
    const Model = bookshelf.Model.extend({ tableName: 'test' })

    const model = yield Model.forge().save().then((m) => m.destroy())
    expect(model.has('active')).to.be.false()
  }))

  lab.test('should error if the sentinel column does not exist', co.wrap(function * () {
    const bookshelf = yield customDb.altFieldTable((bookshelf) => {
      bookshelf.plugin(require('../../'), { sentinel: 'active' })
    })
    const Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })

    const err = yield Model.forge().save().catch((err) => err)
    expect(err).to.be.an.error(/has no column/)
  }))

  lab.experiment('with a unique constraint including the sentinel column', () => {
    lab.test('should enforce a single active row', co.wrap(function * () {
      const bookshelf = yield customDb.sentinelTable((bookshelf) => {
        bookshelf.plugin(require('../../'), { sentinel: 'active' })
      })
      const Model = bookshelf.Model.extend({ tableName: 'test', softDelete: true })

      let model = yield Model.forge({ value: 123 }).save()
      const err = yield Model.forge({ value: 123 }).save().catch((err) => err)
      expect(err).to.be.an.error(/UNIQUE constraint failed/)

      yield model.destroy()
      model = yield Model.forge({ value: 123 }).save()
      expect(model.get('value')).to.equal(123)

      const count = yield Model.where({ value: 123 }).count('*', { withDeleted: true })
      expect(count).to.equal(2)
    }))
  })
})
