export type ProductIn = {
  productId: string
  name: string
  description: string
  price: number
  weight: number
  karats: number
  pictures: string
}

export type ProductOut = {
  id: number
  pictures: string
  createdAt: Date
}

export type Product = ProductIn & ProductOut

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

export type User = UserIn & UserOut
