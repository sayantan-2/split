import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'myuser',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    database: process.env.POSTGRES_DB || 'mydatabase',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    } const { name, email, password, username } = req.body

    // Validation
    if (!name || !email || !password || !username) {
        return res.status(400).json({ message: 'Missing required fields' })
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ message: 'Username must be between 3 and 20 characters' })
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' })
    } try {
        // Check if user already exists by email or username
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        )

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email or username already exists' })
        }

        // Hash password
        const saltRounds = 12
        const hashedPassword = await bcrypt.hash(password, saltRounds)

        // Create user
        const result = await pool.query(
            'INSERT INTO users (name, email, username, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email, username, created_at',
            [name, email, username, hashedPassword]
        )

        const newUser = result.rows[0]

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username,
                createdAt: newUser.created_at
            }
        })
    } catch (error) {
        console.error('Registration error:', error)

        // Handle unique constraint violation
        if (error.code === '23505') {
            return res.status(400).json({ message: 'User with this email already exists' })
        }

        res.status(500).json({ message: 'Internal server error' })
    }
}
