import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'myuser',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    database: process.env.POSTGRES_DB || 'mydatabase',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function createTestUsers() {
    try {
        console.log('Creating test users...')

        const testUsers = [
            {
                name: 'Alice Smith',
                email: 'alice@example.com',
                password: 'password123'
            },
            {
                name: 'Bob Johnson',
                email: 'bob@example.com',
                password: 'password123'
            },
            {
                name: 'Carol Davis',
                email: 'carol@example.com',
                password: 'password123'
            },
            {
                name: 'David Wilson',
                email: 'david@example.com',
                password: 'password123'
            }
        ];

        for (const user of testUsers) {
            // Check if user already exists
            const existingUser = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [user.email]
            );

            if (existingUser.rows.length === 0) {
                // Hash password
                const hashedPassword = await bcrypt.hash(user.password, 12);

                // Create user
                await pool.query(
                    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
                    [user.name, user.email, hashedPassword]
                );

                console.log(`Created user: ${user.name} (${user.email})`);
            } else {
                console.log(`User already exists: ${user.name} (${user.email})`);
            }
        }

        console.log('Test users creation completed!');

        // List all users
        const allUsers = await pool.query('SELECT id, name, email FROM users ORDER BY name');
        console.log('\nAll users in database:');
        allUsers.rows.forEach(user => {
            console.log(`- ${user.name} (${user.email}) [ID: ${user.id}]`);
        });

    } catch (error) {
        console.error('Error creating test users:', error);
    } finally {
        await pool.end();
    }
}

createTestUsers();
