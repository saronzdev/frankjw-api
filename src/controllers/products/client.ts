import { turso } from '../../utils/utils'
import { LibsqlError } from '@libsql/client'
import { Request, Response } from 'express'

export const getAll = async (req: Request, res: Response) => {
  try {
    const products = await turso.execute('SELECT * FROM products')
    if (products.rows.length === 0) {
      return res.status(404).json({ message: 'Products not found' })
    }
    return res.json(products.rows)
  } catch (error) {
    if (error instanceof LibsqlError) {
      console.error('Error: ', error.cause)
      res.status(500).json({ message: `An error ocurred: ${error.cause}` })
    }
    res.status(500).json({ message: 'An error ocurred', error })
  }
}

export const getOne = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  try {
    const product = await turso.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [id]
    })
    if (!product.rows[0]) {
      return res.status(404).json({ message: 'Product not found' })
    }
    return res.json(product.rows[0])
  } catch (error) {
    if (error instanceof LibsqlError) {
      console.error('Error: ', error.cause)
      res.status(500).json({ message: `An error ocurred: ${error.cause}` })
    }
    res.status(500).json({ message: 'An error ocurred', error })
  }
}
