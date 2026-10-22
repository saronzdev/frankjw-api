import { Config } from '@libsql/client'
import { createClient } from '@libsql/client'
import type { ProductInput, ProductRow } from '../types'
import { CorsOptions } from 'cors'

export const ErrorCodes = {
  //Auth Errors
  TokenExpired: 1001,
  InvalidCredentials: 1002,
  AccessDenied: 1003,
  UserNotFound: 1004,
  PasswordIncorrect: 1005,
  AuthError: 1006,
  TooManyRequests: 1007,

  //Products Errors
  ProductNotFound: 1101,
  ProductAlreadyExist: 1102,
  ProductIdInvalid: 1103,

  //Validations Errors
  InvalidMail: 2001,
  RequiredFieldMissing: 2002,
  AlreadyExist: 2003,
  InvalidId: 2004,

  //Server Errors
  DatabaseError: 3001,
  UploadFileError: 3002
}

export const saltRounds = Number(process.env.SALT_ROUNDS) || 10
export const secret = process.env.JWT_SECRET as string

const tursoUrl = process.env.TURSO_URL as string
const tursoToken = process.env.TURSO_TOKEN as string

export const createProductData = (data: ProductInput): ProductRow => {
  const productData: ProductRow = {
    productId: data.productId.toLowerCase(),
    description: data.description,
    category: data.category.toLowerCase(),
    price: data.price,
    weight: data.weight,
    karats: data.karats,
    isActive: data.isActive ? 1 : 0,
    pictures: data.pictures,
    hasDiscount: data.hasDiscount ? 1 : 0,
    offerPrice: data.hasDiscount ? data.offerPrice : undefined
  }
  return productData
}

export const isProd = process.env.NODE_ENV === 'production'
const isEmbeddedDbUrl = (url: string | undefined) => !!url && (url.startsWith(':memory:') || url.startsWith('file:'))
const tursoOptions: Config = isProd
  ? { url: tursoUrl, authToken: tursoToken }
  : isEmbeddedDbUrl(process.env.TURSO_URL)
    ? { url: process.env.TURSO_URL as string }
    : { url: 'file:./local.db' }
export const turso = createClient(tursoOptions)

const PROD_ORIGINS = [
  'https://frankjoyeriacuba.com',
  'https://www.frankjoyeriacuba.com',
  'https://frankjw.vercel.app',
  'https://www.frankjw.vercel.app'
]

const extraOrigins = (process.env.CORS_EXTRA_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedOrigins = new Set([...PROD_ORIGINS, ...extraOrigins])

const local = /^http:\/\/localhost(:\d+)?$/

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isProd) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Origin not allowed'))
      }
    } else {
      if (!origin || local.test(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Origin not allowed in development'))
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}
