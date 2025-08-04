import { Router } from 'express'
import { validateUser, validateUserLogin } from '../utils/validations'
import type { User, UserIn } from '../types'
import { isProd, turso } from '../utils/config'
import { LibsqlError } from '@libsql/client'
import bcrypt from 'bcrypt'
import { saltRounds, secret } from '../utils/config'
import jwt from 'jsonwebtoken'
import { isAdmin, isUserExist } from '../utils/validations'
import { ErrorCodes } from '../utils/config'
import { serialize } from 'cookie'

export const auth = Router()

auth.post('/login', async (req, res): Promise<any> => {
  const data: UserIn = req.body
  if (!validateUserLogin(data)) return res.status(400).json({ code: ErrorCodes.InvalidCredentials })
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [data.email]
    })
    const user = result.rows[0] as unknown as User
    if (!user) {
      return res.status(404).json({ code: ErrorCodes.UserNotFound })
    }
    const isValid = await bcrypt.compare(data.password, user.password)
    if (!isValid) return res.status(400).json({ code: ErrorCodes.PasswordIncorrect })

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
      return res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Login User: ', error.toString())
    return res.sendStatus(500)
  }
})

auth.post('/register', async (req, res): Promise<any> => {
  const data: UserIn = req.body
  if (!validateUser(data)) return res.status(400).json({ message: 'Invalid User', code: ErrorCodes.InvalidCredentials })
  if (await isUserExist(data.email)) return res.status(409).json({ code: ErrorCodes.AlreadyExist })
  try {
    const password = await bcrypt.hash(data.password, saltRounds)
    await turso.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: [data.name, data.email, password, 'client']
    })
    res.sendStatus(201)
  } catch (error: any) {
    if (error instanceof LibsqlError) {
      console.error('Error While Register User: ', error.message)
      return res.status(500).json({ code: ErrorCodes.DatabaseError })
    }
    console.error('Unhandler Error While Register User: ', error.toString())
    return res.sendStatus(500)
  }
})

auth.get('/me', async (req, res): Promise<any> => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ code: ErrorCodes.AccessDenied })
  try {
    const user = jwt.verify(token, secret) as User
    if (!(await isUserExist(user.email))) {
      return res.status(404).json({ code: ErrorCodes.UserNotFound })
    }
    const role = (await isAdmin(user.email)) ? 'admin' : 'client'
    res.status(200).json({ email: user.email, role })
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error('Token Expired Error')
      return res.status(401).json({ code: ErrorCodes.TokenExpired })
    }
    console.error('Auth Error: ', error.toString())
    return res.status(500).json({ code: ErrorCodes.AuthError })
  }
})
