import { Router } from 'express'
import { auth } from '../middlewares/auth'
import { getAll, getOneByCategory } from '../controllers/products/client'
import { addProduct, updateProduct, deleteProduct } from '../controllers/products/admin'
import { RequestHandler } from 'express'
import { uploadMultiple } from '../middlewares/upload'

export const products = Router()

// Rutas públicas (GET para clientes)
products.get('/products', getAll as RequestHandler)
products.get('/products/cats', getOneByCategory as RequestHandler)
products.get('/products/:category', getOneByCategory as RequestHandler)

// Rutas protegidas (POST, PUT, DELETE para admin)
products.post('/products', auth as RequestHandler, addProduct as RequestHandler)
products.put('/products/:id', auth as RequestHandler, updateProduct as RequestHandler)
products.delete('/products/:id', auth as RequestHandler, deleteProduct as RequestHandler)
