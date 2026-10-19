import { Request, Response } from 'express'
import { LibsqlError } from '@libsql/client'
import { ErrorCodes, turso } from '../../utils/config'
import type { ProductType } from '../../types'

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const getAll = async (_req: Request, res: Response): Promise<void> => {
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
      res.status(500).json({ code: ErrorCodes.DatabaseError })
      return
    }
    console.error('Unhandler Error While Getting Products: ', error.toString())
    res.sendStatus(500)
  }
}

export const increaseSales = async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id)
  if (!id || isNaN(id)) {
    res.status(400).json({ code: ErrorCodes.InvalidId })
    return
  }
  try {
    const result = await turso.execute({
      sql: 'UPDATE products SET sales = sales + 1 WHERE id = ?',
      args: [id]
    })
    if (result.rowsAffected === 0) {
      res.status(404).json({ code: ErrorCodes.ProductNotFound })
      return
    }
    res.end()
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Increasing Sales: ', error.message)
      res.status(500).json({ code: ErrorCodes.DatabaseError })
      return
    }
    console.error('Unhandler Error While Increasing Sales: ', error.toString())
    res.sendStatus(500)
  }
}
