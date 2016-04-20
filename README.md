# bookshelf-paranoia
[![Build Status](https://circleci.com/gh/estate/bookshelf-paranoia.svg?style=shield)](https://circleci.com/gh/estate/bookshelf-paranoia)
[![Code Climate](https://codeclimate.com/github/estate/bookshelf-paranoia/badges/gpa.svg)](https://codeclimate.com/github/estate/bookshelf-paranoia)
[![Test Coverage](https://codeclimate.com/github/estate/bookshelf-paranoia/badges/coverage.svg)](https://codeclimate.com/github/estate/bookshelf-paranoia/coverage)
[![Version](https://badge.fury.io/js/bookshelf-paranoia.svg)](http://badge.fury.io/js/bookshelf-paranoia)
[![Downloads](http://img.shields.io/npm/dm/bookshelf-paranoia.svg)](https://www.npmjs.com/package/bookshelf-paranoia)

Protect your database from data loss by soft deleting your rows.

### Installation

After installing `bookshelf-paranoia` with `npm i --save bookshelf-paranoia`,
all you need to do is add it as a bookshelf plugin and enable it on your models.
The default field used to soft delete your models is `deleted_at` but you can override that.

```javascript
let knex = require('knex')(require('./knexfile.js').development)
let bookshelf = require('bookshelf')(knex)

// Add the plugin
bookshelf.plugin(require('bookshelf-paranoia'))

// Enable it on your models
let User = bookshelf.Model.extend({ tableName: 'users', softDelete: true })
```

### Usage

You can call every method as usual and `bookshelf-paranoia` will handle soft
deletes transparently for you.

```javascript
// This user is indestructible
yield User.forge({ id: 1000 }).destroy()

// Now try to find it again
let user = yield User.forge({ id: 1000 }).fetch() // null

// It won't exist, even through eager loadings
let user = yield User.forge({ id: 2000 }).fetch() // undefined

let blog = yield Blog.forge({ id: 2000 }).fetch({ withRelated: 'users' })
blog.related('users').findWhere({ id: 1000 }) // also undefined

// But we didn't delete it from the database
let user = yield knex('users').select('*').where('id', 1000)
console.log(user[0].deleted_at) // Fri Apr 15 2016 00:40:40 GMT-0300 (BRT)
```

### Overrides

`bookshelf-paranoia` provides a set of overrides so you can customize your
experience while using it.

```javascript
// Override the field name that holds the deletion date
bookshelf.plugin(require('bookshelf-paranoia'), { field: 'deletedAt' })

// If you want to delete something for good, even if the model has soft deleting on
yield User.forge({ id: 1000 }).destroy({ hardDelete: true })

// Retrieve a soft deleted row even with the plugin enabled. Works for
// eager loaded relations too
let user = yield User.forge({ id: 1000 }).fetch({ withDeleted: true })

// By default soft deletes also emit "destroying" and "destroyed" events. You
// can easily disable this behavior when setting the plugin
bookshelf.plugin(require('bookshelf-paranoia'), { events: false })

// Disable only one event
bookshelf.plugin(require('bookshelf-paranoia'), {
  events: { destroying: false }
})

// Enable saving, updating, saved, and updated. This will turn on all events
// since destroying and destroyed are already on by default
bookshelf.plugin(require('bookshelf-paranoia'), {
  events: {
    saving: true,
    updating: true,
    saved: true,
    updated: true
  }
})
```

### Detecting soft deletes

By listening to the default events emitted by bookshelf when destroying a model
you're able to detect if that model is being soft deleted.

```javascript
let model = new User({ id: 1000 })

// Watch for deletes as usual
model.on('destroying', (model, options) => {
  if (options.softDelete) console.log(`User ${model.id} is being soft deleted!`)
})

model.on('destroying', (model, options) => {
  if (options.softDelete) console.log(`User ${model.id} has been soft deleted!`)
})

yield model.destroy()
// User 1000 is being soft deleted!
// User 1000 has been soft deleted!
```

### Testing

```bash
git clone git@github.com:bsiddiqui/bookshelf-paranoia.git
cd bookshelf-paranoia && npm install && npm test
```
