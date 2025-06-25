import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { secret, isAdmin } from '../utils/utils'

type MyRequest = Request & { user: any }
type User = {
  email: string
}

export const auth = async (req: MyRequest, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1] as string
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  try {
    const user = jwt.verify(token, secret) as User
    req.user = user
    if (!(await isAdmin(user.email))) {
      return res.status(401).json({ message: 'Unauthorized', details: 'User is not admin' })
    }
    next()
  } catch (error) {
    console.error('Error de autenticación:', error)
    return res.status(500).json({ message: 'Error de autenticación' })
  }
}
