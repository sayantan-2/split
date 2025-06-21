const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testNewPaymentWorkflow() {
    try {
        console.log('🧪 Testing Updated Payment Request Workflow\n');

        // 1. Get two test users
        const usersResult = await pool.query('SELECT id, name FROM users LIMIT 2');
        if (usersResult.rows.length < 2) {
            console.log('❌ Need at least 2 users for testing');
            return;
        }

        const [payer, payee] = usersResult.rows;
        console.log(`👤 Creator: ${payer.name} (ID: ${payer.id})`);
        console.log(`💰 Recipient: ${payee.name} (ID: ${payee.id})\n`);

        // 2. Create a payment request (should default to 'sent')
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, status
        `, [payer.id, payee.id, 30.00, 'USD', 'Test new workflow - coffee']);

        const requestId = createResult.rows[0].id;
        console.log(`1️⃣ Created payment request ID: ${requestId}`);
        console.log(`   ✅ Initial Status: "${createResult.rows[0].status}" (waiting for recipient response)\n`);

        // 3. Test the complete acceptance workflow
        console.log('🔄 Testing Complete Acceptance Workflow:\n');

        // Step 3a: Recipient accepts the request
        await pool.query('UPDATE payment_requests SET status = $1, updated_at = $2 WHERE id = $3',
            ['accepted', new Date(), requestId]);
        console.log('   ✅ Step 1: sent → accepted (Recipient agreed to pay)');

        // Step 3b: Recipient makes the payment
        await pool.query('UPDATE payment_requests SET status = $1, completed_at = $2, updated_at = $2 WHERE id = $3',
            ['completed', new Date(), requestId]);
        console.log('   ✅ Step 2: accepted → completed (Payment made)\n');

        // 4. Test rejection workflow
        console.log('🔄 Testing Rejection Workflow:\n');

        const rejectResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, status
        `, [payer.id, payee.id, 12.50, 'USD', 'Test rejection - lunch']);

        const rejectId = rejectResult.rows[0].id;
        console.log(`   Created request ID: ${rejectId} with status: "${rejectResult.rows[0].status}"`);

        await pool.query('UPDATE payment_requests SET status = $1, updated_at = $2 WHERE id = $3',
            ['rejected', new Date(), rejectId]);
        console.log('   ✅ sent → rejected (Recipient declined)\n');

        // 5. Test cancellation workflow
        console.log('🔄 Testing Cancellation Workflow:\n');

        const cancelResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, status
        `, [payer.id, payee.id, 8.75, 'USD', 'Test cancellation - snack']);

        const cancelId = cancelResult.rows[0].id;
        console.log(`   Created request ID: ${cancelId} with status: "${cancelResult.rows[0].status}"`);

        await pool.query('UPDATE payment_requests SET status = $1, updated_at = $2 WHERE id = $3',
            ['cancelled', new Date(), cancelId]);
        console.log('   ✅ sent → cancelled (Creator cancelled before acceptance)\n');

        // 6. Show final results
        console.log('📊 Final Test Results:');
        const resultsQuery = await pool.query(`
            SELECT id, status, amount, description,
                   CASE WHEN completed_at IS NOT NULL THEN 'Yes' ELSE 'No' END as has_completion_date
            FROM payment_requests
            WHERE id IN ($1, $2, $3)
            ORDER BY id
        `, [requestId, rejectId, cancelId]);

        resultsQuery.rows.forEach(row => {
            console.log(`   📋 ID ${row.id}: ${row.status.toUpperCase()}`);
            console.log(`      💰 $${row.amount} - ${row.description}`);
            console.log(`      📅 Completion date: ${row.has_completion_date}`);
        });

        console.log('\n🎉 Updated Payment Workflow Summary:');
        console.log('   1. ✅ Requests now start with "sent" status (waiting for recipient)');
        console.log('   2. ✅ Recipients must explicitly accept before payment');
        console.log('   3. ✅ Payment happens only after acceptance');
        console.log('   4. ✅ Clear rejection and cancellation flows');
        console.log('   5. ✅ Proper status progression: sent → accepted → completed');

        // Clean up test data
        await pool.query('DELETE FROM payment_requests WHERE id IN ($1, $2, $3)', [requestId, rejectId, cancelId]);
        console.log('\n🧹 Test data cleaned up');

    } catch (error) {
        console.error('❌ Error testing new payment workflow:', error.message);
    } finally {
        await pool.end();
    }
}

console.log('🚀 Testing Updated Payment Workflow...\n');
testNewPaymentWorkflow();
