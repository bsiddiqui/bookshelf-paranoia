'use strict'

let result = require('lodash.result')

/**
 * A function that can be used as a plugin for bookshelf
 * @param {Object} bookshelf The main bookshelf instance
 * @param {Object} [settings] Additional settings for configuring this plugin
 * @param {String} [settings.field=deleted_at] The name of the field that stores
 * the soft delete information for that model
 */
module.exports = (bookshelf, settings) => {
  // Add default settings
  settings = Object.assign({ field: 'deleted_at' }, settings)

  /**
   * Check if the operation needs to be patched for not retrieving
   * soft deleted rows
   * @param {Object} model An instantiated bookshelf model
   * @param {Object} attrs The attributes that's being queried
   * @param {Object} options The operation option
   * @param {Boolean} [options.withDeleted=false] Override the default behavior
   * and allow querying soft deleted objects
   */
  function skipDeleted (model, attrs, options) {
    let softDelete = this.model ? this.model.prototype.softDelete : this.softDelete

    if (softDelete === true && options.withDeleted !== true) {
      options.query.whereNull(`${result(this, 'tableName')}.${settings.field}`)
    }
  }

  // Store prototypes for later
  let modelPrototype = bookshelf.Model.prototype
  let collectionPrototype = bookshelf.Collection.prototype

  // Extends the default collection to be able to patch relational queries
  // against a set of models
  bookshelf.Collection = bookshelf.Collection.extend({
    initialize: function () {
      collectionPrototype.initialize.call(this)

      this.on('fetching', skipDeleted.bind(this))
    }
  })

  // Extends the default model class
  bookshelf.Model = bookshelf.Model.extend({
    initialize: function () {
      modelPrototype.initialize.call(this)

      this.on('fetching', skipDeleted.bind(this))
      this.on('fetching:collection', skipDeleted.bind(this))
    },

    /**
     * Override the default destroy method to provide soft deletion logic
     * @param {Object} [options] The default options parameters from Model.destroy
     * @param {Boolean} [options.hardDelete=false] Override the default soft
     * delete behavior and allow a model to be hard deleted
     * @return {Promise} A promise that's fulfilled when the model has been
     * hard or soft deleted
     */
    destroy: function (options) {
      options = options || {}
      if (this.softDelete === true && options.hardDelete !== true) {
        options.patch = true
        return this.save({ [settings.field]: new Date() }, options)
      } else {
        return modelPrototype.destroy.call(this, options)
      }
    }
  })
}

