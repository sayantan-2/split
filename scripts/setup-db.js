import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'myuser',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    database: process.env.POSTGRES_DB || 'mydatabase',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function setupDatabase() {
    try {
        console.log('Setting up database...')

        // Read and execute the NextAuth schema
        const nextAuthSqlPath = path.join(process.cwd(), 'database', 'nextauth_schema.sql')
        const nextAuthSqlContent = fs.readFileSync(nextAuthSqlPath, 'utf-8')
        await pool.query(nextAuthSqlContent)
        console.log('NextAuth schema applied successfully!')

        // Read and execute the friends schema
        const friendsSqlPath = path.join(process.cwd(), 'database', 'friends_schema.sql')
        const friendsSqlContent = fs.readFileSync(friendsSqlPath, 'utf-8')
        await pool.query(friendsSqlContent)
        console.log('Friends schema applied successfully!')        // Read and execute the payments schema
        const paymentsSqlPath = path.join(process.cwd(), 'database', 'payments_schema.sql')
        const paymentsSqlContent = fs.readFileSync(paymentsSqlPath, 'utf-8')
        await pool.query(paymentsSqlContent)
        console.log('Payments schema applied successfully!')

        // Read and execute the bills schema
        const billsSqlPath = path.join(process.cwd(), 'database', 'bills_schema.sql')
        const billsSqlContent = fs.readFileSync(billsSqlPath, 'utf-8')
        await pool.query(billsSqlContent)
        console.log('Bills schema applied successfully!')

        console.log('Database setup completed successfully!')

        // Test the connection by checking if tables exist
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('users', 'accounts', 'sessions', 'users_nextauth', 'verification_tokens', 'friendships', 'bills', 'bill_participants')
            ORDER BY table_name
        `)

        console.log('Tables found:', result.rows.map(row => row.table_name))

    } catch (error) {
        console.error('Database setup failed:', error)
    } finally {
        await pool.end()
    }
}

setupDatabase()
