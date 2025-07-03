import { Config } from '@libsql/client'
import { createClient } from '@libsql/client'
import type { ProductIn } from '../types/product'
import { CorsOptions } from 'cors'

export const saltRounds = Number(process.env.SALT_ROUNDS) || 10
export const secret = process.env.JWT_SECRET as string

const tursoUrl = process.env.TURSO_URL as string
const tursoToken = process.env.TURSO_TOKEN as string

export const createProductData = (data: ProductIn) => {
  const productData: ProductIn = {
    productId: data.productId.toString().toLowerCase(),
    name: data.name,
    description: data.description,
    category: data.category.toLowerCase(),
    price: Number(data.price),
    weight: Number(data.weight),
    karats: Number(data.karats),
    pictures: data.pictures
  }
  return productData
}
export const isProd = process.env.NODE_ENV === 'production'
const tursoOptions: Config = isProd ? { url: tursoUrl, authToken: tursoToken } : { url: 'file:./local.db' }
export const turso = createClient(tursoOptions)

const allowedOrigins = ['http://localhost:5173', 'https://frankjoyeriacuba.com', 'https://frankjw.vercel.app']

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('El origen no está permitido'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}
