const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function verifyStatusFix() {
    try {
        console.log('🔍 Verifying Contextual Status Fix\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name FROM users LIMIT 2');
        const [alice, bob] = usersResult.rows;

        console.log('🎭 Scenario: Alice requests $25 from Bob for dinner');
        console.log(`👤 Alice (ID: ${alice.id}) - PAYEE (will receive money)`);
        console.log(`👤 Bob (ID: ${bob.id}) - PAYER (will pay money)\n`);

        // Create payment request: Bob owes Alice $25
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, status, payer_id, payee_id
        `, [bob.id, alice.id, 25.00, 'USD', 'Dinner payment', 'sent']);

        const request = createResult.rows[0];
        console.log(`📝 Created Request: Bob (${request.payer_id}) owes Alice (${request.payee_id}) $25\n`);

        // Simulate how each user sees it
        console.log('👀 How each user sees this request:\n');

        // Alice's perspective (payee - she sent the request)
        const aliceIsPayee = request.payee_id === alice.id;
        const aliceIsPayer = request.payer_id === alice.id;
        console.log(`👤 Alice's View (payee=${aliceIsPayee}, payer=${aliceIsPayer}):`);
        console.log(`   Should see: "Sent" (because she sent the request)`);

        // Bob's perspective (payer - he received the request)
        const bobIsPayee = request.payee_id === bob.id;
        const bobIsPayer = request.payer_id === bob.id;
        console.log(`👤 Bob's View (payee=${bobIsPayee}, payer=${bobIsPayer}):`);
        console.log(`   Should see: "Waiting for your response" (because he received the request)\n`);

        // Test the actual contextual status logic from dashboard
        function getContextualStatus(request, currentUserId) {
            const isPayee = request.payee_id === currentUserId; // The one who sent the request
            const isPayer = request.payer_id === currentUserId; // The one who received the request
            const status = request.status;

            switch (status) {
                case 'sent':
                    return isPayee ? 'Sent' : 'Waiting for your response';
                default:
                    return status;
            }
        }

        console.log('🎯 Actual Status Display:');
        console.log(`👤 Alice sees: "${getContextualStatus(request, alice.id)}"`);
        console.log(`👤 Bob sees: "${getContextualStatus(request, bob.id)}"`);

        // Clean up
        await pool.query('DELETE FROM payment_requests WHERE id = $1', [request.id]);
        console.log('\n🧹 Test data cleaned up');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

verifyStatusFix();
