import { Config } from '@libsql/client'
import { createClient } from '@libsql/client'
import path from 'node:path'

export function buildUpdateQuery(table: string, id: number, fields: object) {
  const setClauses: string[] = []
  const values: string | number[] = []

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`)
    values.push(value)
  }
  values.push(id)
  const query = `UPDATE ${table} SET ${setClauses.join(', ')} WHERE id = ?`

  return { query, values }
}

export const saltRounds = Number(process.env.SALT_ROUNDS) || 10
export const secret = process.env.JWT_SECRET ?? 'changeme'

const tursoUrl = process.env.TURSO_DB_URL ?? 'undefined'
const tursoToken = process.env.TURSO_DB_TOKEN

export const isProd = process.env.NODE_ENV === 'production'
let tursoOptions: Config

if (isProd) tursoOptions = { url: tursoUrl, authToken: tursoToken }
else {
  tursoOptions = { url: 'file:./local.db' }
}

export const turso = createClient(tursoOptions)
const initProductsDatabase = async () =>
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId TEXT NOT NULL,
      name TEXT,
      karats FLOAT,
      weight FLOAT,
      price FLOAT,
      description TEXT,
      pictures TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)

const initUsersDatabase = async () =>
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      password TEXT,
      role TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`)

export const initdb = async () => {
  await initProductsDatabase()
  await initUsersDatabase()

  if (!isProd) {
    console.log('📂 DB path →', path.resolve('local.db'))
    const { rows } = await turso.execute(`SELECT name FROM sqlite_master WHERE type='table'`)
    console.log(
      '📄 Tablas en la BD →',
      rows.map((r) => r.name)
    )
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
