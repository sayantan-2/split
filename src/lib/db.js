import { Pool } from 'pg'

let pool;

export function getPool() {
    if (!pool) {
        pool = new Pool({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            user: process.env.POSTGRES_USER || 'myuser',
            password: process.env.POSTGRES_PASSWORD || 'mypassword',
            database: process.env.POSTGRES_DB || 'mydatabase',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })
    }
    return pool
}

export async function query(text, params) {
    const pool = getPool()
    const result = await pool.query(text, params)
    return result
}
