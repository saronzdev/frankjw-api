import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ErrorCodes, secret } from '../utils/config'
import { isAdmin } from '../utils/validations'

type User = {
  email: string
}

type MyRequest = Request & { user?: User }

export const auth = async (req: MyRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.token
  if (!token) {
    res.status(401).json({ code: ErrorCodes.AccessDenied })
    return
  }
  try {
    const user = jwt.verify(token, secret) as User
    req.user = user
    if (!(await isAdmin(user.email))) {
      console.error('User Is Not Admin')
      res.status(401).json({ code: ErrorCodes.AccessDenied })
      return
    }
    next()
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
}
