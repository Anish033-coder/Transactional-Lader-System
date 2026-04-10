exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {

    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

    table.string('email', 255).unique().notNullable()
    table.string('password_hash', 255).notNullable()
    table.enum('role', ['USER', 'ADMIN']).defaultTo('USER')

    table.timestamps(true, true)

  })
}

exports.down = function(knex) {
  return knex.schema.dropTable('users')
}