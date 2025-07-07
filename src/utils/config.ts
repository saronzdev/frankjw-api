import { Config } from '@libsql/client'
import { createClient } from '@libsql/client'
import type { ProductIn, ProductInRefactor } from '../types/product'
import { CorsOptions } from 'cors'

export const saltRounds = Number(process.env.SALT_ROUNDS) || 10
export const secret = process.env.JWT_SECRET as string

const tursoUrl = process.env.TURSO_URL as string
const tursoToken = process.env.TURSO_TOKEN as string

export const createProductData = (data: ProductIn) => {
  let karats: number[] = []
  if (Array.isArray(data.karats)) karats = data.karats.map(Number)
  else if (typeof data.karats === 'string') karats = data.karats.split(/\s+/).map(Number)
  else if (typeof data.karats === 'number') karats = [data.karats]

  const productData: ProductInRefactor = {
    productId: data.productId.toString().toLowerCase(),
    name: data.name,
    description: data.description,
    category: data.category.toLowerCase(),
    price: Number(data.price),
    weight: Number(data.weight),
    karats,
    isActive: data.isActive ? 1 : 0,
    pictures: data.pictures
  }
  return productData
}

export const isProd = process.env.NODE_ENV === 'production'
const tursoOptions: Config = isProd ? { url: tursoUrl, authToken: tursoToken } : { url: 'file:./local.db' }
export const turso = createClient(tursoOptions)

const com = /^https?:\/\/([a-zA-Z0-9-]+\.)*frankjoyeriacuba\.com$/
const vercel = /^https:\/\/frankjw[\w-]*\.vercel\.app$/

const allowedOrigins = ['http://localhost:5173', 'https://frankjoyeriacuba.com', 'https://frankjw.vercel.app']

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || com.test(origin) || vercel.test(origin)) {
      callback(null, true)
    } else {
      callback(new Error('El origen no está permitido'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}
