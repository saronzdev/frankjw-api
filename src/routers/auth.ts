import { Router } from 'express'
import { validateUser, validateUserLogin, isUserExist } from '../utils/validations'
import type { User, UserIn } from '../types'
import { ErrorCodes, isProd, saltRounds, secret, turso } from '../utils/config'
import { changePasswordSchema } from '../utils/schemas'
import { LibsqlError } from '@libsql/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { serialize } from 'cookie'
import { loginLimiter, registerLimiter } from '../middlewares/rateLimit'
import { auth, adminOnly } from '../middlewares/auth'

export const authRouter = Router()

const DUMMY_HASH = '$2b$10$xuJYvQS015hyp7V.WbZXpOW8nBVyEhBOe3pLIfbtyyPuz00rX4kN.'
const expiresIn = '7d'

const buildAuthCookie = (token: string) => {
  return serialize('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })
}

const buildClearCookie = () => {
  return serialize('token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 0,
    path: '/'
  })
}

authRouter.post('/login', loginLimiter, async (req, res): Promise<void> => {
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

    const token = jwt.sign({ email: user.email, pwd: user.passwordChangedAt ?? 0 }, secret, { expiresIn })
    res.setHeader('Set-Cookie', buildAuthCookie(token))
    res.status(200).json({ role: user.role })
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

authRouter.post('/logout', (_req, res): void => {
  res.setHeader('Set-Cookie', buildClearCookie())
  res.sendStatus(200)
})

authRouter.post('/register', registerLimiter, auth, adminOnly, async (req, res): Promise<void> => {
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

authRouter.get('/me', auth, (req, res): void => {
  if (!req.user) {
    res.status(401).json({ code: ErrorCodes.AccessDenied })
    return
  }
  res.status(200).json({ email: req.user.email, role: req.user.role })
})

authRouter.patch('/password', auth, async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ code: ErrorCodes.AccessDenied })
    return
  }
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ code: ErrorCodes.RequiredFieldMissing })
    return
  }
  try {
    const rows = await turso.execute({
      sql: 'SELECT password FROM users WHERE email = ?',
      args: [req.user.email]
    })
    const row = rows.rows[0] as unknown as { password?: string } | undefined
    if (!row?.password) {
      res.status(404).json({ code: ErrorCodes.UserNotFound })
      return
    }
    const isValid = await bcrypt.compare(parsed.data.currentPassword, row.password)
    if (!isValid) {
      res.status(400).json({ code: ErrorCodes.PasswordIncorrect })
      return
    }
    const newPassword = await bcrypt.hash(parsed.data.newPassword, saltRounds)
    const passwordChangedAt = Date.now()
    await turso.execute({
      sql: 'UPDATE users SET password = ?, passwordChangedAt = ? WHERE email = ?',
      args: [newPassword, passwordChangedAt, req.user.email]
    })
    const token = jwt.sign({ email: req.user.email, pwd: passwordChangedAt }, secret, { expiresIn })
    res.setHeader('Set-Cookie', buildAuthCookie(token))
    res.sendStatus(200)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Changing Password: ', error.message)
      res.status(500).json({ code: ErrorCodes.DatabaseError })
      return
    }
    console.error('Unhandler Error While Changing Password: ', error.toString())
    res.sendStatus(500)
  }
})
