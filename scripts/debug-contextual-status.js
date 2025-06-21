const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function debugContextualStatus() {
    try {
        console.log('🔍 DEBUGGING CONTEXTUAL STATUS ISSUE\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name, email FROM users LIMIT 2');
        const [alice, bob] = usersResult.rows;
        console.log(`👤 Alice: ${alice.name} (ID: ${alice.id}) - ${alice.email}`);
        console.log(`👤 Bob: ${bob.name} (ID: ${bob.id}) - ${bob.email}\n`);

        // Clean up any existing test requests
        await pool.query('DELETE FROM payment_requests WHERE description = $1', ['Debug contextual status test']);

        // Create a payment request: Alice requests money FROM Bob
        // So Alice is payee (receives money), Bob is payer (pays money)
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, payer_id, payee_id, status
        `, [bob.id, alice.id, 25.00, 'USD', 'Debug contextual status test', 'sent']);

        const request = createResult.rows[0];
        console.log(`💸 Created payment request:`);
        console.log(`   ID: ${request.id}`);
        console.log(`   Payer (who pays): Bob (ID: ${request.payer_id})`);
        console.log(`   Payee (who receives): Alice (ID: ${request.payee_id})`);
        console.log(`   Status: ${request.status}\n`);

        // Test the contextual status logic for both users
        console.log('🧪 TESTING CONTEXTUAL STATUS LOGIC:\n');

        // Alice's perspective (payee - sent the request)
        const aliceIsPayee = request.payee_id === alice.id;
        const aliceIsPayer = request.payer_id === alice.id;
        console.log(`👤 Alice's perspective:`);
        console.log(`   isPayee: ${aliceIsPayee} (should be true - she receives money)`);
        console.log(`   isPayer: ${aliceIsPayer} (should be false - she doesn't pay)`);

        // Apply dashboard logic for Alice
        let aliceStatus;
        switch (request.status) {
            case 'sent':
                aliceStatus = aliceIsPayee ? 'Sent' : 'Waiting for your response';
                break;
        }
        console.log(`   Dashboard shows: "${aliceStatus}" (should be "Sent")\n`);

        // Bob's perspective (payer - received the request)
        const bobIsPayee = request.payee_id === bob.id;
        const bobIsPayer = request.payer_id === bob.id;
        console.log(`👤 Bob's perspective:`);
        console.log(`   isPayee: ${bobIsPayee} (should be false - he doesn't receive money)`);
        console.log(`   isPayer: ${bobIsPayer} (should be true - he pays)`);

        // Apply dashboard logic for Bob
        let bobStatus;
        switch (request.status) {
            case 'sent':
                bobStatus = bobIsPayee ? 'Sent' : 'Waiting for your response';
                break;
        }
        console.log(`   Dashboard shows: "${bobStatus}" (should be "Waiting for your response")\n`);

        // Test detail page logic
        console.log('🔍 TESTING DETAIL PAGE LOGIC:\n');

        // Alice viewing detail page
        const aliceIsOwner = request.payer_id === alice.id; // false
        const aliceIsPayeeDetail = request.payee_id === alice.id; // true

        let aliceDetailStatus;
        switch (request.status) {
            case 'sent':
                aliceDetailStatus = aliceIsPayeeDetail ? 'Sent' : 'Waiting for your response';
                break;
        }
        console.log(`👤 Alice detail page: "${aliceDetailStatus}" (should be "Sent")`);

        // Bob viewing detail page
        const bobIsOwner = request.payer_id === bob.id; // true
        const bobIsPayeeDetail = request.payee_id === bob.id; // false

        let bobDetailStatus;
        switch (request.status) {
            case 'sent':
                bobDetailStatus = bobIsPayeeDetail ? 'Sent' : 'Waiting for your response';
                break;
        }
        console.log(`👤 Bob detail page: "${bobDetailStatus}" (should be "Waiting for your response")\n`);

        // Summary
        console.log('📊 SUMMARY:');
        console.log(`Alice (payee) should see: "Sent" on both dashboard and detail`);
        console.log(`Bob (payer) should see: "Waiting for your response" on both dashboard and detail`);
        console.log(`\nActual results:`);
        console.log(`Alice dashboard: "${aliceStatus}"`);
        console.log(`Alice detail: "${aliceDetailStatus}"`);
        console.log(`Bob dashboard: "${bobStatus}"`);
        console.log(`Bob detail: "${bobDetailStatus}"`);

        // Check if there are any inconsistencies
        if (aliceStatus !== aliceDetailStatus) {
            console.log(`\n❌ INCONSISTENCY: Alice sees different status on dashboard vs detail!`);
        }
        if (bobStatus !== bobDetailStatus) {
            console.log(`\n❌ INCONSISTENCY: Bob sees different status on dashboard vs detail!`);
        }
        if (aliceStatus === bobStatus) {
            console.log(`\n❌ BUG: Both users see the same status! This is wrong.`);
        }

        // Clean up
        await pool.query('DELETE FROM payment_requests WHERE id = $1', [request.id]);
        console.log(`\n🧹 Cleaned up test data`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

debugContextualStatus();
