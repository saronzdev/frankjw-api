import { turso } from './config'

let dbInitialized = false

const initProductsDatabase = async () => {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        karats TEXT NOT NULL,
        weight FLOAT,
        price FLOAT,
        pictures TEXT,
        sales INTEGER DEFAULT 0,
        isActive BOOLEAN,
        createdAt INTEGER DEFAULT (CAST(unixepoch() * 1000 AS INTEGER))
      )
    `)
  } catch (error) {
    console.error('Error creating products table:', error)
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
        createdAt INTEGER DEFAULT (CAST(unixepoch() * 1000 AS INTEGER))
      )
    `)
  } catch (error) {
    console.error('Error creating users table:', error)
    throw new Error('Failed to initialize users database')
  }
}

export const initdb = async () => {
  if (dbInitialized) {
    console.log('Database already initialized')
    return
  }

  try {
    console.log('Initializing database...')
    await initProductsDatabase()
    await initUsersDatabase()
    console.log('Database tables created/verified')
    dbInitialized = true
  } catch (error) {
    console.error('Error initializing database:', error)
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
  }
}
