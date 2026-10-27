import { turso } from './config.js'
import {
  migrateCategoryNames,
  migrateCategoryRename2026,
  migrateCreatedAtTimestamps,
  migrateNumericColumns,
  migrateUserPasswordChangedAt
} from './migrations.js'

let dbInitialized = false

const runMigrations = async () => {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      appliedAt INTEGER DEFAULT (CAST(unixepoch() * 1000 AS INTEGER))
    )
  `)

  const apply = async (name: string, migration: () => Promise<void>) => {
    const existing = await turso.execute({
      sql: 'SELECT 1 FROM migrations WHERE name = ?',
      args: [name]
    })
    if (existing.rows.length > 0) return
    await migration()
    await turso.execute({ sql: 'INSERT INTO migrations (name) VALUES (?)', args: [name] })
  }

  await apply('createdAt_timestamps', migrateCreatedAtTimestamps)
  await apply('category_names', migrateCategoryNames)
  await apply('category_names_2026', migrateCategoryRename2026)
  await apply('user_password_changed_at', migrateUserPasswordChangedAt)
  await apply('numeric_columns', migrateNumericColumns)
}

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
    throw new Error('Failed to initialize products database', { cause: error })
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
    throw new Error('Failed to initialize users database', { cause: error })
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
    throw new Error('Failed to initialize products unique index', { cause: error })
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
    await runMigrations()
    console.log('Database tables created/verified')
    dbInitialized = true
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}
