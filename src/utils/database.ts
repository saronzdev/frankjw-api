import { turso } from './config'

let dbInitialized = false

const initProductsDatabase = async () => {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        karats TEXT NOT NULL,
        weight REAL NOT NULL,
        price REAL NOT NULL,
        pictures TEXT,
        sales INTEGER DEFAULT 0,
        isActive BOOLEAN NOT NULL,
        hasDiscount BOOLEAN NOT NULL,
        offerPrice REAL,
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
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        createdAt INTEGER DEFAULT (CAST(unixepoch() * 1000 AS INTEGER))
      )
    `)
  } catch (error) {
    console.error('Error creating users table:', error)
    throw new Error('Failed to initialize users database')
  }
}

const initProductsUniqueIndex = async () => {
  try {
    const duplicates = await turso.execute(`
      SELECT productId FROM products
      GROUP BY productId
      HAVING COUNT(*) > 1
      LIMIT 1
    `)
    if (duplicates.rows.length > 0) {
      console.warn('Skipping unique index on products.productId: duplicate productIds found')
      return
    }
    await turso.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_products_productId ON products (productId)')
  } catch (error) {
    console.error('Error creating products unique index:', error)
    throw new Error('Failed to initialize products unique index')
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
    await initProductsUniqueIndex()
    console.log('Database tables created/verified')
    dbInitialized = true
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}
