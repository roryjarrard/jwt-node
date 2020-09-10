# Node, Express, Postgres, JWT, Knex and Objection

This is part of a series to compare JWT authentication in different backend
technologies.
  - node
  - flask
  - laravel
  - go

For Node I chose an Express server. Postgres as my database because I'm using it
for other projects and seems more "professional" (not hobby projects). You can
do this with raw SQL statements but I chose to implement Knex and Objection for
ease.

_note: I am using `> ` to denote a command line statement._

## 1 - BASIC PROJECT SETUP

  * Create database to work against
    * `> createdb jwt_node`
  * Create directory to work in
    * `> some-directory> mkdir -p jwt_node && cd jwt_node`
  * Initialize as a Git project
    * `> touch .gitignore`
        ```
        /.idea
        /.vscode
        .env
        node_modules/
        ```
    * `> git init`
    * `> git add .`
    * `> git commit -m "initial commit"`
    * `> git co -b dev`
  * Initialize as a Yarn/NPM project
    * `> yarn init -y`
  * Add initial packages
    * `> yarn add express cors dotenv`
    * `> yarn add -D nodemon`
  * Add `.env` file
    ```
    NODE_ENV=development
    PORT=3000
    ```
  * Add `index.js`
    ```
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
      console.log(`Server running on port :${PORT}...`)
    })
    ```
  * Add dev script in `package.json`
    ```
    ...
    "scripts": {
      "dev": "nodemon index.js"
    },
    "dependencies": ...
    ```
  * Start server: `yarn dev`
  * Test in browser `http://localhost:3000`
    * You should see "welcome to jwt-node"


## 2 - CREATE ROUTER FUNCTIONALITY

We are going to split our entry-point into a proper server file, and add routes.
We will go ahead and add packages we will need for our next section.

<hr>

  * Add all packages needed for database connection, password encryption and
    token creation
    * `> yarn add bcrypt jsonwebtoken knex objection pg pg-hstore`
  * Create a "secret" to be used when creating tokens
    * mac: `> date | md5`
    * windows: `> date | md5sum`
  * Update `.env` to include the secret you just generated and your database
  connection
    ```
    NODE_ENV=development
    PORT=3000
    DEV_DB_URL='postgres://localhost/jwt_node'
    JWT_SECRET=5d7fb... <- whatever you generated or any string you want
    ```
  * I do not like the root of my project to be messy, so create a folder to hold
    all of our source code
    * `> mkdir src`
  * Split out our entry-point from our server code
    * `> touch src/server.js`
      ```
      const express = require('express')
      const cors = require('cors')

      const app = express()
      app.use(express.json())
      app.use(cors())

      // create routes entry
      app.use('/', require('./routes))

      // create default route
      app.get('*', (req, res) => {
        res.send('welcome to jwt-node')
      })

      module.exports = app
      ```
    * Edit `index.js`
      ```
      require('dotenv').config()
      const app = require('./src/server')

      const PORT = process.env.PORT || 3000
      app.listen(PORT, () => {
        console.log(`Server running on port :${PORT}...`)
      })
      ```
    * Create `src/routes/index.js`
      ```
      const router = require('express').Router()

      router.use('/auth', require('./api'))
      router.use('/api', require('./auth'))

      module.exports = router
      ```
    * Create `src/routes/api.js` and `src/routes/auth.js`
      * `api.js`
        ```
        const router = require('express').Router()

        router.get('/', (req, res) => {
          res.send('welcome to api routes')
        })
        ```
      * `auth.js`
        ```
        const router = require('express').Router()

        router.get('/', (req, res) => {
          res.send('welcome to auth routes')
        })
        ```
    * Test `localhost:3000/`, `localhost:3000/api` and `localhost:3000/auth`

## 3 - INITIALIZE KNEX AND CREATE USERS MIGRATION AND MODEL

Well define what a user should look like here.

<hr>

  * Initialize knex
    * `> knex init`
    * This creates a `knexfile.js`
      ```
      // Update with your config settings.
      require('dotenv').config()

      module.exports = {

        development: {
          client: 'pg',
          connection: process.env.DEV_DB_URL,
          migrations: {
            directory: './src/db/migrations'
          },
          seeds: {
            directory: './app/db/seeds'
          }
        },
        ...
      };
      ```
  * Create folders to handle our database functionality
    * `> mkdir -p src/db/{migrations,seeds,models}`
  * Create a module to export our database connection at `src/db/index.js`
    ```
    require('dotenv').config()
    const environment = process.env.NODE_ENV || 'development'
    const config = require('../../knexfile')[environment]

    module.exports = require('knex')(config)
    ```
  * Create a migration for our users table
    * `> knex migrate:make create_users_table`
      * `src/migrations/<datestring>_create_users_table.js` <- your exact filename differs
        ```
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
        ```
  * Now migrate: `> knex migrate:latest`
  * Create our User model at `src/db/models/user.js`
    ```
    const { Model } = require('objection')
    const db = require('../index')

    Model.knex(db)

    class User extends Model {
      static get tableName() {
        return 'users'
      }
    }

    module.exports = User
    ```
  * Create a module for models at `src/db/models/index.js`
    ```
    const User = require('./user')

    module.exports = {
      User
    }
    ```
Now we are set to put our models to work
<hr>

## 4 - CREATE OUR REGISTRATION ROUTE

  * First create middleware to validate input on our auth routes
    at `src/middleware/validAuthInput.js`
    ```
    module.exports = async (req, res, next) => {
      const { email, first_name, last_name, password } = req.body

      function validEmail(userEmail) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(userEmail)
      }

      if (req.path === "/register") {
        console.log(!email.length)
        if (![ email, first_name, last_name, password ].every(Boolean)) {
          return res.status(401).json("Missing Credentials")
        } else if (!validEmail(email)) {
          return res.status(401).json("Invalid Email")
        }
      } else if (req.path === "/login") {
        if (![ email, password ].every(Boolean)) {
          return res.status(401).json("Missing Credentials")
        } else if (!validEmail(email)) {
          return res.status(401).json("Invalid Email")
        }
      }

      next()
    }
    ```
* Export our middleware from `src/middleware/index.js`
    ```
    const validAuthInput = require('./validAuthInput')

    module.exports = {
      validAuthInput
    }
    ```
* Create utility functionality to generate an JWT auth token `src/utils/jwtGenerator.js`
  ```
  const jwt = require('jsonwebtoken')
  require('dotenv').config()

  module.exports = (user_id) => {
    const payload = {
      user: user_id
    }

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1hr' })
  }
  ```
* Export utility functions from `src/utils/index.js`
  ```
  const jwtGenerator = require('./jwtGenerator')

  module.exports = {
    jwtGenerator
  }
  ```
* Create our registration route in `src/routes/auth.js`
    ```
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
    ```

## CREATE LOGIN ROUTE

This leverages much of what you've seen in the registration route

`src/routes/auth.js`
```
router.post('/login', validAuthInput, async (req, res) => {
  try {
    // destructure the request
    const { email, password } = req.body

    // ensure user exists
    const user = await User.query().where({email}).first()

    if (!user) {
      return res.status(401).json({ message: 'password or email incorrect' })
    }

    // check for valid password
    const passwordIsValid = await bcrypt.compare(password, user.password)
    if (!passwordIsValid) {
      return res.status(401).json({ message: 'password or email incorrect' })
    }

    // return jwt
    const token = await jwtGenerator(user.id)
    return res.status(200).json({ token })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'login server error' })
  }
})
```

## USE OUR TOKEN TO AUTHENTICATE ROUTES

We don't want to rewrite this over and over, so we will create middleware that
will check for the presence of a valid token, and use that on "protected"
routes.

  * `src/middleware/tokenValidation.js`
    ```
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
    ```
  * Export from `src/middleware/index.js`
    ```
    const validAuthInput = require('./validAuthInput')
    const tokenValidation = require('./tokenValidation')

    module.exports = {
      validAuthInput,
      tokenValidation
    }
    ```
  * Create our protected route in `src/routes/api.js`
    ```
    const router = require('express').Router()
    const { tokenValidation } = require('../middleware')

    router.get('/user', tokenValidation, (req, res) => {
      res.json({ user: req.user })
    })

    module.exports = router
    ```





