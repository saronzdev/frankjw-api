import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import { app } from '../src/index.js'
import { loginAndGetCookie, seedAdmin } from './helpers.js'

const agent = request(app)

let adminCookie: string

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]),
  Buffer.from('png-payload')
])
const JPEG_BYTES = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]),
  Buffer.from('jpeg-payload')
])

describe('uploads', () => {
  const makeStorageFetch = (payload: object) =>
    vi.fn(async (_url: string, init?: RequestInit) => {
      if ((init?.method ?? 'GET') === 'GET' && init?.body) {
        throw new TypeError('Request with GET/HEAD method cannot have body.')
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    })

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

  it('POST valid image posts to storage and returns 201 public url', async () => {
    const fetchMock = makeStorageFetch({ Key: 'pictures/stub.png', Id: 'id' })
    vi.stubGlobal('fetch', fetchMock)
    process.env.SUPABASE_URL = 'https://stub.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'service-key'

    const res = await agent
      .post('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .set('Content-Type', 'image/png')
      .send(PNG_BYTES)

    expect(res.status).toBe(201)
    expect(res.body.url).toMatch(/^https:\/\/stub\.supabase\.co\/storage\/v1\/object\/public\/pictures\/.+\.png$/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('/storage/v1/object/pictures/')
    expect(String(url)).toMatch(/\.png$/)
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeInstanceOf(Uint8Array)
    const headers = new Headers(init?.headers)
    expect(headers.get('apikey')).toBe('service-key')
    expect(headers.get('authorization')).toBe('Bearer service-key')
    expect(headers.get('content-type')).toBe('image/png')
    expect(headers.get('x-upsert')).toBe('false')
    expect(headers.get('cache-control')).toBe('max-age=31536000')
  })

  it('POST with new-format secret key sends apikey and bearer headers', async () => {
    const fetchMock = makeStorageFetch({ Key: 'pictures/stub.png', Id: 'id' })
    vi.stubGlobal('fetch', fetchMock)
    process.env.SUPABASE_URL = 'https://stub.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'sb_secret_test_key'

    const res = await agent
      .post('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .set('Content-Type', 'image/png')
      .send(PNG_BYTES)

    expect(res.status).toBe(201)
    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('apikey')).toBe('sb_secret_test_key')
    expect(headers.get('authorization')).toBe('Bearer sb_secret_test_key')
  })

  it('POST with valid declared MIME but wrong magic bytes returns 400', async () => {
    const fetchMock = makeStorageFetch({ Key: 'pictures/stub.png', Id: 'id' })
    vi.stubGlobal('fetch', fetchMock)
    process.env.SUPABASE_URL = 'https://stub.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'service-key'

    const res = await agent
      .post('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .set('Content-Type', 'image/png')
      .send(Buffer.from('plain text posing as a png'))

    expect(res.status).toBe(400)
    expect(res.body.code).toBe(3002)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('POST with mismatched content-type (jpeg bytes declared png) returns 400', async () => {
    const fetchMock = makeStorageFetch({ Key: 'pictures/stub.jpg', Id: 'id' })
    vi.stubGlobal('fetch', fetchMock)
    process.env.SUPABASE_URL = 'https://stub.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'service-key'

    const res = await agent
      .post('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .set('Content-Type', 'image/png')
      .send(JPEG_BYTES)

    expect(res.status).toBe(400)
    expect(res.body.code).toBe(3002)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('DELETE valid url sends DELETE with prefixes payload and returns 200', async () => {
    const fetchMock = makeStorageFetch([])
    vi.stubGlobal('fetch', fetchMock)
    process.env.SUPABASE_URL = 'https://stub.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = 'service-key'

    const res = await agent
      .delete('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .query({ url: 'https://stub.supabase.co/storage/v1/object/public/pictures/abc123.webp' })

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://stub.supabase.co/storage/v1/object/pictures')
    expect(init?.method).toBe('DELETE')
    expect(JSON.parse(String(init?.body))).toEqual({
      prefixes: ['abc123.webp']
    })
  })

  it('DELETE tolerates empty storage response (already gone) and returns 200', async () => {
    const fetchMock = makeStorageFetch([])
    vi.stubGlobal('fetch', fetchMock)

    const res = await agent
      .delete('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .query({ url: 'https://stub.supabase.co/storage/v1/object/public/pictures/gone.jpeg' })

    expect(res.status).toBe(200)
  })

  it('DELETE invalid url returns 400 without touching storage', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const res = await agent
      .delete('/api/v1/uploads')
      .set('Cookie', adminCookie)
      .query({ url: 'https://stub.supabase.co/storage/v1/object/public/pictures/sub/dir.png' })

    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
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
