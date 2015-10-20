var result = require('lodash.result')

module.exports = function (bookshelf) {
  var modelPrototype = bookshelf.Model.prototype

  bookshelf.Model = bookshelf.Model.extend({
    initialize: function () {
      modelPrototype.initialize.call(this)

      this.on('fetching', skipDeleted)
      this.on('fetching:collection', skipDeleted)

      function skipDeleted (model, column, options) {
        if (this.softDelete === true && options.withDeleted !== true) {
          return options.query.whereNull(result(this, 'tableName') + '.' + 'deleted_at')
        } else {
          return
        }
      }
    },

    destroy: function (options) {
      options = options || {}
      if (this.softDelete === true && options.hardDelete !== true) {
        options.patch = true
        return this.save({ deleted_at: new Date() })
      } else {
        return modelPrototype.destroy.apply(this, arguments)
      }
    }
  })
}

