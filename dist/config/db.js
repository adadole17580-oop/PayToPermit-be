import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'paytopermit',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};
let pool = null;
let isInitialized = false;
export function getPool() {
    if (!pool) {
        console.log(' Initializing database connection...');
        pool = mysql.createPool(dbConfig);
        isInitialized = true;
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
export function testConnection() {
    const currentPool = getPool();
    if (!currentPool)
        return false;
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
export default getPool();
