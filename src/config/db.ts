import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Optimized database configuration for fast startup
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'paytopermit',
    connectionLimit: 5, // Reduced for performance
    acquireTimeout: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
    reconnect: true,
    idleTimeout: 30000, // 30 seconds
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

let pool: mysql.Pool | null = null;
let isInitialized = false;

// Lazy connection initialization - only connect when needed
export function getPool() {
    if (!pool) {
        console.log(' Initializing database connection...');
        pool = mysql.createPool(dbConfig);
        isInitialized = true;
        
        // Test connection asynchronously
        pool.getConnection()
            .then(connection => {
                console.log(' Database connected successfully');
                connection.release();
            })
            .catch(err => {
                console.log(' Database connection failed, using fallback mode');
                pool = null;
                isInitialized = false;
            });
    }
    return pool;
}

// Quick connection test
export function testConnection() {
    const currentPool = getPool();
    if (!currentPool) return false;
    
    return currentPool.getConnection()
        .then(connection => {
            connection.ping();
            connection.release();
            return true;
        })
        .catch(() => false);
}

export function isDatabaseReady() {
    return isInitialized && pool !== null;
}

// Export the lazy-initialized pool
export default getPool();