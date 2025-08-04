//Products
export type ProductIn = {
  productId: string
  description: string
  category: string
  price: number
  weight: number
  karats: string
  isActive: number
  pictures?: string[]
}

export type ProductInRefactor = Omit<ProductIn, 'karats'> & { karats: number[] }

export type ProductOut = {
  id: number
  pictures: string
  createdAt: Date
}

export type ProductType = ProductIn & ProductOut

//Users 
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