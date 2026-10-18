import { Router } from 'express'
import { validateUser, validateUserLogin, isAdmin, isUserExist } from '../utils/validations'
import type { User, UserIn } from '../types'
import { ErrorCodes, isProd, saltRounds, secret, turso } from '../utils/config'
import { LibsqlError } from '@libsql/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit'
import { auth as requireAdmin } from '../middlewares/auth'

export const auth = Router()

const DUMMY_HASH = '$2b$10$xuJYvQS015hyp7V.WbZXpOW8nBVyEhBOe3pLIfbtyyPuz00rX4kN.'

auth.post('/login', loginLimiter, async (req, res): Promise<void> => {
  const data: UserIn = req.body
  if (!validateUserLogin(data)) {
    res.status(400).json({ code: ErrorCodes.InvalidCredentials })
    return
  }
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [data.email]
    })
    const user = result.rows[0] as unknown as User | undefined
    const passwordHash = user?.password ?? DUMMY_HASH
    const isValid = await bcrypt.compare(data.password, passwordHash)
    if (!user || !isValid) {
      res.status(400).json({ code: ErrorCodes.InvalidCredentials })
      return
    }

    const expiresIn = '7d'
    const token = jwt.sign({ email: user.email }, secret, { expiresIn })
    const role = (await isAdmin(user.email)) ? 'admin' : 'client'
    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    res.setHeader('Set-Cookie', cookie)
    res.status(200).json({ role })
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Login User: ', error.message)
      res.status(500).json({ code: ErrorCodes.DatabaseError })
      return
    }
    console.error('Unhandler Error While Login User: ', error.toString())
    res.sendStatus(500)
  }
})

auth.post('/logout', (_req, res): void => {
  const cookie = serialize('token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 0,
    path: '/'
  })
  res.setHeader('Set-Cookie', cookie)
  res.sendStatus(200)
})

auth.post('/register', registerLimiter, requireAdmin, async (req, res): Promise<void> => {
  const data = req.body as UserIn & { role?: string }
  if (!validateUser(data)) {
    res.status(400).json({ message: 'Invalid User', code: ErrorCodes.InvalidCredentials })
    return
  }
  if (await isUserExist(data.email)) {
    res.status(409).json({ code: ErrorCodes.AlreadyExist })
    return
  }
  const role = data.role === 'admin' ? 'admin' : 'client'
  try {
    const password = await bcrypt.hash(data.password, saltRounds)
    await turso.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: [data.name, data.email, password, role]
    })
    res.sendStatus(201)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Register User: ', error.message)
      res.status(500).json({ code: ErrorCodes.DatabaseError })
      return
    }
    console.error('Unhandler Error While Register User: ', error.toString())
    res.sendStatus(500)
  }
})

auth.get('/me', async (req, res): Promise<void> => {
  const token = req.cookies.token
  if (!token) {
    res.status(401).json({ code: ErrorCodes.AccessDenied })
    return
  }
  try {
    const user = jwt.verify(token, secret) as User
    if (!(await isUserExist(user.email))) {
      res.status(404).json({ code: ErrorCodes.UserNotFound })
      return
    }
    const role = (await isAdmin(user.email)) ? 'admin' : 'client'
    res.status(200).json({ email: user.email, role })
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token Expired Error')
      res.status(401).json({ code: ErrorCodes.TokenExpired })
      return
    }
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('Invalid Token Error')
      res.status(401).json({ code: ErrorCodes.AccessDenied })
      return
    }
    console.error('Auth Error: ', error.toString())
    res.status(500).json({ code: ErrorCodes.AuthError })
  }
})
