#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testNewPaymentWorkflow() {
    console.log('🧪 Testing New Payment Request Workflow');
    console.log('=====================================\n');

    try {
        // Get test users
        const usersResult = await pool.query('SELECT id, name, username FROM users LIMIT 2');
        if (usersResult.rows.length < 2) {
            console.log('❌ Need at least 2 users. Run create-test-users.js first.');
            return;
        }

        const [user1, user2] = usersResult.rows;
        console.log(`👤 Test users: ${user1.name} (${user1.username}) and ${user2.name} (${user2.username})\n`);

        // Step 1: Create a payment request
        console.log('1️⃣ Creating payment request...');
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status, payment_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, status, created_at
        `, [user1.id, user2.id, 25.50, 'USD', 'Coffee split test', 'pending', 'manual']);

        const requestId = createResult.rows[0].id;
        console.log(`   ✅ Payment request created (ID: ${requestId})`);
        console.log(`   📊 Status: ${createResult.rows[0].status}`);
        console.log(`   💰 Amount: $25.50 from ${user1.name} to ${user2.name}\n`);

        // Step 2: Simulate recipient accepting the request
        console.log('2️⃣ Recipient accepts the payment request...');
        await pool.query(`
            UPDATE payment_requests
            SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [requestId]);
        console.log(`   ✅ Request accepted by ${user2.name}\n`);

        // Step 3: Mark as completed (payment made)
        console.log('3️⃣ Marking payment as completed...');
        await pool.query(`
            UPDATE payment_requests
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [requestId]);
        console.log(`   ✅ Payment completed!\n`);

        // Step 4: Test rejection workflow with a new request
        console.log('4️⃣ Testing rejection workflow...');
        const rejectResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status, payment_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [user2.id, user1.id, 15.75, 'USD', 'Lunch split test', 'pending', 'manual']);

        const rejectRequestId = rejectResult.rows[0].id;
        console.log(`   ✅ Created second request (ID: ${rejectRequestId})`);

        await pool.query(`
            UPDATE payment_requests
            SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [rejectRequestId]);
        console.log(`   ✅ Request rejected by ${user1.name}\n`);

        // Step 5: Test cancellation workflow
        console.log('5️⃣ Testing cancellation workflow...');
        const cancelResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status, payment_method)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [user1.id, user2.id, 8.25, 'USD', 'Snack split test', 'pending', 'manual']);

        const cancelRequestId = cancelResult.rows[0].id;
        console.log(`   ✅ Created third request (ID: ${cancelRequestId})`);

        await pool.query(`
            UPDATE payment_requests
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [cancelRequestId]);
        console.log(`   ✅ Request cancelled by ${user1.name}\n`);

        // Step 6: Show all requests and their statuses
        console.log('6️⃣ Final status of all test requests:');
        const finalResult = await pool.query(`
            SELECT
                pr.id,
                pr.status,
                pr.amount,
                pr.description,
                payer.name as payer_name,
                payee.name as payee_name,
                pr.created_at,
                pr.completed_at
            FROM payment_requests pr
            JOIN users payer ON pr.payer_id = payer.id
            JOIN users payee ON pr.payee_id = payee.id
            WHERE pr.id IN ($1, $2, $3)
            ORDER BY pr.created_at DESC
        `, [requestId, rejectRequestId, cancelRequestId]);

        finalResult.rows.forEach((req, index) => {
            const statusEmoji = {
                'completed': '✅',
                'rejected': '❌',
                'cancelled': '🚫',
                'pending': '⏳',
                'accepted': '👍',
                'disputed': '⚠️'
            };

            console.log(`   ${statusEmoji[req.status] || '❓'} ID ${req.id}: ${req.status.toUpperCase()}`);
            console.log(`      💰 $${req.amount} - ${req.description}`);
            console.log(`      👥 ${req.payer_name} → ${req.payee_name}`);
            if (req.completed_at) {
                console.log(`      ✅ Completed: ${new Date(req.completed_at).toLocaleDateString()}`);
            }
            console.log('');
        });

        console.log('🎉 Payment workflow testing completed successfully!');
        console.log('\n📋 Workflow Summary:');
        console.log('   1. pending → Request created, waiting for recipient');
        console.log('   2. accepted → Recipient agreed to pay');
        console.log('   3. completed → Payment actually made');
        console.log('   4. rejected → Recipient declined the request');
        console.log('   5. cancelled → Creator cancelled before acceptance');
        console.log('   6. disputed → Disagreement about payment (for completed payments)');

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await pool.query(`
            DELETE FROM payment_requests
            WHERE id IN ($1, $2, $3)
        `, [requestId, rejectRequestId, cancelRequestId]);
        console.log('   ✅ Test payment requests cleaned up');

    } catch (error) {
        console.error('❌ Error testing payment workflow:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    testNewPaymentWorkflow().catch(console.error);
}

module.exports = { testNewPaymentWorkflow };
