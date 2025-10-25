import { turso } from './config'

export const migrateCreatedAtTimestamps = async () => {
  try {
    const products = await turso.execute(`SELECT id, createdAt FROM products`)

    for (const product of products.rows) {
      if (typeof product.createdAt === 'string' && product.createdAt.includes('CURRENT_TIMESTAMP')) {
        const migrationDate = new Date('2025-01-01').getTime()
        await turso.execute({
          sql: 'UPDATE products SET createdAt = ? WHERE id = ?',
          args: [migrationDate, product.id]
        })
      }
    }

    console.log('Migration completed: Products timestamps updated')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

export const migrateCategoryNames = async () => {
  try {
    await turso.execute({
      sql: 'UPDATE products SET category = ? WHERE category = ?',
      args: ['pulseras y tobilleras', 'pulseras']
    })

    const result = await turso.execute(`SELECT changes() as count`)
    console.log(`Migration completed: ${result.rows[0].count} products updated from 'pulseras' to 'pulseras y tobilleras'`)
  } catch (error) {
    console.error('Migration failed:', error)
  }
}
