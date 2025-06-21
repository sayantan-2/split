#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updatePaymentStatusConstraint() {
    console.log('🔄 Updating payment request status constraint...');

    try {
        // First, check if the table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'payment_requests'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ payment_requests table does not exist. Run setup-db.js first.');
            return;
        }

        // Drop the old constraint
        await pool.query(`
            ALTER TABLE payment_requests
            DROP CONSTRAINT IF EXISTS payment_requests_status_check;
        `);
        console.log('✅ Dropped old status constraint');

        // Add the new constraint with updated status values
        await pool.query(`
            ALTER TABLE payment_requests
            ADD CONSTRAINT payment_requests_status_check
            CHECK (status IN ('pending', 'sent', 'accepted', 'completed', 'rejected', 'cancelled', 'disputed'));
        `);
        console.log('✅ Added new status constraint with proper workflow statuses');

        // Update any existing records with invalid statuses
        const updateResult = await pool.query(`
            UPDATE payment_requests
            SET status = 'pending'
            WHERE status NOT IN ('pending', 'sent', 'accepted', 'completed', 'rejected', 'cancelled', 'disputed');
        `);

        if (updateResult.rowCount > 0) {
            console.log(`✅ Updated ${updateResult.rowCount} records with invalid statuses to 'pending'`);
        }

        // Show current payment requests
        const currentRequests = await pool.query(`
            SELECT id, payer_id, payee_id, amount, status, description
            FROM payment_requests
            ORDER BY created_at DESC
            LIMIT 5;
        `);

        console.log('\n📊 Current payment requests:');
        if (currentRequests.rows.length === 0) {
            console.log('   No payment requests found');
        } else {
            currentRequests.rows.forEach(req => {
                console.log(`   ID: ${req.id}, Status: ${req.status}, Amount: ${req.amount}, Desc: ${req.description}`);
            });
        }

        console.log('\n🎉 Payment status constraint updated successfully!');
        console.log('\n📝 New payment workflow:');
        console.log('   1. pending → Request created, waiting for recipient action');
        console.log('   2. sent → Request sent/notified to recipient');
        console.log('   3. accepted → Recipient accepted, ready for payment');
        console.log('   4. completed → Payment completed');
        console.log('   5. rejected → Recipient declined the request');
        console.log('   6. cancelled → Creator cancelled the request');
        console.log('   7. disputed → Dispute raised about the request/payment');

    } catch (error) {
        console.error('❌ Error updating constraint:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    updatePaymentStatusConstraint().catch(console.error);
}

module.exports = { updatePaymentStatusConstraint };
