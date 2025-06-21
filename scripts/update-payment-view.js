const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function updatePaymentView() {
    try {
        console.log('🔄 Updating payment_summary view...');

        // Drop existing view
        await pool.query('DROP VIEW IF EXISTS payment_summary;');
        console.log('✅ Dropped old payment_summary view');

        // Create new view with updated statuses
        await pool.query(`
            CREATE VIEW payment_summary AS
            SELECT
                u.id as user_id,
                u.name as user_name,
                u.email as user_email,
                COUNT(CASE WHEN pr.status IN ('pending', 'sent', 'accepted') AND pr.payer_id = u.id THEN 1 END) as pending_payments,
                COUNT(CASE WHEN pr.status = 'completed' AND pr.payer_id = u.id THEN 1 END) as completed_payments,
                COUNT(CASE WHEN pr.status IN ('pending', 'sent', 'accepted') AND pr.payee_id = u.id THEN 1 END) as incoming_requests,
                COALESCE(SUM(CASE WHEN pr.status IN ('pending', 'sent', 'accepted') AND pr.payer_id = u.id THEN pr.amount END), 0) as total_owed,
                COALESCE(SUM(CASE WHEN pr.status IN ('pending', 'sent', 'accepted') AND pr.payee_id = u.id THEN pr.amount END), 0) as total_owed_to_me,
                COALESCE(SUM(CASE WHEN pr.status = 'completed' AND pr.payer_id = u.id THEN pr.amount END), 0) as total_paid_out,
                COALESCE(SUM(CASE WHEN pr.status = 'completed' AND pr.payee_id = u.id THEN pr.amount END), 0) as total_received
            FROM users u
            LEFT JOIN payment_requests pr ON u.id = pr.payer_id OR u.id = pr.payee_id
            GROUP BY u.id, u.name, u.email;
        `);
        console.log('✅ Created new payment_summary view with updated statuses');

        await pool.end();
        console.log('🎉 Payment view update completed successfully!');

    } catch (error) {
        console.error('❌ Error updating payment view:', error.message);
        await pool.end();
        process.exit(1);
    }
}

updatePaymentView();
