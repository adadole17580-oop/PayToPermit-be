import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/students.js'
import adminRoutes from './routes/admin.js'
import feeRoutes from './routes/fees-complete.js'
import paymentRoutes from './routes/payments-complete.js'
import notificationRoutes from './routes/notifications-complete.js'

// Complete system mode - no database required
const COMPLETE_MODE = true;

const app = new Hono()

// Enhanced CORS configuration
app.use('*', cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const url = c.req.url
  console.log(`📥 ${method} ${url}`)
  await next()
  const ms = Date.now() - start
  console.log(`📤 ${method} ${url} - ${ms}ms`)
})

// Health check with comprehensive status
app.get('/api/health', (c) => c.json({ 
  status: 'ok', 
  mode: COMPLETE_MODE ? 'complete-mock' : 'database',
  startup: new Date().toISOString(),
  features: {
    auth: true,
    payments: true,
    fees: true,
    uploads: true,
    registration: true,
    database: false
  }
}))

// Mount complete routes
app.route('/api/auth', authRoutes)
app.route('/api/students', studentRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/fees', feeRoutes)
app.route('/api/payments', paymentRoutes)
app.route('/api/notifications', notificationRoutes)

const port = parseInt(process.env.PORT || '3000', 10)
serve({
  fetch: app.fetch,
  port
})
