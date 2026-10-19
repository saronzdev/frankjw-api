import { Router } from 'express'
import { auth, adminOnly } from '../middlewares/auth'
import { salesLimiter } from '../middlewares/rateLimit'
import { getAll, increaseSales } from '../controllers/products/client'
import { addProduct, updateProduct, deleteProduct } from '../controllers/products/admin'

export const products = Router()

// Rutas públicas (GET para clientes)
products.get('/products', getAll)
products.patch('/products/sales/:id', salesLimiter, increaseSales)

// Rutas protegidas (POST, PUT, DELETE para admin)
products.post('/products', auth, adminOnly, addProduct)
products.put('/products/:id', auth, adminOnly, updateProduct)
products.delete('/products/:id', auth, adminOnly, deleteProduct)
