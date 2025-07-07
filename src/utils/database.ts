import { turso } from './config'

const initProductsDatabase = async () => {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        karats TEXT NOT NULL,
        weight FLOAT,
        price FLOAT,
        pictures TEXT,
        sales INTEGER DEFAULT '0',
        isActive BOOLEAN,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
  `)
  } catch (error) {
    throw new Error('Failed to initialize products database')
  }
}

const initUsersDatabase = async () => {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        password TEXT,
        role TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`)
  } catch (error) {
    throw new Error('Failed to initialize users database')
  }
}

export const initdb = async () => {
  await initProductsDatabase()
  await initUsersDatabase()
}
