'use strict'

let Promise = require('bluebird')
let result = require('lodash.result')
let merge = require('lodash.merge')

/**
 * A function that can be used as a plugin for bookshelf
 * @param {Object} bookshelf The main bookshelf instance
 * @param {Object} [settings] Additional settings for configuring this plugin
 * @param {String} [settings.field=deleted_at] The name of the field that stores
 *   the soft delete information for that model
 * @param {String?} [settings.sentinel=null] The name of the field that stores
 *   the model's active state as a boolean for unique indexing purposes, if any
 */
module.exports = (bookshelf, settings) => {
  // Add default settings
  settings = merge(
    {
      field: 'deleted_at',
      nullValue: null,
      sentinel: null,
      events: {
        destroying: true,
        updating: false,
        saving: false,
        destroyed: true,
        updated: false,
        saved: false
      }
    },
    settings
  )

  /**
   * Check if the operation needs to be patched for not retrieving
   * soft deleted rows
   * @param {Object} model An instantiated bookshelf model
   * @param {Object} attrs The attributes that's being queried
   * @param {Object} options The operation option
   * @param {Boolean} [options.withDeleted=false] Override the default behavior
   * and allow querying soft deleted objects
   */
  function skipDeleted(model, attrs, options) {
    if (!options.isEager || options.parentResponse) {
      let softDelete = this.model
        ? this.model.prototype.softDelete
        : this.softDelete

      if (softDelete && !options.withDeleted) {
        if (settings.nullValue === null) {
          options.query.whereNull(`${result(this, 'tableName')}.${settings.field}`)
        } else {
          options.query.where(`${result(this, 'tableName')}.${settings.field}`, settings.nullValue)
        }
      }
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
      this.on('counting', (collection, options) =>
        skipDeleted.call(this, null, null, options)
      )
    }
  })

  // Extends the default model class
  bookshelf.Model = bookshelf.Model.extend({
    initialize: function () {
      modelPrototype.initialize.call(this)

      if (this.softDelete && settings.sentinel) {
        this.defaults = merge(
          {
            [settings.sentinel]: true
          },
          result(this, 'defaults')
        )
      }

      this.on('fetching', skipDeleted.bind(this))
    },

    /**
     * Override the default destroy method to provide soft deletion logic
     * @param {Object} [options] The default options parameters from Model.destroy
     * @param {Boolean} [options.hardDelete=false] Override the default soft
     * delete behavior and allow a model to be hard deleted
     * @param {Number|Date} [options.date=new Date()] Use a client supplied time
     * @return {Promise} A promise that's fulfilled when the model has been
     * hard or soft deleted
     */
    destroy: function (options) {
      options = options || {}
      if (this.softDelete && !options.hardDelete) {
        let query = this.query()
        // Add default values to options
        options = merge(
          {
            method: 'update',
            patch: true,
            softDelete: true,
            query: query
          },
          options
        )

        const date = options.date ? new Date(options.date) : new Date()

        // Attributes to be passed to events
        let attrs = { [settings.field]: date }
        // Null out sentinel column, since NULL is not considered by SQL unique indexes
        if (settings.sentinel) {
          attrs[settings.sentinel] = null
        }

        // Make sure the field is formatted the same as other date columns
        attrs = this.format(attrs)

        return Promise.resolve()
          .then(() => {
            // Don't need to trigger hooks if there's no events registered
            if (!settings.events) return

            let events = []

            // Emulate all pre update events
            if (settings.events.destroying) {
              events.push(
                this.triggerThen('destroying', this, options).bind(this)
              )
            }

            if (settings.events.saving) {
              events.push(
                this.triggerThen('saving', this, attrs, options).bind(this)
              )
            }

            if (settings.events.updating) {
              events.push(
                this.triggerThen('updating', this, attrs, options).bind(this)
              )
            }

            // Resolve all promises in parallel like bookshelf does
            return Promise.all(events)
          })
          .then(() => {
            // Check if we need to use a transaction
            if (options.transacting) {
              query = query.transacting(options.transacting)
            }

            this.format(this.attributes)

            return query
              .update(attrs, this.idAttribute)
              .where({
                [this.idAttribute]: this.attributes[this.idAttribute]
              })
              .where(`${result(this, 'tableName')}.${settings.field}`, settings.nullValue)
          })
          .then((resp) => {
            // Check if the caller required a row to be deleted and if
            // events weren't totally disabled
            if (resp === 0 && options.require) {
              throw new this.constructor.NoRowsDeletedError('No Rows Deleted')
            } else if (!settings.events) {
              return
            }

            // Add previous attr for reference and reset the model to pristine state
            this.set(attrs)
            options.previousAttributes = this._previousAttributes
            this._reset()

            let events = []

            // Emulate all post update events
            if (settings.events.destroyed) {
              events.push(
                this.triggerThen('destroyed', this, options).bind(this)
              )
            }

            if (settings.events.saved) {
              events.push(
                this.triggerThen('saved', this, resp, options).bind(this)
              )
            }

            if (settings.events.updated) {
              events.push(
                this.triggerThen('updated', this, resp, options).bind(this)
              )
            }

            return Promise.all(events)
          })
          .then(() => this)
      } else {
        return modelPrototype.destroy.call(this, options)
      }
    }
  })
}
