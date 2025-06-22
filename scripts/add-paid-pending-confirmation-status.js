const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'myuser',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'mydatabase',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    port: process.env.POSTGRES_PORT || 5432,
});

async function addPaidPendingConfirmationStatus() {
    const client = await pool.connect();

    try {
        console.log('Adding paid_pending_confirmation status to payment_requests table...');

        // Drop the existing constraint
        await client.query(`
            ALTER TABLE payment_requests
            DROP CONSTRAINT IF EXISTS payment_requests_status_check;
        `);

        // Add the new constraint with the additional status
        await client.query(`
            ALTER TABLE payment_requests
            ADD CONSTRAINT payment_requests_status_check
            CHECK (status IN ('pending', 'sent', 'accepted', 'paid_pending_confirmation', 'completed', 'rejected', 'cancelled', 'disputed'));
        `);

        console.log('✅ Successfully added paid_pending_confirmation status');

        // Check current payment requests to see if any need to be updated
        const result = await client.query(`
            SELECT id, status, payer_id, payee_id, amount
            FROM payment_requests
            WHERE status = 'completed'
            ORDER BY updated_at DESC
            LIMIT 5;
        `);

        console.log(`Found ${result.rows.length} completed payment requests`);
        if (result.rows.length > 0) {
            console.log('Recent completed payments:', result.rows);
        }

    } catch (error) {
        console.error('Error updating database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
addPaidPendingConfirmationStatus()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
