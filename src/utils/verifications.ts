import { turso } from './config'

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

export const isProductExist = async (productId: number) => {
  try {
    const product = await turso.execute({
      sql: 'SELECT * FROM products WHERE productId = ?',
      args: [productId]
    })
    return product.rows.length > 0
  } catch (error) {
    console.error('Error: ', error)
    return false
  }
}
