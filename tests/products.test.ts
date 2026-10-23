import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/index'
import { turso } from '../src/utils/config'
import { loginAndGetCookie, seedAdmin } from './helpers'

const agent = request(app)

const baseProduct = {
  productId: 'TEST-001',
  description: 'Anillo de prueba',
  category: 'oro',
  weight: '1,5',
  price: 100,
  karats: [24],
  isActive: true,
  hasDiscount: false
}

let adminCookie: string

describe('products', () => {
  beforeAll(async () => {
    await seedAdmin()
    const { cookie } = await loginAndGetCookie(agent, 'admin@test.local', 'Admin12345')
    adminCookie = cookie
  })

  it('GET empty catalog returns 200 array', async () => {
    const res = await agent.get('/api/v1/products')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('POST product without admin cookie returns 401 code 1003', async () => {
    const res = await agent.post('/api/v1/products').send(baseProduct)
    expect(res.status).toBe(401)
    expect(res.body.code).toBe(1003)
  })

  it('POST valid product returns 201', async () => {
    const res = await agent.post('/api/v1/products').set('Cookie', adminCookie).send(baseProduct)
    expect(res.status).toBe(201)
  })

  it('GET catalog parses karats/pictures and normalizes decimal comma weight', async () => {
    const res = await agent.get('/api/v1/products')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    const p = res.body[0]
    expect(p.weight).toBe(1.5)
    expect(p.karats).toEqual([24])
    expect(p.pictures).toEqual([])
  })

  it('POST stores createdAt and sales as numbers so newest-first sort works', async () => {
    const before = Date.now()
    const res = await agent
      .post('/api/v1/products')
      .set('Cookie', adminCookie)
      .send({ ...baseProduct, productId: 'TEST-101' })
    expect(res.status).toBe(201)

    const list = await agent.get('/api/v1/products')
    const created = list.body.find((p: { productId: string }) => p.productId === 'test-101')
    expect(created).toBeDefined()
    expect(typeof created.createdAt).toBe('number')
    expect(created.createdAt).toBeGreaterThanOrEqual(before)
    expect(created.createdAt).toBeLessThanOrEqual(Date.now())
    expect(typeof created.sales).toBe('number')
    expect(created.sales).toBe(0)

    const del = await agent
      .delete(`/api/v1/products/${created.id}`)
      .set('Cookie', adminCookie)
    expect(del.status).toBe(200)
  })

  it('POST duplicate productId returns 400 code 1102', async () => {
    const res = await agent.post('/api/v1/products').set('Cookie', adminCookie).send(baseProduct)
    expect(res.status).toBe(400)
    expect(res.body.code).toBe(1102)
  })

  it('POST hasDiscount with offerPrice >= price returns 400', async () => {
    const res = await agent
      .post('/api/v1/products')
      .set('Cookie', adminCookie)
      .send({ ...baseProduct, productId: 'TEST-002', hasDiscount: true, offerPrice: 100 })
    expect(res.status).toBe(400)
  })

  it('POST empty karats returns 400', async () => {
    const res = await agent
      .post('/api/v1/products')
      .set('Cookie', adminCookie)
      .send({ ...baseProduct, productId: 'TEST-003', karats: [] })
    expect(res.status).toBe(400)
  })

  it('PATCH sales increments sales of existing product', async () => {
    const list = await agent.get('/api/v1/products')
    const id = list.body[0].id
    const res = await agent.patch(`/api/v1/products/sales/${id}`)
    expect(res.status).toBe(200)
    const after = await agent.get('/api/v1/products')
    expect(after.body[0].sales).toBe(1)
  })

  it('PATCH sales with unknown id returns 404 code 1101', async () => {
    const res = await agent.patch('/api/v1/products/sales/999999')
    expect(res.status).toBe(404)
    expect(res.body.code).toBe(1101)
  })

  it('PATCH sales with non numeric id returns 400 code 2004', async () => {
    const res = await agent.patch('/api/v1/products/sales/abc')
    expect(res.status).toBe(400)
    expect(res.body.code).toBe(2004)
  })

  it('corrupt row does not break catalog and good rows stay intact', async () => {
    await turso.execute(
      "INSERT INTO products (productId, description, category, karats, weight, price, isActive, hasDiscount, pictures) VALUES ('TEST-BAD', 'x', 'oro', 'no-json{', 1, 10, 1, 0, '{bad')"
    )
    const res = await agent.get('/api/v1/products')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    const good: any = res.body.find((p: any) => p.productId === 'test-001')
    expect(good.karats).toEqual([24])
    const bad: any = res.body.find((p: any) => p.productId === 'TEST-BAD')
    expect(bad.karats).toEqual([])
    expect(bad.pictures).toEqual([])
  })
})
