module.exports = function (bookshelf) {
  var modelPrototype = bookshelf.Model.prototype

  bookshelf.Model = bookshelf.Model.extend({
    sync: function (options) {
      var sync = modelPrototype.sync.apply(this, arguments)

      if (this.softDelete === true && options.withDeleted !== true) {
        var originalSelect = sync.select

        sync.select = function () {
          sync.query.whereNull('deleted_at')
          return originalSelect.call(sync)
        }
      }

      if (options.hardDelete !== true && (this.softDelete === true || options.softDelete === true)) {
        /* eslint-disable no-useless-call */
        sync.del = function () {
          return sync.update.call(sync, { deleted_at: new Date() })
        }
        /* eslint-enable no-useless-call */
      }

      return sync
    }
  })
}
