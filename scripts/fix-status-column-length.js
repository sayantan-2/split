const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'myuser',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'mydatabase',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    port: process.env.POSTGRES_PORT || 5432,
});

async function fixStatusColumnLength() {
    const client = await pool.connect();

    try {
        console.log('Fixing status column length...');

        // First, drop the constraint
        await client.query(`
            ALTER TABLE payment_requests
            DROP CONSTRAINT IF EXISTS payment_requests_status_check;
        `);

        // Increase the column length from VARCHAR(20) to VARCHAR(50)
        await client.query(`
            ALTER TABLE payment_requests
            ALTER COLUMN status TYPE VARCHAR(50);
        `);

        // Add back the constraint with the new status
        await client.query(`
            ALTER TABLE payment_requests
            ADD CONSTRAINT payment_requests_status_check
            CHECK (status IN ('pending', 'sent', 'accepted', 'paid_pending_confirmation', 'completed', 'rejected', 'cancelled', 'disputed'));
        `);

        console.log('✅ Successfully updated status column length to VARCHAR(50)');

        // Test the new status value
        console.log('Testing status value length:');
        console.log(`'paid_pending_confirmation' length: ${('paid_pending_confirmation').length} characters`);

    } catch (error) {
        console.error('Error updating database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the fix
fixStatusColumnLength()
    .then(() => {
        console.log('Database fix completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database fix failed:', error);
        process.exit(1);
    });
