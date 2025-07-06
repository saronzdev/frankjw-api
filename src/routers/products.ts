import { Router } from 'express'
import { auth } from '../middlewares/auth'
import { getAll, getByCategory, getCats, increaseSales } from '../controllers/products/client'
import { addProduct, updateProduct, deleteProduct } from '../controllers/products/admin'
import { RequestHandler } from 'express'

export const products = Router()

// Rutas públicas (GET para clientes)
products.get('/products', getAll as RequestHandler)
products.get('/products/cats', getCats as RequestHandler)
products.get('/products/category/:category', getByCategory as RequestHandler)
products.patch('/products/sales/:id', increaseSales as RequestHandler)

// Rutas protegidas (POST, PUT, DELETE para admin)
products.post('/products', auth as RequestHandler, addProduct as RequestHandler)
products.put('/products/:id', auth as RequestHandler, updateProduct as RequestHandler)
products.delete('/products/:id', auth as RequestHandler, deleteProduct as RequestHandler)
