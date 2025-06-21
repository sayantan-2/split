const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function debugUIConfusion() {
    try {
        console.log('🔍 DEBUGGING UI CONFUSION ISSUES\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name FROM users LIMIT 2');
        const [alice, bob] = usersResult.rows;
        console.log(`👤 Alice: ${alice.name} (ID: ${alice.id})`);
        console.log(`👤 Bob: ${bob.name} (ID: ${bob.id})\n`);

        // Clean up and create test request
        await pool.query(`DELETE FROM payment_requests WHERE description = 'UI confusion test'`);
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [bob.id, alice.id, 30.00, 'USD', 'UI confusion test', 'sent']);

        const request = createResult.rows[0];

        // Fetch the request with names like the API does
        const requestWithNames = await pool.query(`
            SELECT
                pr.*,
                payer.name as payer_name,
                payer.email as payer_email,
                payee.name as payee_name,
                payee.email as payee_email
            FROM payment_requests pr
            JOIN users payer ON pr.payer_id = payer.id
            JOIN users payee ON pr.payee_id = payee.id
            WHERE pr.id = $1
        `, [request.id]);

        const fullRequest = requestWithNames.rows[0];
        console.log(`💸 Scenario: Alice requests $30 from Bob`);
        console.log(`   - Alice is PAYEE (will receive money)`);
        console.log(`   - Bob is PAYER (will pay money)\n`);

        // Test CURRENT UI logic
        console.log('🖥️ CURRENT UI LOGIC:\n');
        // Alice's view (payee)
        console.log('👤 Alice sees:');
        const aliceIsPayee = request.payee_id === alice.id; // true
        const aliceTitle = aliceIsPayee
            ? `Request to ${request.payer_name}`
            : `Request from ${request.payee_name}`;
        console.log(`   Title: "${aliceTitle}"`);

        const aliceStatus = (() => {
            const isPayee = request.payee_id === alice.id;
            switch (request.status) {
                case 'sent':
                    return isPayee ? 'Sent' : 'Waiting for your response';
                default:
                    return request.status;
            }
        })();
        console.log(`   Status: "${aliceStatus}"`);

        // Bob's view (payer)
        console.log('\n👤 Bob sees:');
        const bobIsPayee = request.payee_id === bob.id; // false
        const bobTitle = bobIsPayee
            ? `Request to ${request.payer_name}`
            : `Request from ${request.payee_name}`;
        console.log(`   Title: "${bobTitle}"`);

        const bobStatus = (() => {
            const isPayee = request.payee_id === bob.id;
            switch (request.status) {
                case 'sent':
                    return isPayee ? 'Sent' : 'Waiting for your response';
                default:
                    return request.status;
            }
        })();
        console.log(`   Status: "${bobStatus}"`);

        console.log('\n🎯 WHAT THEY SHOULD SEE:\n');
        console.log('👤 Alice should see:');
        console.log('   Title: "Request to Bob" (she sent a request TO Bob)');
        console.log('   Status: "Sent" (she sent it)');

        console.log('\n👤 Bob should see:');
        console.log('   Title: "Request from Alice" (he received a request FROM Alice)');
        console.log('   Status: "Waiting for your response" (he needs to respond)');

        console.log('\n❌ PROBLEMS IDENTIFIED:');
        if (aliceTitle !== "Request to chrome") {
            console.log(`   1. Alice sees wrong title: "${aliceTitle}" instead of "Request to chrome"`);
        }
        if (bobTitle !== "Request from brave") {
            console.log(`   2. Bob sees wrong title: "${bobTitle}" instead of "Request from brave"`);
        }
        if (aliceStatus === bobStatus) {
            console.log(`   3. Both users see same status: "${aliceStatus}"`);
        }

        // Clean up
        await pool.query('DELETE FROM payment_requests WHERE id = $1', [request.id]);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

debugUIConfusion();
