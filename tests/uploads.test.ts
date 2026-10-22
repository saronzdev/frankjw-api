import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/index'
import { loginAndGetCookie, seedAdmin } from './helpers'

const agent = request(app)

let adminCookie: string

describe('uploads', () => {
  beforeAll(async () => {
    await seedAdmin()
    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')
    adminCookie = cookie
  })

  afterAll(() => {
    delete process.env.SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_KEY
    vi.unstubAllGlobals()
  })

  it('POST without admin cookie returns 401 code 1003', async () => {
    const res = await agent.post('/api/v1/uploads').set('Content-Type', 'image/png').send(Buffer.from('x'))
    expect(res.status).toBe(401)
    expect(res.body.code).toBe(1003)
  })

  it('POST without storage config returns 503 code 3002', async () => {
    const res = await agent
      .post('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .set('Content-Type', 'image/png')
      .send(Buffer.from('x'))
    expect(res.status).toBe(503)
    expect(res.body.code).toBe(3002)
  })

  it('POST valid image calls storage and returns 201 public url', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)
    process.env.SUPABASE_URL = 'https://stub.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'service-key'

    const res = await agent
      .post('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .set('Content-Type', 'image/png')
      .send(Buffer.from('png-bytes'))

    expect(res.status).toBe(201)
    expect(res.body.url).toMatch(/^https:\/\/stub\.supabase\.co\/storage\/v1\/object\/public\/pictures\/.+\.png$/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/storage/v1/object/pictures/')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer service-key' })
  })

  it('POST wrong mime type returns 400 without touching storage', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    process.env.SUPABASE_URL = 'https://stub.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'service-key'

    const res = await agent
      .post('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('plain text'))

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
