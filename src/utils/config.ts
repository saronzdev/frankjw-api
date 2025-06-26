import { Config } from '@libsql/client'
import { createClient } from '@libsql/client'

export const saltRounds = Number(process.env.SALT_ROUNDS) || 10
export const secret = process.env.JWT_SECRET as string

const tursoUrl = process.env.TURSO_URL as string
const tursoToken = process.env.TURSO_TOKEN as string
export const supabaseUrl = process.env.SUPABASE_URL as string
export const supabaseToken = process.env.SUPABASE_TOKEN as string

export const isProd = process.env.NODE_ENV === 'production'
const tursoOptions: Config = isProd ? { url: tursoUrl, authToken: tursoToken } : { url: 'file:./local.db' }
export const turso = createClient(tursoOptions)

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
