const { Model } = require('objection')
const db = require('../index')

Model.knex(db)

class User extends Model {
  static get tableName() {
    return 'users'
  }
}

module.exports = User
