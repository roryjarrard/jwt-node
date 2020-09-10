require('dotenv').config()
const express = require('express')
const cors = require('cors')
const PORT = process.env.PORT || 3000

const app = express()
app.use(express.json())
app.use(cors())

// create default route
app.get('*', (req, res) => {
	res.send('welcome to jwt-node')
})

app.listen(PORT, () => {
	console.log(`Server listening on port :${PORT}...`)
})
