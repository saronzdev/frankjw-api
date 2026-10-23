import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { initdb } from './utils/database'
import { products } from './routers/products'
import { authRouter } from './routers/auth'
import { uploads } from './routers/uploads'
import cookieParser from 'cookie-parser'
import { corsOptions, ErrorCodes, isProd } from './utils/config'
import { assertEnv } from './utils/env'

const PORT = process.env.PORT ?? 3000
assertEnv()

export const app = express()

app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(morgan(isProd ? 'tiny' : 'dev'))
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
app.use('/api/v1/auth', authRouter)
app.use('/api/v1', uploads)

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
