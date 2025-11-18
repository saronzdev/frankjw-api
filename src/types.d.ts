export type ProductIn = {
  productId: string
  description: string
  category: string
  price: number
  weight: number
  karats: number[]
  isActive: boolean
  pictures?: string[]
  hasDiscount: boolean
  offerPrice?: number
}

export type ProductInRefactor = Omit<ProductIn, 'karats', 'isActive', 'hasDiscount'> & {
  karats: number[]
  isActive: number
  hasDiscount: number
}

export type ProductOut = {
  id: number
  pictures: string
  createdAt: Date
}

export type ProductType = ProductIn & ProductOut

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
