'use strict'

let timestamps = {
  created_at: new Date(),
  updated_at: new Date()
}

/**
 * Add a timestamp fields to an object or an array of objects
 * @param {Object[]} src An object or and array containing object
 * @return {Object[]} The provided object merged with timestamps or an array
 */
module.exports = (src) => {
  if (Array.isArray(src)) {
    return src.map((obj) => Object.assign(obj, timestamps))
  } else {
    return Object.assign(src, timestamps)
  }
}
