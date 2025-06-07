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

async function testUsernameFeatures() {
    const client = await pool.connect();

    try {
        console.log('Testing username functionality...\n');

        // 1. Check all users have usernames
        console.log('1. Checking all users have usernames:');
        const result = await client.query('SELECT id, name, username, email FROM users ORDER BY id');
        result.rows.forEach(user => {
            console.log(`   - ${user.name} (@${user.username}) - ${user.email}`);
        });

        // 2. Test username uniqueness
        console.log('\n2. Testing username uniqueness:');
        const duplicateCheck = await client.query(`
            SELECT username, COUNT(*) as count
            FROM users
            GROUP BY username
            HAVING COUNT(*) > 1
        `);

        if (duplicateCheck.rows.length === 0) {
            console.log('   ✓ All usernames are unique');
        } else {
            console.log('   ✗ Found duplicate usernames:');
            duplicateCheck.rows.forEach(row => {
                console.log(`     - "${row.username}": ${row.count} users`);
            });
        }

        // 3. Test search by username
        console.log('\n3. Testing search by username:');
        const searchTests = ['alice', 'bob', 'david'];

        for (const searchTerm of searchTests) {
            const searchResult = await client.query(`
                SELECT id, name, username
                FROM users
                WHERE LOWER(name) ILIKE $1 OR LOWER(username) ILIKE $1
                ORDER BY
                    CASE WHEN LOWER(username) ILIKE $2 THEN 1
                         WHEN LOWER(name) ILIKE $2 THEN 2
                         ELSE 3 END,
                    username ASC
            `, [`%${searchTerm.toLowerCase()}%`, `${searchTerm.toLowerCase()}%`]);

            console.log(`   Search for "${searchTerm}":`);
            if (searchResult.rows.length === 0) {
                console.log('     No results found');
            } else {
                searchResult.rows.forEach(user => {
                    console.log(`     - ${user.name} (@${user.username})`);
                });
            }
        }

        console.log('\n✓ Username functionality test completed successfully!');

    } catch (error) {
        console.error('Error during username test:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the test
testUsernameFeatures()
    .then(() => {
        console.log('\nTest completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });
