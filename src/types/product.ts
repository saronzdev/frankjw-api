export interface ProductIn {
  productId: string
  name: string
  description: string
  price: number
  weight: number
  karats: number
  pictures?: Express.Multer.File[]
}

export const validateProduct = (data: any): data is ProductIn => {
  return (
    typeof data.productId === 'string' &&
    typeof data.name === 'string' &&
    typeof data.description === 'string' &&
    typeof data.price === 'number' &&
    typeof data.weight === 'number' &&
    typeof data.karats === 'number'
  )
}
