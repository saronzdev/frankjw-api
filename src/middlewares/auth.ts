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
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ code: ErrorCodes.AccessDenied })
  }
  try {
    const user = jwt.verify(token, secret) as User
    req.user = user
    if (!(await isAdmin(user.email))) {
      console.error('User Is Not Admin')
      return res.status(401).json({ code: ErrorCodes.AccessDenied })
    }
    next()
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      if (error.name === 'TokenExpiredError') {
        console.error('Token Expired Error')
        return res.status(401).json({ code: ErrorCodes.TokenExpired })
      }
    }
    console.error('Auth Error: ', error.toString())
    return res.status(500).json({ code: ErrorCodes.AuthError })
  }
}
