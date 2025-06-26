import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { secret } from '../utils/config'
import { isAdmin } from '../utils/verifications'

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
      console.error('User is not admin')
      return res.status(401).json({ message: 'Unauthorized' })
    }
    next()
  } catch (error) {
    console.error('Error de autenticación:', error)
    return res.status(500).json({ message: 'Error de autenticación' })
  }
}
