import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import rateLimit from 'express-rate-limit'
import { ErrorCodes } from '../utils/config'
import type { NextFunction, Request, RequestHandler, Response } from 'express'

const message = { code: ErrorCodes.TooManyRequests }

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
      })
    : undefined

const distributedLimiter = (limit: number, window: Duration, prefix: string): RequestHandler => {
  const ratelimit = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix
  })
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { success } = await ratelimit.limit(req.ip ?? 'unknown-ip')
      if (success) {
        next()
        return
      }
      res.status(429).json(message)
    } catch (error) {
      console.error('Rate limit check failed, allowing request:', error)
      next()
    }
  }
}

const localLimiter = (limit: number, windowMs: number): RequestHandler => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message
  })
}

const makeLimiter = (limit: number, window: Duration, windowMs: number, prefix: string): RequestHandler => {
  if (!redis) return localLimiter(limit, windowMs)
  return distributedLimiter(limit, window, prefix)
}

export const loginLimiter: RequestHandler = makeLimiter(10, '15 m', 15 * 60 * 1000, 'frankjw:login')

export const registerLimiter: RequestHandler = makeLimiter(5, '1 h', 60 * 60 * 1000, 'frankjw:register')

export const salesLimiter: RequestHandler = makeLimiter(30, '1 m', 60 * 1000, 'frankjw:sales')
