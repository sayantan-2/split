const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testStatusDescriptionFix() {
    try {
        console.log('🔧 TESTING STATUS DESCRIPTION FIX\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name FROM users LIMIT 2');
        const [alice, bob] = usersResult.rows;
        console.log(`👤 Alice: ${alice.name} (ID: ${alice.id})`);
        console.log(`👤 Bob: ${bob.name} (ID: ${bob.id})\n`);

        // Clean up and create test request
        await pool.query(`DELETE FROM payment_requests WHERE description = 'Status description test'`);

        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [bob.id, alice.id, 25.00, 'USD', 'Status description test', 'sent']);

        const request = createResult.rows[0];
        console.log(`💸 Created test request: Alice requests $25 from Bob\n`);

        // Test both functions for both users
        const getContextualStatus = (status, isOwner, isPayee) => {
            switch (status) {
                case 'sent':
                    return isPayee ? 'Sent' : 'Waiting for your response';
                default:
                    return status;
            }
        };

        const getStatusDescription = (status, isOwner, isPayee) => {
            switch (status) {
                case 'sent':
                    return isPayee ? 'Waiting for their response' : 'Waiting for your response';
                default:
                    return status;
            }
        };

        console.log('👤 Alice (payee) sees:');
        const aliceIsOwner = request.payer_id === alice.id; // false
        const aliceIsPayee = request.payee_id === alice.id; // true
        console.log(`   Status Badge: "${getContextualStatus(request.status, aliceIsOwner, aliceIsPayee)}"`);
        console.log(`   Description: "${getStatusDescription(request.status, aliceIsOwner, aliceIsPayee)}"`);

        console.log('\n👤 Bob (payer) sees:');
        const bobIsOwner = request.payer_id === bob.id; // true
        const bobIsPayee = request.payee_id === bob.id; // false
        console.log(`   Status Badge: "${getContextualStatus(request.status, bobIsOwner, bobIsPayee)}"`);
        console.log(`   Description: "${getStatusDescription(request.status, bobIsOwner, bobIsPayee)}"`);

        console.log('\n✅ Expected results:');
        console.log('Alice: Badge="Sent", Description="Waiting for their response"');
        console.log('Bob: Badge="Waiting for your response", Description="Waiting for your response"');

        // Clean up
        await pool.query('DELETE FROM payment_requests WHERE id = $1', [request.id]);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testStatusDescriptionFix();
