import { Router } from 'express'
import { validateUser } from '../types/user'
import { User, UserIn } from '../types/types'
import { turso } from '../utils/config'
import { LibsqlError } from '@libsql/client'
import bcrypt from 'bcrypt'
import { saltRounds, secret } from '../utils/config'
import jwt from 'jsonwebtoken'
import { isUserExist } from '../utils/verifications'

export const auth = Router()

auth.post('/login', async (req, res) => {
  const data: UserIn = req.body
  if (!data.email || !data.password) res.status(400).json({ message: 'Email and password are required' })

  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [data.email]
    })
    const user = result.rows[0] as unknown as User
    if (!user) {
      res.status(404).json({ message: 'User not found' })
    }
    const isValid = await bcrypt.compare(data.password, user.password)
    if (!isValid) res.status(401).json({ message: 'Invalid credentials' })

    const expiresIn = '7d'
    const token = jwt.sign({ email: user.email }, secret, { expiresIn })

    res.json({ token })
  } catch (error) {
    if (error instanceof LibsqlError) {
      console.error('Error: ', error.cause)
      res.status(500).json({ message: `An error ocurred: ${error.cause}` })
    }
    res.status(500).json({ message: 'An error ocurred', error })
  }
})

auth.post('/register', async (req, res) => {
  const data: UserIn = req.body
  if (!validateUser(data)) res.status(400).json({ message: 'Invalid user data' })
  if (await isUserExist(data.email)) res.status(404).json({ message: 'User not found' })
  try {
    const password = await bcrypt.hash(data.password, saltRounds)
    await turso.execute({
      sql: 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      args: [data.name, data.email, password, 'client']
    })
    res.status(201).json({ message: 'User created successfully' })
  } catch (error) {
    if (error instanceof LibsqlError) {
      console.error('Error: ', error.cause)
      res.status(500).json({ message: `An error ocurred: ${error.cause}` })
    }
    res.status(500).json({ message: 'An error ocurred', error })
  }
})
