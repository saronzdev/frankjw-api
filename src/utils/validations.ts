import { turso } from './config'
import type {ProductIn, UserIn} from '../types'

export const validateProduct = (data: any): data is ProductIn => {
  return (
    typeof data.productId === 'string' &&
    typeof data.category === 'string' &&
    typeof data.description === 'string' &&
    typeof data.price === 'number' &&
    typeof data.weight === 'number'
  )
}

export const validateUser = (data: any): data is UserIn => {
  return typeof data.name === 'string' && typeof data.email === 'string' && typeof data.password === 'string'
}
export const validateUserLogin = (data: any): data is Omit<UserIn, 'name'> => {
  return typeof data.email === 'string' && typeof data.password === 'string'
}

export const isUserExist = async (email: string) => {
  try {
    const user = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    })
    return user.rows.length > 0
  } catch (error) {
    console.error('Error: ', error)
    return false
  }
}

export const isAdmin = async (email: string) => {
  try {
    const user = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ? AND role = ?',
      args: [email, 'admin']
    })
    return user.rows.length > 0
  } catch (error) {
    console.error('Error: ', error)
    return false
  }
}

export const isProductExist = async (productId: string) => {
  try {
    const product = await turso.execute({
      sql: 'SELECT * FROM products WHERE productId = ?',
      args: [productId]
    })
    const exist = product.rows.length > 0
    if (!exist) return { exist: false, id: null }
    return { exist: true, id: product.rows[0].id}
  } catch (error) {
    return { exist: false, id: null}
  }
}
