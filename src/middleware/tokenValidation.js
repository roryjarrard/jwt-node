require('dotenv').config()
const jwt = require('jsonwebtoken')
const { User } = require('../db/models')

module.exports = async (req, res, next) => {
  try {
    const token = req.header('authorization').split(' ')[1] // parse out 'Bearer tokenstring'

    if (!token) {
      return res.status(403).json({ message: 'not authorized' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!payload) {
      return res.status(403).json({ message: 'not authorized' })
    }

    // add user to request for
    req.user = await User.query()
                      .select('id', 'first_name', 'last_name', 'email')
                      .where({ id: payload.user })
                      .first()
    next()
  } catch (err) {
    return res.status(403).json({ message: 'not authorized' })
  }
}
