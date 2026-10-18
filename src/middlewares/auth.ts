import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ErrorCodes, secret, turso } from '../utils/config'

export type AuthedUser = {
  email: string
  role: 'admin' | 'client'
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // These open interfaces may be extended in an application-specific manner via declaration merging.
    interface Request {
      user?: AuthedUser
    }
  }
}

export const handleAuthError = (error: unknown, res: Response): void => {
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
  console.error('Auth Error: ', String(error))
  res.status(500).json({ code: ErrorCodes.AuthError })
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.token
  if (!token) {
    res.status(401).json({ code: ErrorCodes.AccessDenied })
    return
  }
  let payload: jwt.JwtPayload
  try {
    payload = jwt.verify(token, secret) as jwt.JwtPayload
  } catch (error) {
    handleAuthError(error, res)
    return
  }
  if (typeof payload.email !== 'string') {
    res.status(401).json({ code: ErrorCodes.AccessDenied })
    return
  }
  try {
    const rows = await turso.execute({
      sql: 'SELECT email, role, passwordChangedAt FROM users WHERE email = ?',
      args: [payload.email]
    })
    if (rows.rows.length === 0) {
      res.status(401).json({ code: ErrorCodes.AccessDenied })
      return
    }
    const row = rows.rows[0] as unknown as { email: string; role: string; passwordChangedAt?: number }
    if ((payload.pwd ?? 0) < (row.passwordChangedAt ?? 0)) {
      console.error('Token revoked by a later password change')
      res.status(401).json({ code: ErrorCodes.TokenExpired })
      return
    }
    req.user = { email: row.email, role: row.role === 'admin' ? 'admin' : 'client' }
    next()
  } catch (error) {
    console.error('Database error while authorizing: ', error)
    res.status(500).json({ code: ErrorCodes.DatabaseError })
  }
}

export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== 'admin') {
    res.status(401).json({ code: ErrorCodes.AccessDenied })
    return
  }
  next()
}
