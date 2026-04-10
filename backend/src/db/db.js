const knex = require('knex')
require('dotenv').config()

const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,

  pool: {
    min: 2,
    max: 10
  },

  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
})

module.exports = { db }