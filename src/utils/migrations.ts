import { turso } from './config'

export const migrateCreatedAtTimestamps = async () => {
  const FIXED_DATE_MS = 1735689600000 // 2025-01-01T00:00:00Z
  const result = await turso.execute({
    sql: `
      UPDATE products
      SET createdAt = ?
      WHERE createdAt IS NULL
        OR typeof(createdAt) != 'integer'
        OR createdAt < 1000000000000
        OR createdAt = 0
    `,
    args: [FIXED_DATE_MS]
  })
  console.log(`createdAt updated: ${result.rowsAffected}`)
}

export const migrateCategoryNames = async () => {
  const result = await turso.execute({
    sql: `
      UPDATE products
      SET category = ?
      WHERE lower(category) = ?
    `,
    args: ['pulseras y tobilleras', 'pulseras']
  })
  console.log(`categories renamed: ${result.rowsAffected}`)
}
