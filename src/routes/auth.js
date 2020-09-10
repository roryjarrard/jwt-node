const router = require('express').Router()
const bcrypt = require('bcrypt')
const { User } = require('../db/models')
const { validAuthInput } = require('../middleware')
const { jwtGenerator } = require('../utils')

router.post('/register', validAuthInput, async (req, res) => {
  try {
    // destructure our request
    const { first_name, last_name, email, password } = req.body

    // check for existing model
    const existingUsers = await User.query().where({ email })
    if (existingUsers.length) {
      return res.status(403).json({ message: 'email already taken' })
    }

    // bcrypt password
    const saltRounds = 10
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(password, salt)

    // create a new user
    const newUser = await User.query().insert({ email, first_name, last_name, password: hashedPassword })

    // generate jwt token
    const token = jwtGenerator(newUser.id)

    // return our authentication token
    return res.status(200).json({ token })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
