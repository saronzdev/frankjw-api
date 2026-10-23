import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.js'

const agent = request(app)

describe('rate limiting', () => {
  it('blocks the 11th login within the window with 429 code 1007', async () => {
    for (let i = 0; i < 10; i++) {
      await agent.post('/api/v1/auth/login').send({ email: 'ghost@test.local', password: 'wrong-pass' })
    }
    const res = await agent.post('/api/v1/auth/login').send({ email: 'ghost@test.local', password: 'wrong-pass' })
    expect(res.status).toBe(429)
    expect(res.body.code).toBe(1007)
  })
})
