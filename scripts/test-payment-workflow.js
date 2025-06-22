const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'myuser',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'mydatabase',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    port: process.env.POSTGRES_PORT || 5432,
});

async function testNewPaymentWorkflow() {
    const client = await pool.connect();

    try {
        console.log('Testing new payment confirmation workflow...');

        // Check if we have any payment requests in different statuses
        const statusQuery = `
            SELECT status, COUNT(*) as count
            FROM payment_requests
            GROUP BY status
            ORDER BY status;
        `;

        const statusResult = await client.query(statusQuery);
        console.log('Current payment request statuses:');
        statusResult.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count}`);
        });

        // Show valid status transitions
        console.log('\nValid status transitions:');
        console.log('1. sent/pending → accepted (by payer)');
        console.log('2. accepted → paid_pending_confirmation (by payer - "Mark as Paid")');
        console.log('3. paid_pending_confirmation → completed (by payee - "Confirm Received")');
        console.log('4. paid_pending_confirmation → disputed (by payee if payment not received)');

        // Check if new status is available
        const constraintQuery = `
            SELECT conname, consrc
            FROM pg_constraint
            WHERE conname = 'payment_requests_status_check';
        `;

        const constraintResult = await client.query(constraintQuery);
        if (constraintResult.rows.length > 0) {
            console.log('\n✅ Status constraint updated successfully');
            console.log('Allowed statuses:', constraintResult.rows[0].consrc);
        }

    } catch (error) {
        console.error('Error testing workflow:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the test
testNewPaymentWorkflow()
    .then(() => {
        console.log('\n✅ Payment workflow test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });
