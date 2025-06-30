import express, { Router } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { initdb } from './utils/database'
import { products } from './routers/products'
import { auth } from './routers/auth'

const PORT = process.env.PORT ?? 3000
initdb().catch((error) => {
  console.error('Error initializing database:', error)
  process.exit(1)
})

export const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.get('/api', (req, res) => {
  res.send('Server working correctly')
})

app.use('/api/v1', products)
app.use('/api/v1/auth', auth)

app.listen(PORT, () => {
  console.log('Server running on port', PORT)
})
