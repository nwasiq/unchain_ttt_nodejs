'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GameSchema = new Schema({
  board: {
    a: {
      one: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      },
      two: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      },
      three: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      }
    },
    b: {
      one: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      },
      two: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      },
      three: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      }
    },
    c: {
      one: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      },
      two: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      },
      three: {
        type: String,
        enum: ['a', 'b', '-'],
        default: '-'
      }
    }
  },
  nextMove: {
    type: String,
    enum: ['a', 'b'],
    default: 'a'
  },
  active: {
    type: Boolean,
    default: true
  }
})

module.exports = mongoose.model('game', GameSchema)
