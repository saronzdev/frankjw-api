import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { initdb } from './utils/database'
import { products } from './routers/products'
import { auth } from './routers/auth'
import cookieParser from 'cookie-parser'
import { corsOptions, ErrorCodes } from './utils/config'
import { assertEnv } from './utils/env'

const PORT = process.env.PORT ?? 3000
assertEnv()

export const app = express()

app.use(cors(corsOptions))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(express.json())

app.use(async (req, res, next) => {
  try {
    await initdb()
    next()
  } catch (error) {
    console.error('Error initializing database:', error)
    res.status(500).json({ code: ErrorCodes.DatabaseError })
  }
})

app.get('/', (req, res) => {
  res.json({ message: 'Server working correctly' })
})

app.use('/api/v1', products)
app.use('/api/v1/auth', auth)

if (!process.env.VERCEL) {
  initdb()
    .then(() => {
      app.listen(PORT, () => {
        console.log('Server running on port', PORT)
      })
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error)
      process.exit(1)
    })
}
