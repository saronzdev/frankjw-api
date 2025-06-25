export interface ProductIn {
  productId: number
  name: string
  description: string
  price: number
  weight: number
  karats: number
  pictures?: string[]
}

export const validateProduct = (data: any): data is ProductIn => {
  return (
    typeof data.productId === 'number' &&
    typeof data.name === 'string' &&
    typeof data.description === 'string' &&
    typeof data.price === 'number' &&
    typeof data.weight === 'number' &&
    typeof data.karats === 'number'
  )
}
