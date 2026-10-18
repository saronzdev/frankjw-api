import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/index'
import { loginAndGetCookie, seedAdmin } from './helpers'

const agent = request(app)

describe('auth', () => {
  beforeAll(async () => {
    await seedAdmin()
  })

  it('login returns 200 with HttpOnly cookie for valid credentials', async () => {
    const res = await agent.post('/api/v1/auth/login').send({ email: 'admin@test.local', password: 'Admin12345' })
    expect(res.status).toBe(200)
    expect(res.body.role).toBe('admin')
    const cookie = res.headers['set-cookie'][0]
    expect(cookie).toContain('HttpOnly')
  })

  it('login returns 400 code 1002 for wrong password', async () => {
    const res = await agent.post('/api/v1/auth/login').send({ email: 'admin@test.local', password: 'wrong-password' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe(1002)
  })

  it('login returns 400 code 1002 for unknown email (same code, anti-enumeration)', async () => {
    const res = await agent.post('/api/v1/auth/login').send({ email: 'ghost@test.local', password: 'whatever-pass' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe(1002)
  })

  it('register returns 401 without admin cookie', async () => {
    const res = await agent.post('/api/v1/auth/register').send({ name: 'X', email: 'a@b.c', password: '12345678' })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe(1003)
  })

  it('register creates user when called with admin cookie', async () => {
    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')
    const res = await agent
      .post('/api/v1/auth/register')
      .set('Cookie', cookie)
      .send({ name: 'QA', email: 'qa@test.local', password: 'Qa12345678' })
    expect(res.status).toBe(201)

    const login = await agent.post('/api/v1/auth/login').send({ email: 'qa@test.local', password: 'Qa12345678' })
    expect(login.status).toBe(200)
    expect(login.body.role).toBe('client')
  })

  it('register duplicate email returns 409', async () => {
    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')
    const res = await agent
      .post('/api/v1/auth/register')
      .set('Cookie', cookie)
      .send({ name: 'QA2', email: 'qa@test.local', password: 'Qa12345679' })
    expect(res.status).toBe(409)
    expect(res.body.code).toBe(2003)
  })

  it('me with valid cookie returns email and role', async () => {
    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')
    const res = await agent.get('/api/v1/auth/me').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('admin@test.local')
    expect(res.body.role).toBe('admin')
  })

  it('me without cookie returns 401 code 1003', async () => {
    const res = await agent.get('/api/v1/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe(1003)
  })

  it('me with garbage token returns 401 code 1003', async () => {
    const res = await agent.get('/api/v1/auth/me').set('Cookie', 'token=not.a.jwt')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe(1003)
  })

  it('logout returns 200 and clears the cookie', async () => {
    const res = await agent.post('/api/v1/auth/logout')
    expect(res.status).toBe(200)
    const cookie = res.headers['set-cookie'][0]
    expect(cookie.toLowerCase()).toContain('max-age=0')
  })
})
