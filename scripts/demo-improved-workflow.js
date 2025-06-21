const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function demonstrateImprovedWorkflow() {
    try {
        console.log('🎯 Demonstrating Improved Payment Request Workflow\n');
        console.log('======================================================\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name FROM users LIMIT 2');
        const [alice, bob] = usersResult.rows;
        console.log(`👥 Test Users: ${alice.name} and ${bob.name}\n`);

        console.log('📱 SCENARIO: Alice wants Bob to pay her back for dinner\n');

        // 1. Alice creates a payment request
        console.log('1️⃣ Alice creates payment request:');
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, status, created_at
        `, [bob.id, alice.id, 45.00, 'USD', 'Dinner at Italian restaurant']);

        const requestId = createResult.rows[0].id;
        console.log(`   ✅ Request created with ID: ${requestId}`);
        console.log(`   📤 Status: "sent" (waiting for Bob's response)`);
        console.log(`   💬 Bob will see: "Alice sent you a payment request"`);
        console.log(`   🎯 Bob can: Accept, Decline, or Ignore\n`);

        // 2. Bob's perspective - he sees the request
        console.log('2️⃣ Bob receives notification and views request:');
        const requestDetails = await pool.query(`
            SELECT pr.*, alice.name as requester_name, bob.name as payer_name
            FROM payment_requests pr
            JOIN users alice ON pr.payee_id = alice.id
            JOIN users bob ON pr.payer_id = bob.id
            WHERE pr.id = $1
        `, [requestId]);

        const request = requestDetails.rows[0];
        console.log(`   💰 Amount: $${request.amount}`);
        console.log(`   📝 Description: "${request.description}"`);
        console.log(`   👤 From: ${request.requester_name}`);
        console.log(`   ⚡ Bob's options: [Accept Request] [Decline] buttons\n`);

        // 3. Bob accepts the request
        console.log('3️⃣ Bob decides to accept:');
        await pool.query(`
            UPDATE payment_requests
            SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [requestId]);
        console.log(`   ✅ Status: sent → accepted`);
        console.log(`   💬 Alice sees: "Bob accepted your request"`);
        console.log(`   🎯 Bob now needs to actually make the payment\n`);

        // 4. Bob makes the payment
        console.log('4️⃣ Bob makes the payment (cash/venmo/etc):');
        await pool.query(`
            UPDATE payment_requests
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [requestId]);
        console.log(`   ✅ Status: accepted → completed`);
        console.log(`   💰 Payment confirmed!`);
        console.log(`   💬 Alice sees: "Bob paid you $45.00"\n`);

        // 5. Show alternative scenarios
        console.log('🔀 ALTERNATIVE SCENARIOS:\n');

        // Scenario A: Rejection
        const rejectResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, 'sent')
            RETURNING id
        `, [bob.id, alice.id, 20.00, 'USD', 'Coffee (Bob disagrees)']);

        await pool.query('UPDATE payment_requests SET status = $1 WHERE id = $2', ['rejected', rejectResult.rows[0].id]);
        console.log('   ❌ Rejection Scenario:');
        console.log('      Alice creates request → sent');
        console.log('      Bob clicks "Decline" → rejected');
        console.log('      Result: No payment, request closed\n');

        // Scenario B: Cancellation
        const cancelResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, 'sent')
            RETURNING id
        `, [bob.id, alice.id, 10.00, 'USD', 'Alice changes mind']);

        await pool.query('UPDATE payment_requests SET status = $1 WHERE id = $2', ['cancelled', cancelResult.rows[0].id]);
        console.log('   🚫 Cancellation Scenario:');
        console.log('      Alice creates request → sent');
        console.log('      Alice clicks "Cancel Request" → cancelled');
        console.log('      Result: Request withdrawn before Bob responds\n');

        // 6. Show final summary
        console.log('📊 WORKFLOW SUMMARY:\n');
        console.log('   🎯 Key Improvement: Recipients must explicitly respond!');
        console.log('   📤 sent: Waiting for recipient to accept/decline');
        console.log('   ✅ accepted: Recipient agreed to pay (payment pending)');
        console.log('   💰 completed: Payment actually made');
        console.log('   ❌ rejected: Recipient declined');
        console.log('   🚫 cancelled: Creator withdrew request');
        console.log('   ⚠️  disputed: Question about completed payment\n');

        console.log('🎉 This matches user expectations from Venmo, Splitwise, etc!\n');

        // Cleanup
        await pool.query('DELETE FROM payment_requests WHERE id IN ($1, $2, $3)',
            [requestId, rejectResult.rows[0].id, cancelResult.rows[0].id]);
        console.log('🧹 Demo data cleaned up');

    } catch (error) {
        console.error('❌ Error in demonstration:', error.message);
    } finally {
        await pool.end();
    }
}

demonstrateImprovedWorkflow();
