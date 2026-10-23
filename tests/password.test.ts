import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/index'
import { loginAndGetCookie, seedAdmin } from './helpers'

const agent = request(app)

describe('password change', () => {
  beforeAll(async () => {
    await seedAdmin()
  })

  const NEW_PASSWORD = 'NewSecure123'

  it('returns 401 without cookie', async () => {
    const res = await agent
      .patch('/api/v1/auth/password')
      .send({ currentPassword: 'Admin12345', newPassword: NEW_PASSWORD })
    expect(res.status).toBe(401)
    expect(res.body.code).toBe(1003)
  })

  it('rejects a short newPassword with 400', async () => {
    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')
    const res = await agent
      .patch('/api/v1/auth/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'Admin12345', newPassword: 'short' })
    expect(res.status).toBe(400)
  })

  it('rejects a wrong currentPassword with 400 code 1005', async () => {
    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')
    const res = await agent
      .patch('/api/v1/auth/password')
      .set('Cookie', cookie)
      .send({ currentPassword: 'definitely-wrong', newPassword: NEW_PASSWORD })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe(1005)
  })

  it('changes the password, reissues the cookie and revokes old cookies', async () => {
    const { cookie: oldCookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')

    const change = await agent
      .patch('/api/v1/auth/password')
      .set('Cookie', oldCookie)
      .send({ currentPassword: 'Admin12345', newPassword: NEW_PASSWORD })
    expect(change.status).toBe(200)

    const meWithOldCookie = await agent.get('/api/v1/auth/me').set('Cookie', oldCookie)
    expect(meWithOldCookie.status).toBe(401)
  })

  it('login fails with old password and works with the new one', async () => {
    const oldLogin = await agent.post('/api/v1/auth/login').send({ email: 'admin@test.local', password: 'Admin12345' })
    expect(oldLogin.status).toBe(401)
    expect(oldLogin.body.code).toBe(1002)

    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', NEW_PASSWORD)
    expect(cookie).toBeDefined()

    const me = await agent.get('/api/v1/auth/me').set('Cookie', cookie)
    expect(me.status).toBe(200)
    expect(me.body.email).toBe('admin@test.local')
  })
})
