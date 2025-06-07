const { Pool } = require('pg');

// Create PostgreSQL pool
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'myuser',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    database: process.env.POSTGRES_DB || 'mydatabase',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Function to generate username from name
function generateUsername(name, existingUsernames = new Set()) {
    // Remove spaces and special characters, convert to lowercase
    let baseUsername = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20); // Limit to 20 characters

    let username = baseUsername;
    let counter = 1;

    // Add numbers if username exists
    while (existingUsernames.has(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
    }

    existingUsernames.add(username);
    return username;
}

async function addUsernameColumn() {
    const client = await pool.connect();

    try {
        console.log('Starting username migration...');

        // 1. Add username column if it doesn't exist
        console.log('Adding username column...');
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
        `);

        // 2. Get all existing users
        console.log('Fetching existing users...');
        const result = await client.query('SELECT id, name, email FROM users WHERE username IS NULL ORDER BY id');
        const users = result.rows;

        if (users.length === 0) {
            console.log('No users need username generation.');
            return;
        }

        console.log(`Found ${users.length} users without usernames`);

        // 3. Generate unique usernames for all users
        const existingUsernames = new Set();

        // First, check if there are any existing usernames
        const existingResult = await client.query('SELECT username FROM users WHERE username IS NOT NULL');
        existingResult.rows.forEach(row => {
            if (row.username) existingUsernames.add(row.username);
        });

        // 4. Update each user with a unique username
        for (const user of users) {
            const username = generateUsername(user.name, existingUsernames);

            await client.query(
                'UPDATE users SET username = $1 WHERE id = $2',
                [username, user.id]
            );

            console.log(`Generated username "${username}" for user "${user.name}" (${user.email})`);
        }

        // 5. Add unique constraint
        console.log('Adding unique constraint to username column...');
        try {
            await client.query('ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username)');
            console.log('Unique constraint added successfully');
        } catch (error) {
            if (error.code === '42P07') {
                console.log('Unique constraint already exists');
            } else {
                throw error;
            }
        }

        // 6. Create index for better search performance
        console.log('Creating index on username...');
        try {
            await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
            console.log('Username index created successfully');
        } catch (error) {
            console.log('Username index might already exist');
        }

        console.log('Username migration completed successfully!');

        // Display all users with their new usernames
        const finalResult = await client.query('SELECT id, name, username, email FROM users ORDER BY id');
        console.log('\nAll users with usernames:');
        finalResult.rows.forEach(user => {
            console.log(`- ${user.name} (@${user.username}) - ${user.email}`);
        });

    } catch (error) {
        console.error('Error during username migration:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the migration
addUsernameColumn()
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
