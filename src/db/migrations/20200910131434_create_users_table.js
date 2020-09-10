exports.up = async (knex) => {
  await knex.schema.createTable('users', t => {
    t.increments('id')
    t.string('first_name', 30).notNullable()
    t.string('last_name', 40).notNullable()
    t.string('email', 120).notNullable()
    t.string('password', 120).notNullable()
    t.timestamps(false, true)
  })
};

exports.down = async (knex) => {
  await knex.schema.dropTable('users')
};
