import { ProductIn, validateProduct } from '../../types/product'
import { turso } from '../../utils/utils'
import { LibsqlError } from '@libsql/client'
import { buildUpdateQuery } from '../../utils/utils'
import { Request, Response } from 'express'

export const addProduct = async (req: Request, res: Response) => {
  const data: ProductIn = req.body
  if (!validateProduct(data)) {
    return res.status(400).json({ message: 'Invalid product data' })
  }

  try {
    await turso.execute({
      sql: 'INSERT INTO products (productId, name, description, price, weight, karats, pictures) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: [
        data.productId.toString(),
        data.name,
        data.description,
        data.price,
        data.weight,
        data.karats,
        JSON.stringify(data.pictures) ?? null
      ]
    })
    res.status(201).json({ message: 'Product created successfully' })
  } catch (error) {
    if (error instanceof LibsqlError) {
      console.error('Error: ', error.cause)
      res.status(500).json({ message: `An error ocurred: ${error.cause}` })
    }
    res.status(500).json({ message: 'An error ocurred', error })
  }
}

export const updateProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const data: ProductIn = req.body
  const consult = buildUpdateQuery('products', id, data)
  try {
    const action = await turso.execute({
      sql: consult.query,
      args: consult.values
    })

    if (action.rowsAffected > 0) {
      return res.json({ message: 'Product updated successfully' })
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

export const deleteProduct = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  try {
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
