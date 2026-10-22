import { Request, Response } from 'express'
import { LibsqlError } from '@libsql/client'
import { productInputSchema } from '../../utils/schemas'
import { ErrorCodes, createProductData, turso } from '../../utils/config'
import { isProductExist } from '../../utils/validations'

export const addProduct = async (req: Request, res: Response): Promise<void> => {
  const parsed = productInputSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ code: ErrorCodes.RequiredFieldMissing })
    return
  }
  const productData = createProductData(parsed.data)

  if ((await isProductExist(productData.productId)).exist) {
    res.status(400).json({ code: ErrorCodes.ProductAlreadyExist })
    return
  }
  try {
    await turso.execute({
      sql: 'INSERT INTO products (productId, description, category, price, weight, karats, pictures, isActive, hasDiscount, offerPrice, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        productData.offerPrice ?? null,
        Date.now()
      ]
    })
    res.sendStatus(201)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Creating Product: ', error.message)
      if (error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ code: ErrorCodes.ProductAlreadyExist })
        return
      }
      res.status(500).json({ code: ErrorCodes.DatabaseError })
      return
    }
    console.error('Unhandler Error While Creating Product: ', error.toString())
    res.sendStatus(500)
  }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (!id || isNaN(id)) {
      res.status(400).json({ code: ErrorCodes.InvalidId })
      return
    }
    const parsed = productInputSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ code: ErrorCodes.RequiredFieldMissing })
      return
    }
    const productData = createProductData(parsed.data)
    const isExist = await isProductExist(productData.productId)
    if (isExist.exist && isExist.id !== id) {
      res.status(400).json({ code: ErrorCodes.ProductAlreadyExist })
      return
    }

    const action = await turso.execute({
      sql: 'UPDATE products SET productId = ?, description = ?, category = ?, price = ?, weight = ?, karats = ?, pictures = ?, isActive = ?, hasDiscount = ?, offerPrice = ? WHERE id = ?',
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
        productData.offerPrice ?? null,
        id
      ]
    })

    if (action.rowsAffected === 0) {
      res.status(404).json({ code: ErrorCodes.ProductNotFound })
      return
    }
    res.sendStatus(200)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Updating Product: ', error.message)
      if (error.message.includes('UNIQUE constraint failed')) {
        res.status(400).json({ code: ErrorCodes.ProductAlreadyExist })
        return
      }
      res.status(500).json({ code: ErrorCodes.DatabaseError })
      return
    }
    console.error('Unhandler Error While Updating Product: ', error.toString())
    res.sendStatus(500)
  }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (!id || isNaN(id)) {
      res.status(400).json({ code: ErrorCodes.InvalidId })
      return
    }
    const action = await turso.execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [id]
    })

    if (action.rowsAffected === 0) {
      res.status(404).json({ code: ErrorCodes.ProductNotFound })
      return
    }
    res.sendStatus(200)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Unhandler Error While Delete Product: ', error.message)
      res.status(500).json({ code: ErrorCodes.DatabaseError })
      return
    }
    console.error('Unhandler Error While Delete Product: ', error.toString())
    res.sendStatus(500)
  }
}
