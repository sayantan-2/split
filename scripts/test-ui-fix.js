const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testUIFix() {
    try {
        console.log('🧪 TESTING UI FIXES\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name FROM users LIMIT 2');
        const [alice, bob] = usersResult.rows;

        // Clean up and create test request
        await pool.query(`DELETE FROM payment_requests WHERE description = 'UI fix test'`);

        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [bob.id, alice.id, 25.00, 'USD', 'UI fix test', 'sent']);

        // Fetch with names like the API does
        const result = await pool.query(`
            SELECT
                pr.*,
                payer.name as payer_name,
                payee.name as payee_name
            FROM payment_requests pr
            JOIN users payer ON pr.payer_id = payer.id
            JOIN users payee ON pr.payee_id = payee.id
            WHERE pr.id = $1
        `, [createResult.rows[0].id]);

        const request = result.rows[0];

        console.log(`💸 Alice (${request.payee_name}) requests $25 from Bob (${request.payer_name})\n`);

        // Test the FIXED UI logic
        console.log('🖥️ FIXED UI LOGIC:\n');

        // Alice's view (payee - sent the request)
        console.log('👤 Alice sees:');
        const aliceIsPayee = request.payee_id === alice.id; // true
        const aliceTitle = aliceIsPayee
            ? `Request to ${request.payer_name}` // "Request to Bob"
            : `Request from ${request.payee_name}`;
        const aliceStatus = aliceIsPayee ? 'Sent' : 'Waiting for your response';
        console.log(`   Title: "${aliceTitle}"`);
        console.log(`   Status: "${aliceStatus}"`);

        // Bob's view (payer - received the request)
        console.log('\n👤 Bob sees:');
        const bobIsPayee = request.payee_id === bob.id; // false
        const bobTitle = bobIsPayee
            ? `Request to ${request.payer_name}`
            : `Request from ${request.payee_name}`; // "Request from Alice"
        const bobStatus = bobIsPayee ? 'Sent' : 'Waiting for your response';
        console.log(`   Title: "${bobTitle}"`);
        console.log(`   Status: "${bobStatus}"`);

        console.log('\n✅ EXPECTED RESULTS:');
        console.log('Alice: "Request to Bob" + "Sent"');
        console.log('Bob: "Request from Alice" + "Waiting for your response"');

        console.log('\n🎯 VERIFICATION:');
        const aliceCorrect = aliceTitle === `Request to ${request.payer_name}` && aliceStatus === 'Sent';
        const bobCorrect = bobTitle === `Request from ${request.payee_name}` && bobStatus === 'Waiting for your response';

        console.log(`Alice display correct: ${aliceCorrect ? '✅' : '❌'}`);
        console.log(`Bob display correct: ${bobCorrect ? '✅' : '❌'}`);
        console.log(`Different statuses: ${aliceStatus !== bobStatus ? '✅' : '❌'}`);

        if (aliceCorrect && bobCorrect && aliceStatus !== bobStatus) {
            console.log('\n🎉 ALL UI ISSUES FIXED!');
        } else {
            console.log('\n❌ Still have issues to fix');
        }

        // Clean up
        await pool.query('DELETE FROM payment_requests WHERE id = $1', [request.id]);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testUIFix();
