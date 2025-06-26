import { turso } from './config'

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
}
