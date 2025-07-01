import { validateProduct } from '../../types/product'
import { createProductData, turso } from '../../utils/config'
import { LibsqlError } from '@libsql/client'
import { Request, Response } from 'express'
import { isProductExist } from '../../utils/validations'
import { ErrorCodes } from '../../types/types'

export const addProduct = async (req: Request, res: Response) => {
  const data = req.body
  const productData = createProductData(data)

  console.log('productData: ', productData.productId)

  if (!validateProduct(productData)) return res.status(400).json({ code: ErrorCodes.RequiredFieldMissing })
  if ((await isProductExist(productData.productId)).exist)
    return res.status(400).json({ code: ErrorCodes.ProductAlreadyExist })

  try {
    await turso.execute({
      sql: 'INSERT INTO products (productId, name, description, category, price, weight, karats, pictures) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        productData.productId,
        productData.name,
        productData.description,
        productData.category,
        productData.price,
        productData.weight,
        productData.karats,
        JSON.stringify(productData.pictures)
      ]
    })
    res.sendStatus(201)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Creating Product: ', error.message)
      return res.status(500).json({
        code: ErrorCodes.DatabaseError
      })
    }
    console.error('Unhandler Error While Creating Product: ', error.toString())
    return res.sendStatus(500)
  }
}

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const data = req.body
    console.log('data: ', data)
    if (!id || isNaN(id)) return res.status(400).json({ code: ErrorCodes.InvalidId })
    const productData = createProductData(data)

    if (!validateProduct(productData)) return res.status(400).json({ code: ErrorCodes.RequiredFieldMissing })
    const isExist = await isProductExist(productData.productId)
    if (isExist.exist && isExist.id !== id) return res.status(400).json({ code: ErrorCodes.ProductAlreadyExist })

    const action = await turso.execute({
      sql: 'UPDATE products SET productId = ?, name = ?, description = ?, category = ?, price = ?, weight = ?, karats = ?, pictures = ? WHERE id = ?',
      args: [
        productData.productId.toString().toLowerCase(),
        productData.name,
        productData.description,
        productData.category.toLowerCase(),
        productData.price,
        productData.weight,
        productData.karats,
        JSON.stringify(productData.pictures),
        id
      ]
    })

    if (action.rowsAffected > 0) {
      res.sendStatus(200)
    }
    res.status(404).json({ code: ErrorCodes.ProductNotFound })
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Creating Product: ', error.message)
      res.status(500).json({
        code: ErrorCodes.DatabaseError
      })
    }
    console.error('Unhandler Error While Updating Product: ', error.toString())
    res.sendStatus(500)
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
      res.json({ message: 'Product Deleted Successfully' })
    }
    res.status(404).json({ code: ErrorCodes.ProductNotFound })
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Unhandler Error While Delete Product: ', error.message)
      res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Delete Product: ', error.toString())
    res.sendStatus(500)
  }
}
