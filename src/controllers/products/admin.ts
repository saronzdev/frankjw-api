import { validateProduct } from '../../utils/validations'
import { createProductData, turso } from '../../utils/config'
import { LibsqlError } from '@libsql/client'
import { Request, Response } from 'express'
import { isProductExist } from '../../utils/validations'
import { ErrorCodes } from '../../utils/config'

export const addProduct = async (req: Request, res: Response) => {
  const data = req.body
  const productData = createProductData(data)

  if (!validateProduct(productData)) return res.status(400).json({ code: ErrorCodes.RequiredFieldMissing })
  if ((await isProductExist(productData.productId)).exist)
    return res.status(400).json({ code: ErrorCodes.ProductAlreadyExist })
  try {
    await turso.execute({
      sql: 'INSERT INTO products (productId, description, category, price, weight, karats, pictures, isActive, hasDiscount, offerPrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        productData.productId,
        productData.description,
        productData.category,
        productData.price,
        productData.weight,
        JSON.stringify(productData.karats),
        JSON.stringify(productData.pictures),
        productData.isActive,
        productData.hasDiscount,
        productData.offerPrice ?? null
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
    if (!id || isNaN(id)) return res.status(400).json({ code: ErrorCodes.InvalidId })
    const productData = createProductData(data)

    if (!validateProduct(productData)) return res.status(400).json({ code: ErrorCodes.RequiredFieldMissing })
    const isExist = await isProductExist(productData.productId)
    if (isExist.exist && isExist.id !== id) return res.status(400).json({ code: ErrorCodes.ProductAlreadyExist })

    const action = await turso.execute({
      sql: 'UPDATE products SET productId = ?, description = ?, category = ?, price = ?, weight = ?, karats = ?, pictures = ?, isActive = ?, hasDiscount = ?, offerPrice = ? WHERE id = ?',
      args: [
        productData.productId.toString().toLowerCase(),
        productData.description,
        productData.category.toLowerCase(),
        productData.price,
        productData.weight,
        JSON.stringify(productData.karats),
        JSON.stringify(productData.pictures),
        productData.isActive,
        productData.hasDiscount,
        productData.offerPrice ?? null,
        id
      ]
    })

    if (action.rowsAffected === 0) {
      return res.status(404).json({ code: ErrorCodes.ProductNotFound })
    }
    res.sendStatus(200)
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

    if (action.rowsAffected === 0) {
      return res.status(404).json({ code: ErrorCodes.ProductNotFound })
    }
    res.sendStatus(200)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Unhandler Error While Delete Product: ', error.message)
      return res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Delete Product: ', error.toString())
    return res.sendStatus(500)
  }
}
