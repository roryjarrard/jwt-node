const express = require('express')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

// create routes entry
app.use('/', require('./routes'))

// create default route
app.get('*', (req, res) => {
	res.send('welcome to jwt-node')
})

module.exports = app
