export interface ProductIn {
  productId: string
  name: string
  description: string
  category: string
  price: number
  weight: number
  karats: number
  pictures?: string[]
}

export type ProductOut = {
  id: number
  pictures: string
  createdAt: Date
}

export type ProductType = ProductIn & ProductOut

export const validateProduct = (data: any): data is ProductIn => {
  return (
    typeof data.productId === 'string' &&
    typeof data.name === 'string' &&
    typeof data.category === 'string' &&
    typeof data.description === 'string' &&
    typeof data.price === 'number' &&
    typeof data.weight === 'number' &&
    typeof data.karats === 'number'
  )
}
