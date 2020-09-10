const router = require('express').Router()
const { tokenValidation } = require('../middleware')

router.get('/user', tokenValidation, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router
