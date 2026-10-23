import { turso } from '../src/utils/config.js'
import { initdb } from '../src/utils/database.js'
import bcrypt from 'bcrypt'

export const loginAndGetCookie = async (request: any, email: string, password: string) => {
  const res = await request.post('/api/v1/auth/login').send({ email, password })
  const setCookie = res.headers['set-cookie']
  return { res, cookie: setCookie ? setCookie[0] : undefined }
}

export const seedAdmin = async () => {
  await initdb()
  const passwordHash = await bcrypt.hash('Admin12345', Number(process.env.SALT_ROUNDS) || 10)
  await turso.execute({
    sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    args: ['Admin Test', 'admin@test.local', passwordHash, 'admin']
  })
}

export const seedClient = async () => {
  await initdb()
  const passwordHash = await bcrypt.hash('Client12345', Number(process.env.SALT_ROUNDS) || 10)
  await turso.execute({
    sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    args: ['Client Test', 'client@test.local', passwordHash, 'client']
  })
}
