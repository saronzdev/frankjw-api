import express, { Router } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { initdb } from './utils/db'
import { products } from './routers/products'
import { auth } from './routers/auth'

const PORT = process.env.PORT ?? 3000
await initdb()

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Server working correctly')
})

app.use('/api/v1', products)
app.use('/api/v1/auth', auth)

app.listen(PORT, () => {
  console.log('Server running on port', PORT)
})
