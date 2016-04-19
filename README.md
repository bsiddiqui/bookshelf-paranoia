# bookshelf-paranoia
[![Build Status](https://travis-ci.org/bsiddiqui/bookshelf-paranoia.svg?branch=master)](https://travis-ci.org/bsiddiqui/bookshelf-paranoia)
[![Code Climate](https://codeclimate.com/github/bsiddiqui/bookshelf-paranoia/badges/gpa.svg)](https://codeclimate.com/github/bsiddiqui/bookshelf-paranoia)
[![Version](https://badge.fury.io/js/bookshelf-paranoia.svg)](http://badge.fury.io/js/bookshelf-paranoia)
[![Downloads](http://img.shields.io/npm/dm/bookshelf-paranoia.svg)](https://www.npmjs.com/package/bookshelf-paranoia)
[![Coverage Status](https://coveralls.io/repos/github/bsiddiqui/bookshelf-paranoia/badge.svg)](https://coveralls.io/github/bsiddiqui/bookshelf-paranoia)

Protect your database from data loss by soft deleting your rows.

### Installation

After installing it with `npm i --save bookshelf-paranoia` you just need to
plug it into bookshelf and enable your models to do soft deletes.

```javascript
let knex = require('knex')(require('./knexfile.js').development)
let bookshelf = require('bookshelf')(knex)

// Plug it in
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

// It won't exist even through eager loadings
let blog = yield Blog.forge({ id: 2000 }).fetch({ withRelated: 'users' })
blog.related('users').findWhere({ id: 1000 }) // undefined

// But we didn't deleted it from the database
let user = yield knex('users').select('*').where('id', 1000)
console.log(user[0].deleted_at) // Fri Apr 15 2016 00:40:40 GMT-0300 (BRT)
```

### Overrides

`bookshelf-paranoia` provides a set of overrides so you can customize your
experience while using it.

```javascript
// Override the field name that holds the deletion date
bookshelf.plugin(require('bookshelf-paranoia'), { field: 'deletedAt' })

// If you want to delete something for good even with soft deleted enabled. I
// think we don't need to say "be careful" :-)
yield User.forge({ id: 1000 }).destroy({ hardDelete: true })

// Retrieve a soft deleted row even with the plugin enabled. Works for
// eager loading relations too
let user = yield User.forge({ id: 1000 }).fetch({ withDeleted: true })
```

### Testing

```bash
git clone git@github.com:bsiddiqui/bookshelf-paranoia.git
cd bookshelf-paranoia && npm install && npm test
```
