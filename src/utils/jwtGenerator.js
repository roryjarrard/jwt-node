require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports = (user_id) => {
  const payload = {
    user: user_id
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1hr' })
}
