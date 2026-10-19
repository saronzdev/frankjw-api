import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/index'

describe('api smoke', () => {
  it('GET /api/v1/products returns 200 array', async () => {
    const res = await request(app).get('/api/v1/products')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
