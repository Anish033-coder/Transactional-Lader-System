exports.up = function(knex) {
  return knex.schema.createTable('accounts', function(table) {

    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table.uuid('user_id').references('id').inTable('users').notNullable()
    table.string('name', 100).notNullable().defaultTo('Main Account')
    table.specificType('balance', 'NUMERIC(20, 8)').notNullable().defaultTo(0)

    table.string('currency', 3).notNullable().defaultTo('INR')

    table.enum('status', ['ACTIVE', 'SUSPENDED', 'CLOSED']).defaultTo('ACTIVE')

    table.timestamps(true, true)

  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('accounts')
}