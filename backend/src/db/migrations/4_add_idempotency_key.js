exports.up = function(knex) {
  return knex.schema.table('transactions', function(table) {

    table.string('idempotency_key', 255).unique().nullable()

  })
}

exports.down = function(knex) {
  return knex.schema.table('transactions', function(table) {
    table.dropColumn('idempotency_key')
  })
}