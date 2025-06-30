import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { secret } from '../utils/config'
import { isAdmin } from '../utils/validations'
import { ErrorCodes } from '../types/types'

type MyRequest = Request & { user: any }
type User = {
  email: string
}

export const auth = async (req: MyRequest, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1] as string
  if (!token) {
    res.status(401).json({ code: ErrorCodes.AccessDenied })
  }
  try {
    const user = jwt.verify(token, secret) as User
    req.user = user
    if (!(await isAdmin(user.email))) {
      console.error('User Is Not Admin')
      res.status(401).json({ code: ErrorCodes.AccessDenied })
    }
    next()
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      if (error.name === 'TokenExpiredError') console.log('Token Expired Error')
      res.status(401).json({ code: ErrorCodes.TokenExpired })
    }
    console.error('Auth Error: ', error.toString())
    res.status(500).json({ code: ErrorCodes.AuthError })
  }
}
