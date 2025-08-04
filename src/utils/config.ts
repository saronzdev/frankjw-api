import { Config } from '@libsql/client'
import { createClient } from '@libsql/client'
import type { ProductIn, ProductInRefactor } from '../types'
import { CorsOptions } from 'cors'

export const ErrorCodes = {
  //Auth Errors
  TokenExpired: 1001,
  InvalidCredentials: 1002,
  AccessDenied: 1003,
  UserNotFound: 1004,
  PasswordIncorrect: 1005,
  AuthError: 1006,

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

export const createProductData = (data: ProductIn) => {
  let karats: number[] = []
  if (Array.isArray(data.karats)) karats = data.karats.map(Number)
  else if (typeof data.karats === 'string') karats = data.karats.split(/\s+/).map(Number)
  else if (typeof data.karats === 'number') karats = [data.karats]

  const productData: ProductInRefactor = {
    productId: data.productId.toString().toLowerCase(),
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
const local = /^http:\/\/localhost:*/

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isProd) {
      if (origin && (com.test(origin) || vercel.test(origin))) callback(null, true)
      else callback(new Error('Origen not allowed'))
    } else {
      if (!origin || local.test(origin)) callback(null, true)
      else callback(new Error('Origin not allowed'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}
