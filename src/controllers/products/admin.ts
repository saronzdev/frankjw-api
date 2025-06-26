import { ProductIn, validateProduct } from '../../types/product'
import { turso } from '../../utils/config'
import { LibsqlError } from '@libsql/client'
import { buildUpdateQuery } from '../../utils/config'
import { Request, Response } from 'express'
import { uploadFile } from '../../utils/supabase'

export const addProduct = async (req: Request, res: Response) => {
  const data: ProductIn = req.body
  const productData: ProductIn = {
    productId: data.productId,
    price: Number(data.price),
    weight: Number(data.weight),
    karats: Number(data.karats),
    name: data.name,
    description: data.description,
    pictures: req.files as unknown as Express.Multer.File[]
  }

  if (!validateProduct(productData)) return res.status(400).json({ message: 'Invalid product data' })

  console.log(productData)

  const uploadPromises = productData.pictures?.map((file) => uploadFile(file))
  const uploadResults = await Promise.all(uploadPromises ?? [])

  const errors = uploadResults.filter((result) => typeof result !== 'string')
  if (errors.length > 0) {
    console.error('Errores al subir archivos:', errors)
    res.status(500).json({
      message: 'Error al subir algunas imágenes: ' + errors.join(', ')
    })
  }
  const imageUrls = uploadResults.filter((url): url is string => typeof url === 'string')

  try {
    await turso.execute({
      sql: 'INSERT INTO products (productId, name, description, price, weight, karats, pictures) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        productData.productId,
        productData.name,
        productData.description,
        productData.price,
        productData.weight,
        productData.karats,
        JSON.stringify(imageUrls)
      ]
    })

    res.status(201).json({ message: 'Product created successfully' })
  } catch (error: any) {
    console.error('Error while creating product: ', error.toString())
    res.status(500).json({
      message: 'Error while creating product',
      error: error.toString()
    })
  }
}

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const data: ProductIn = req.body
    const consult = buildUpdateQuery('products', id, data)
    const action = await turso.execute({
      sql: consult.query,
      args: consult.values
    })

    if (action.rowsAffected > 0) {
      res.json({ message: 'Product updated successfully' })
    }

    res.status(404).json({ message: 'Product Not Found' })
  } catch (error: any) {
    console.error('Error while updating product: ', error.toString())
    return res.status(500).json({
      message: 'Error while updating product:' + error.toString()
    })
  }
}

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const action = await turso.execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [id]
    })

    if (action.rowsAffected > 0) {
      return res.json({ message: 'Product deleted successfully' })
    }
    return res.status(404).json({ message: 'Product Not Found' })
  } catch (error) {
    if (error instanceof LibsqlError) {
      console.error('Error: ', error.cause)
      res.status(500).json({ message: `An error ocurred: ${error.cause}` })
    }
    res.status(500).json({ message: 'An error ocurred', error })
  }
}
