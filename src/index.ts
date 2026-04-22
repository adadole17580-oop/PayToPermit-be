import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

import authRoutes from './routes/auth.js'
import studentRoutes from './routes/students.js'
import adminRoutes from './routes/admin.js'
import feeRoutes from './routes/fees.js'
import paymentRoutes from './routes/payments.js'
import notificationRoutes from './routes/notifications.js'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

app.use('*', async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const url = c.req.url

  console.log(`📥 ${method} ${url}`)
  await next()
  console.log(`📤 ${method} ${url} - ${Date.now() - start}ms`)
})

app.get('/api/health', (c) => c.json({
  status: 'ok'
}))

app.route('/api/auth', authRoutes)
app.route('/api/students', studentRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/fees', feeRoutes)
app.route('/api/payments', paymentRoutes)
app.route('/api/notifications', notificationRoutes)

const port = 3000

serve({
  fetch: app.fetch,
  port
})

console.log(`🚀 Server running on http://localhost:${port}`)