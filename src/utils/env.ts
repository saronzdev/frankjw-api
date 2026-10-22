export const assertEnv = () => {
  const missing: string[] = []

  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET')

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.TURSO_URL) missing.push('TURSO_URL')
    if (!process.env.TURSO_TOKEN) missing.push('TURSO_TOKEN')
    if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL')
    if (!process.env.SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY')
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
