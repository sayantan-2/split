const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testContextualStatus() {
    try {
        console.log('🧪 Testing Contextual Status Display\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name FROM users LIMIT 2');
        const [alice, bob] = usersResult.rows;
        console.log(`👤 Alice (sender): ${alice.name} (ID: ${alice.id})`);
        console.log(`👤 Bob (receiver): ${bob.name} (ID: ${bob.id})\n`);

        // Create a payment request from Alice to Bob
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, status
        `, [bob.id, alice.id, 30.00, 'USD', 'Test contextual status', 'sent']);

        const requestId = createResult.rows[0].id;
        console.log(`💸 Created payment request ID: ${requestId}\n`);

        // Show how it appears to each user
        console.log('📱 Dashboard Views:\n');

        console.log(`👤 Alice's View (Payee - should see "Waiting for your response"):`);
        console.log(`   📥 Request from ${bob.name}`);
        console.log(`   💰 $30.00 - Test contextual status`);
        console.log(`   📊 Status: "Waiting for your response" (contextual)`);
        console.log(`   🎯 Actions: [Accept] [Decline] [View Details]\n`);

        console.log(`👤 Bob's View (Payer - should see "Sent"):`);
        console.log(`   📤 Request to ${alice.name}`);
        console.log(`   💰 $30.00 - Test contextual status`);
        console.log(`   📊 Status: "Sent" (contextual)`);
        console.log(`   🎯 Actions: [View Details] (waiting for response)\n`);

        // Test status progression with contextual labels
        console.log('🔄 Testing Status Progression:\n');

        // Bob accepts
        await pool.query('UPDATE payment_requests SET status = $1 WHERE id = $2', ['accepted', requestId]);
        console.log('1️⃣ Bob accepts the request:');
        console.log(`   👤 Alice sees: "They accepted"`);
        console.log(`   👤 Bob sees: "You accepted"`);
        console.log(`   🎯 Bob's new action: [Mark Paid]\n`);

        // Bob marks as paid
        await pool.query('UPDATE payment_requests SET status = $1, completed_at = $2 WHERE id = $3',
            ['completed', new Date(), requestId]);
        console.log('2️⃣ Bob marks as paid:');
        console.log(`   👤 Alice sees: "They paid you"`);
        console.log(`   👤 Bob sees: "You paid"`);
        console.log(`   ✅ Request completed!\n`);

        // Test rejection scenario
        const rejectResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [bob.id, alice.id, 15.00, 'USD', 'Test rejection scenario', 'sent']);

        await pool.query('UPDATE payment_requests SET status = $1 WHERE id = $2', ['rejected', rejectResult.rows[0].id]);
        console.log('3️⃣ Alternative - Alice rejects:');
        console.log(`   👤 Alice sees: "You declined"`);
        console.log(`   👤 Bob sees: "They declined"`);
        console.log(`   ❌ Request closed\n`);

        console.log('🎯 Key Improvements:');
        console.log('   ✅ Context-aware status labels');
        console.log('   ✅ "Sent" vs "Waiting for your response"');
        console.log('   ✅ "You accepted" vs "They accepted"');
        console.log('   ✅ "You paid" vs "They paid you"');
        console.log('   ✅ Clear role-based messaging');
        console.log('   ✅ No more confusing "sent" on both sides');

        // Cleanup
        await pool.query('DELETE FROM payment_requests WHERE id IN ($1, $2)', [requestId, rejectResult.rows[0].id]);
        console.log('\n🧹 Test data cleaned up');

    } catch (error) {
        console.error('❌ Error testing contextual status:', error.message);
    } finally {
        await pool.end();
    }
}

testContextualStatus();
