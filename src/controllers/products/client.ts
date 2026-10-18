import { turso } from '../../utils/config'
import { LibsqlError } from '@libsql/client'
import { Request, Response } from 'express'
import { ErrorCodes } from '../../utils/config'
import { ProductType } from '../../types'

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const getAll = async (req: Request, res: Response) => {
  try {
    const products = await turso.execute(`SELECT * FROM products`)
    const data = products.rows.map((p) => ({
      ...p,
      pictures: parseJson<string[]>(p.pictures, []),
      karats: parseJson<number[]>(p.karats, [])
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
