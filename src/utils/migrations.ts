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

/** Legacy table DDLs stored text defaults as literals ('CAST(unixepoch() * 1000 AS INTEGER)'),
 * so rows created afterwards ended up with text createdAt (breaking the newest-first sort)
 * and text sales values. This migration rewrites any non-numeric createdAt to the migration
 * time and normalizes sales to 0; the app now inserts an explicit Date.now() so it only
 * ever has to run once. */
export const migrateNumericColumns = async () => {
  const now = Date.now()
  const createdAt = await turso.execute({
    sql: `
      UPDATE products
      SET createdAt = ?
      WHERE createdAt IS NULL
        OR typeof(createdAt) != 'integer'
        OR createdAt < 1000000000000
    `,
    args: [now]
  })
  const sales = await turso.execute({
    sql: `
      UPDATE products
      SET sales = 0
      WHERE sales IS NULL
        OR typeof(sales) != 'integer'
    `
  })
  console.log(`numeric columns repaired: createdAt=${createdAt.rowsAffected}, sales=${sales.rowsAffected}`)
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

export const migrateUserPasswordChangedAt = async () => {
  const columns = await turso.execute('PRAGMA table_info(users)')
  const exists = columns.rows.some((row) => row.name === 'passwordChangedAt')
  if (exists) {
    console.log('users.passwordChangedAt already present')
    return
  }
  await turso.execute('ALTER TABLE users ADD COLUMN passwordChangedAt INTEGER DEFAULT 0')
  console.log('users.passwordChangedAt column added')
}
