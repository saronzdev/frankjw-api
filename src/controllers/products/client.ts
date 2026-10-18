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
  const id = Number(req.params.id)
  if (!id || isNaN(id)) return res.status(400).json({ code: ErrorCodes.InvalidId })
  try {
    const result = await turso.execute({
      sql: 'UPDATE products SET sales = sales + 1 WHERE id = ?',
      args: [id]
    })
    if (result.rowsAffected === 0) return res.status(404).json({ code: ErrorCodes.ProductNotFound })
    res.end()
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Increasing Sales: ', error.message)
      return res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Increasing Sales: ', error.toString())
    return res.sendStatus(500)
  }
}
