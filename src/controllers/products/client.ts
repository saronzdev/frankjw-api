import { turso } from '../../utils/config'
import { LibsqlError } from '@libsql/client'
import { Request, Response } from 'express'
import { ErrorCodes } from '../../types/types'
import { ProductType } from '../../types/product'

export const getAll = async (req: Request, res: Response) => {
  try {
    const products = await turso.execute('SELECT * FROM products')
    if (products.rows.length === 0) {
      return res.status(404).json({ code: ErrorCodes.ProductNotFound })
    }
    const data = products.rows.map((p) => ({ ...p, pictures: JSON.parse(p.pictures as string) })) as unknown as ProductType[]
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

// export const getOneById = async (req: Request, res: Response) => {
//   const { id } = req.params

//   if (!id) res.status(400).json(ErrorCodes)
//   try {
//     const product = await turso.execute({
//       sql: 'SELECT * FROM products WHERE id = ?',
//       args: [id]
//     })
//     if (!product.rows[0]) {
//       res.sendStatus(404)
//     }
//     res.json(product.rows[0])
//   } catch (error) {
//     if (error instanceof LibsqlError) {
//       console.error('Error While Geting Product : ', error.cause)
//       res.status(500).json({ code: ErrorCodes.DatabaseError })
//     }
//     res.sendStatus(500)
//   }
// }

export const getOneByCategory = async (req: Request, res: Response) => {
  const { category } = req.params
  try {
    const products = await turso.execute({
      sql: 'SELECT * FROM products WHERE category = ?',
      args: [category]
    })
    if (products.rows.length === 0) {
      return res.status(404).json({ code: ErrorCodes.ProductNotFound })
    }
    res.json(products.rows.map((p) => ({ ...p, pictures: JSON.parse(p.pictures as string) })))
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Geting Products By Category : ', error.message)
      return res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Geting Products By Category : ', error.toString())
    return res.sendStatus(500)
  }
}
