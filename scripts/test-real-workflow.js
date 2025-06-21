const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function testRealWorkflow() {
    try {
        console.log('🧪 TESTING REAL PAYMENT WORKFLOW\n');

        // Get test users
        const usersResult = await pool.query('SELECT id, name, email FROM users ORDER BY id LIMIT 2');
        const [alice, bob] = usersResult.rows;
        console.log(`👤 Alice: ${alice.name} (ID: ${alice.id})`);
        console.log(`👤 Bob: ${bob.name} (ID: ${bob.id})\n`);

        // Clean up existing test data
        await pool.query(`DELETE FROM payment_requests WHERE description LIKE '%workflow test%'`);

        // Create a payment request through the API simulation
        // Alice requests $30 from Bob
        const createResult = await pool.query(`
            INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [bob.id, alice.id, 30.00, 'USD', 'Real workflow test', 'sent']);

        const request = createResult.rows[0];
        console.log(`💸 Created payment request ID: ${request.id}\n`);

        // Test what each user would see through API
        console.log('🔍 TESTING API RESPONSES:\n');

        // Simulate API call for Alice (payee)
        const alicePayments = await pool.query(`
            SELECT
                pr.*,
                payer.name as payer_name,
                payer.email as payer_email,
                payee.name as payee_name,
                payee.email as payee_email
            FROM payment_requests pr
            JOIN users payer ON pr.payer_id = payer.id
            JOIN users payee ON pr.payee_id = payee.id
            WHERE pr.payee_id = $1 OR pr.payer_id = $1
            ORDER BY pr.created_at DESC
        `, [alice.id]);

        console.log(`👤 Alice's payment requests (${alicePayments.rows.length} found):`);
        alicePayments.rows.forEach(req => {
            const isPayee = req.payee_id === alice.id;
            const contextualStatus = isPayee ? 'Sent' : 'Waiting for your response';
            console.log(`   ID: ${req.id}, Status: ${req.status}, Contextual: "${contextualStatus}"`);
            console.log(`   Amount: $${req.amount}, From: ${req.payer_name}, To: ${req.payee_name}`);
        });

        console.log();

        // Simulate API call for Bob (payer)
        const bobPayments = await pool.query(`
            SELECT
                pr.*,
                payer.name as payer_name,
                payer.email as payer_email,
                payee.name as payee_name,
                payee.email as payee_email
            FROM payment_requests pr
            JOIN users payer ON pr.payer_id = payer.id
            JOIN users payee ON pr.payee_id = payee.id
            WHERE pr.payee_id = $1 OR pr.payer_id = $1
            ORDER BY pr.created_at DESC
        `, [bob.id]);

        console.log(`👤 Bob's payment requests (${bobPayments.rows.length} found):`);
        bobPayments.rows.forEach(req => {
            const isPayee = req.payee_id === bob.id;
            const contextualStatus = isPayee ? 'Sent' : 'Waiting for your response';
            console.log(`   ID: ${req.id}, Status: ${req.status}, Contextual: "${contextualStatus}"`);
            console.log(`   Amount: $${req.amount}, From: ${req.payer_name}, To: ${req.payee_name}`);
        });

        console.log('\n🎯 EXPECTED RESULTS:');
        console.log(`Alice should see: "Sent" (she requested money from Bob)`);
        console.log(`Bob should see: "Waiting for your response" (he received a request from Alice)`);

        // Test the actual frontend functions
        console.log('\n🖥️ TESTING FRONTEND FUNCTIONS:\n');

        // Test dashboard function
        const getContextualStatusDashboard = (request, currentUserId) => {
            const isPayee = request.payee_id === currentUserId;
            const status = request.status;

            switch (status) {
                case 'sent':
                    return isPayee ? 'Sent' : 'Waiting for your response';
                default:
                    return status;
            }
        };

        // Test detail page function
        const getContextualStatusDetail = (status, isOwner, isPayee) => {
            switch (status) {
                case 'sent':
                    return isPayee ? 'Sent' : 'Waiting for your response';
                default:
                    return status;
            }
        };

        const req = alicePayments.rows[0];

        // Alice's view
        const aliceDashboard = getContextualStatusDashboard(req, alice.id);
        const aliceIsOwner = req.payer_id === alice.id;
        const aliceIsPayee = req.payee_id === alice.id;
        const aliceDetail = getContextualStatusDetail(req.status, aliceIsOwner, aliceIsPayee);

        console.log(`👤 Alice frontend:`);
        console.log(`   Dashboard: "${aliceDashboard}"`);
        console.log(`   Detail: "${aliceDetail}"`);
        console.log(`   isOwner: ${aliceIsOwner}, isPayee: ${aliceIsPayee}`);

        // Bob's view
        const bobDashboard = getContextualStatusDashboard(req, bob.id);
        const bobIsOwner = req.payer_id === bob.id;
        const bobIsPayee = req.payee_id === bob.id;
        const bobDetail = getContextualStatusDetail(req.status, bobIsOwner, bobIsPayee);

        console.log(`👤 Bob frontend:`);
        console.log(`   Dashboard: "${bobDashboard}"`);
        console.log(`   Detail: "${bobDetail}"`);
        console.log(`   isOwner: ${bobIsOwner}, isPayee: ${bobIsPayee}`);

        if (aliceDashboard === bobDashboard) {
            console.log(`\n❌ BUG FOUND: Both users see the same status: "${aliceDashboard}"`);
        } else {
            console.log(`\n✅ Status looks correct!`);
        }

        // Clean up
        await pool.query('DELETE FROM payment_requests WHERE id = $1', [request.id]);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

testRealWorkflow();
