import type { ProductInput } from './utils/schemas.js'

export type { ProductInput }

export type ProductRow = Omit<ProductInput, 'isActive' | 'hasDiscount'> & {
  isActive: number
  hasDiscount: number
}

export type ProductOut = {
  id: number
  createdAt: number
}

export type ProductType = ProductInput & ProductOut

export type UserIn = {
  name: string
  password: string
  email: string
}

export type UserOut = {
  id: number
  role: 'admin' | 'client'
  createdAt: Date
}

export type User = UserIn & UserOut & { passwordChangedAt?: number }
