exports.up = function(knex) {
  return knex.schema.createTable('ledger_entries', function(table) {

    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table.uuid('transaction_id')
      .references('id')
      .inTable('transactions')
      .notNullable()

    table.uuid('account_id')
      .references('id')
      .inTable('accounts')
      .notNullable()

    table.enum('entry_type', ['DEBIT', 'CREDIT']).notNullable()
    table.specificType('amount', 'NUMERIC(20, 8)').notNullable()
    table.specificType('balance_after', 'NUMERIC(20, 8)').notNullable()
    table.timestamp('created_at').defaultTo(knex.raw('NOW()'))

  })
  .then(function() {
    return knex.raw(
      'CREATE INDEX idx_ledger_account_time ON ledger_entries(account_id, created_at DESC)'
    )
  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('ledger_entries')
}