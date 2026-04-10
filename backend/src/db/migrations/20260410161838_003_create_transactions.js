exports.up = function(knex) {
  return knex.schema.createTable('transactions', function(table) {

    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('from_account_id').references('id').inTable('accounts').nullable()
    table.uuid('to_account_id').references('id').inTable('accounts').notNullable()

    table.specificType('amount', 'NUMERIC(20, 8)').notNullable()
    table.enum('type', ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL']).notNullable()
    table.enum('status', ['PENDING', 'COMPLETED', 'FAILED']).defaultTo('PENDING')

    table.string('note', 200).nullable()
    table.timestamp('completed_at').nullable()

    table.timestamps(true, true)

  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('transactions')
}