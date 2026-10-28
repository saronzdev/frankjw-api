import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.js'
import { loginAndGetCookie, seedAdmin } from './helpers.js'

const agent = request(app)

let adminCookie: string

describe('products cache headers', () => {
  beforeAll(async () => {
    await seedAdmin()
    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')
    adminCookie = cookie
  })

  it('anonymous catalog stays publicly cacheable', async () => {
    const res = await agent.get('/api/v1/products')
    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toContain('public')
    expect(res.headers['cache-control']).toContain('max-age=60')
  })

  it('catalog request with a session cookie is never cached', async () => {
    const res = await agent.get('/api/v1/products').set('Cookie', adminCookie)
    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toContain('no-store')
    expect(res.headers['cache-control']).not.toContain('public')
    expect(res.headers['vary']).toContain('Cookie')
  })
})
