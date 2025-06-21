const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testImprovedDashboard() {
    try {
        console.log('🧪 Testing Improved Dashboard Workflow\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name FROM users LIMIT 2');
        const [sender, receiver] = usersResult.rows;
        console.log(`👤 Sender: ${sender.name} (ID: ${sender.id})`);
        console.log(`👤 Receiver: ${receiver.name} (ID: ${receiver.id})\n`);

        // 1. Create a payment request (from sender to receiver)
        console.log('1️⃣ Sender creates payment request:');
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, status
        `, [receiver.id, sender.id, 25.00, 'USD', 'Coffee payment request']);

        const requestId = createResult.rows[0].id;
        console.log(`   ✅ Request ID: ${requestId} created with status: "${createResult.rows[0].status}"`);
        console.log(`   📤 Sender's view: "Payment request sent to ${receiver.name}"`);
        console.log(`   📥 Receiver's view: "Payment request from ${sender.name}" with [Accept] [Decline] buttons\n`);

        // 2. Show what each user sees on their dashboard
        console.log('2️⃣ Dashboard Views:\n');

        // Sender's outgoing requests
        const senderView = await pool.query(`
            SELECT pr.*, payee.name as payee_name, payer.name as payer_name
            FROM payment_requests pr
            JOIN users payee ON pr.payee_id = payee.id
            JOIN users payer ON pr.payer_id = payer.id
            WHERE pr.payee_id = $1
        `, [sender.id]);

        console.log(`   👤 ${sender.name}'s Dashboard (Outgoing Tab):`);
        senderView.rows.forEach(req => {
            console.log(`      📤 Request to ${req.payer_name}: $${req.amount} - Status: ${req.status}`);
            console.log(`      🎯 Actions: [View Details] (no quick actions for sent requests)`);
        });

        // Receiver's incoming requests
        const receiverView = await pool.query(`
            SELECT pr.*, payee.name as payee_name, payer.name as payer_name
            FROM payment_requests pr
            JOIN users payee ON pr.payee_id = payee.id
            JOIN users payer ON pr.payer_id = payer.id
            WHERE pr.payer_id = $1 AND pr.status = 'sent'
        `, [receiver.id]);

        console.log(`\n   👤 ${receiver.name}'s Dashboard (Incoming Tab - DEFAULT):`);
        receiverView.rows.forEach(req => {
            console.log(`      📥 🔔 ACTION REQUIRED: Request from ${req.payee_name}: $${req.amount}`);
            console.log(`      🎯 Quick Actions: [Accept] [Decline] [View Details]`);
            console.log(`      💡 Highlighted with blue border to draw attention`);
        });

        // 3. Simulate receiver accepting the request
        console.log('\n3️⃣ Receiver accepts the request:');
        await pool.query('UPDATE payment_requests SET status = $1 WHERE id = $2', ['accepted', requestId]);
        console.log(`   ✅ Status updated: sent → accepted`);
        console.log(`   📥 Receiver now sees: [Mark Paid] button`);
        console.log(`   📤 Sender sees: "Accepted" status (no further action needed)\n`);

        // 4. Show the key differences
        console.log('🎯 KEY IMPROVEMENTS:\n');
        console.log('   📱 Default Tab: "Incoming" (where action is needed)');
        console.log('   🔔 Action Alerts: Blue highlight for requests needing response');
        console.log('   ⚡ Quick Actions: Accept/Decline directly from dashboard');
        console.log('   👀 Clear Separation: Incoming vs Outgoing tabs');
        console.log('   📊 Visual Indicators: Different icons and colors for each type');
        console.log('   🎮 One-Click Actions: No need to navigate to detail page');

        console.log('\n💡 User Experience:');
        console.log('   - Receivers immediately see requests requiring action');
        console.log('   - Senders can track status of sent requests');
        console.log('   - Clear visual distinction between sent vs received');
        console.log('   - Quick actions reduce friction for acceptance/rejection');

        // Cleanup
        await pool.query('DELETE FROM payment_requests WHERE id = $1', [requestId]);
        console.log('\n🧹 Test data cleaned up');

    } catch (error) {
        console.error('❌ Error testing dashboard:', error.message);
    } finally {
        await pool.end();
    }
}

testImprovedDashboard();
