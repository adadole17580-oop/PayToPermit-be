import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import db from './config/db.js';
const app = new Hono();
app.use('*', cors());
app.get('/students', async (c) => {
    try {
        const [rows] = await db.query('SELECT * FROM Students');
        return c.json(rows);
    }
    catch (error) {
        console.error('Database error:', error);
        return c.json({ error: 'Database connection failed' }, 500);
    }
});
serve({
    fetch: app.fetch,
    port: 3000
});
