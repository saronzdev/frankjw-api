import { turso } from '../../utils/config'
import { LibsqlError } from '@libsql/client'
import { Request, Response } from 'express'
import { ErrorCodes } from '../../types/errors'
import { ProductType } from '../../types/product'

export const getAll = async (req: Request, res: Response) => {
  try {
    const { orderBy } = req.query
    const products = await turso.execute(`SELECT * FROM products ORDER BY ${orderBy} DESC`)
    if (products.rows.length === 0) {
      return res.status(404).json({ code: ErrorCodes.ProductNotFound })
    }
    const data = products.rows.map((p) => ({
      ...p,
      pictures: JSON.parse(p.pictures as string),
      karats: JSON.parse(p.karats as string)
    })) as unknown as ProductType[]
    res.json(data)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Getting Products: ', error.message)
      return res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Getting Products: ', error.toString())
    return res.sendStatus(500)
  }
}

export const getCats = async (req: Request, res: Response) => {
  try {
    const products = await turso.execute('SELECT category FROM products')
    if (products.rows.length === 0) {
      return res.status(404).json({ code: ErrorCodes.ProductNotFound })
    }
    res.json(products.rows.map((p) => p.category))
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Getting Cats: ', error.message)
      return res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Getting Cats: ', error.toString())
    return res.sendStatus(500)
  }
}

export const getByCategory = async (req: Request, res: Response) => {
  const { category } = req.params
  try {
    const products = await turso.execute({
      sql: 'SELECT * FROM products WHERE category = ?',
      args: [category]
    })
    if (products.rows.length === 0) {
      return res.status(404).json({ code: ErrorCodes.ProductNotFound })
    }
    const data = products.rows.map((p) => ({
      ...p,
      pictures: JSON.parse(p.pictures as string),
      karats: JSON.parse(p.karats as string)
    })) as unknown as ProductType[]
    res.json(data)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Geting Products By Category : ', error.message)
      return res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Geting Products By Category : ', error.toString())
    return res.sendStatus(500)
  }
}

export const increaseSales = async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const product = await turso.execute({ sql: 'SELECT sales FROM products WHERE id = ?', args: [id] })
    if (product.rows.length === 0) return res.sendStatus(404)
    const sales = Number(product.rows[0].sales) + 1
    const result = await turso.execute({ sql: 'UPDATE products SET sales = ? WHERE id = ?', args: [sales, id] })
    if (result.rowsAffected === 0) return res.sendStatus(404)
    res.end()
  } catch {
    return res.sendStatus(500)
  }
}
