import { turso } from './config'

export const migrateCreatedAtTimestamps = async () => {
  try {
    console.log('Starting timestamp migration...')
    const products = await turso.execute(`SELECT id, createdAt FROM products`)

    let updated = 0
    for (const product of products.rows) {
      if (typeof product.createdAt === 'string' && product.createdAt.includes('CURRENT_TIMESTAMP')) {
        await turso.execute({
          sql: 'UPDATE products SET createdAt = ? WHERE id = ?',
          args: [0, product.id]
        })
        updated++
      }
    }

    console.log(`Timestamp migration completed: ${updated} products updated`)
  } catch (error) {
    console.error('Timestamp migration failed:', error)
    throw error
  }
}

export const migrateCategoryNames = async () => {
  try {
    console.log('Starting category migration...')

    const result = await turso.execute({
      sql: 'UPDATE products SET category = ? WHERE category = ?',
      args: ['pulseras y tobilleras', 'pulseras']
    })

    console.log(`Category migration completed: ${result.rowsAffected} products updated`)
  } catch (error) {
    console.error('Category migration failed:', error)
    throw error
  }
}
