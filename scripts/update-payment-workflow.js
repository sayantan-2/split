const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function updatePaymentDefaultStatus() {
    try {
        console.log('🔄 Updating payment request default status workflow...\n');

        // 1. Update existing 'pending' requests to 'sent' since they haven't been accepted yet
        const updateResult = await pool.query(`
            UPDATE payment_requests
            SET status = 'sent', updated_at = CURRENT_TIMESTAMP
            WHERE status = 'pending'
        `);

        console.log(`✅ Updated ${updateResult.rowCount} existing 'pending' requests to 'sent'`);

        // 2. Update the constraint to reflect the new default
        await pool.query(`
            ALTER TABLE payment_requests
            DROP CONSTRAINT IF EXISTS payment_requests_status_check
        `);
        console.log('✅ Dropped old status constraint');

        await pool.query(`
            ALTER TABLE payment_requests
            ADD CONSTRAINT payment_requests_status_check
            CHECK (status IN ('pending', 'sent', 'accepted', 'completed', 'rejected', 'cancelled', 'disputed'))
        `);
        console.log('✅ Added new status constraint');

        // 3. Update the default value
        await pool.query(`
            ALTER TABLE payment_requests
            ALTER COLUMN status SET DEFAULT 'sent'
        `);
        console.log('✅ Updated default status to "sent"');

        // 4. Show current status distribution
        console.log('\n📊 Current payment request status distribution:');
        const statusResult = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM payment_requests
            GROUP BY status
            ORDER BY status
        `);

        statusResult.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count} request(s)`);
        });

        console.log('\n🎉 Payment workflow update completed successfully!');
        console.log('\n📋 New Workflow:');
        console.log('   1. Create request → "sent" (waiting for recipient to accept/decline)');
        console.log('   2. Recipient accepts → "accepted" (agreed to pay)');
        console.log('   3. Recipient pays → "completed" (payment made)');
        console.log('   4. Alternative: Recipient declines → "rejected"');
        console.log('   5. Alternative: Creator cancels → "cancelled"');

    } catch (error) {
        console.error('❌ Error updating payment workflow:', error.message);
    } finally {
        await pool.end();
    }
}

updatePaymentDefaultStatus();
