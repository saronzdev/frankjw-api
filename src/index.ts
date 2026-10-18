import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { initdb } from './utils/database'
import { products } from './routers/products'
import { auth } from './routers/auth'
import cookieParser from 'cookie-parser'
import { corsOptions } from './utils/config'
import { assertEnv } from './utils/env'

const PORT = process.env.PORT ?? 3000
assertEnv()
initdb().catch((error) => {
  console.error('Error initializing database:', error)
})

export const app = express()

app.use(cors(corsOptions))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Server working correctly' })
})

app.use('/api/v1', products)
app.use('/api/v1/auth', auth)

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('Server running on port', PORT)
  })
}
