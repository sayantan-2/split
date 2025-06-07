import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { Pool } from "pg"
import bcrypt from 'bcryptjs'

// Create PostgreSQL pool
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'myuser',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    database: process.env.POSTGRES_DB || 'mydatabase',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export const authOptions = {
    providers: [
        // Credentials provider for email/password login
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                try {
                    // Query your existing users table
                    const result = await pool.query(
                        'SELECT * FROM users WHERE email = $1',
                        [credentials.email]
                    )

                    const user = result.rows[0]

                    if (!user) {
                        return null
                    }

                    // Verify password
                    const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

                    if (!isPasswordValid) {
                        return null
                    }

                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                    }
                } catch (error) {
                    console.error('Auth error:', error)
                    return null
                }
            }
        }),

        // Google OAuth provider (optional)
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    ],

    session: {
        strategy: 'jwt',
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id
            }
            return session
        },

        // Handle sign in for different providers
        async signIn({ user, account, profile }) {
            if (account.provider === 'google') {
                try {
                    // Check if user exists in your users table
                    const result = await pool.query(
                        'SELECT * FROM users WHERE email = $1',
                        [user.email]
                    )

                    if (result.rows.length === 0) {
                        // Create new user in your users table for Google sign-in
                        await pool.query(
                            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
                            [user.name, user.email, 'google_oauth'] // placeholder password for OAuth users
                        )
                    }

                    return true
                } catch (error) {
                    console.error('Google sign-in error:', error)
                    return false
                }
            }

            return true
        }
    },

    pages: {
        signIn: '/auth/signin',
        signUp: '/auth/signup',
    },

    secret: process.env.NEXTAUTH_SECRET,
}
