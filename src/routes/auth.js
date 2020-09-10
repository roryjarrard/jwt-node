const router = require('express').Router()

router.get('/', (req, res) => {
	res.send('welcome to auth routes')
})

module.exports = router
