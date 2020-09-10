const router = require('express').Router()

router.get('/', (req, res) => {
	res.send('welcome to api routes')
})

module.exports = router
