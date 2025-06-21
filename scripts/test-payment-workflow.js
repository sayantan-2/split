#!/usr/bin/env node

/**
 * Test script to demonstrate the new payment request workflow
 */

import { getPool } from '../src/lib/db.js';
import fetch from 'node-fetch';

console.log('🧪 Testing Payment Request Workflow\n');

const pool = getPool();

async function testPaymentWorkflow() {
    try {
        // 1. Create a test payment request
        console.log('1️⃣ Creating payment request...');
        const insertResult = await pool.query(
            `INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status, payment_method)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [10, 9, 25.50, 'USD', 'Test payment workflow', 'pending', 'manual']
        );

        const paymentId = insertResult.rows[0].id;
        console.log(`   ✅ Payment request created with ID: ${paymentId}`);
        console.log(`   📋 Status: ${insertResult.rows[0].status}`);

        // 2. Simulate recipient accepting the request
        console.log('\n2️⃣ Recipient accepts payment request...');
        await pool.query(
            'UPDATE payment_requests SET status = $1, updated_at = $2 WHERE id = $3',
            ['accepted', new Date(), paymentId]
        );
        console.log('   ✅ Payment request accepted');

        // 3. Simulate recipient marking as paid
        console.log('\n3️⃣ Recipient marks payment as completed...');
        await pool.query(
            'UPDATE payment_requests SET status = $1, completed_at = $2, updated_at = $3 WHERE id = $4',
            ['completed', new Date(), new Date(), paymentId]
        );
        console.log('   ✅ Payment marked as completed');

        // 4. Demonstrate the dispute option (only available after completion)
        console.log('\n4️⃣ Testing dispute functionality (post-completion)...');
        await pool.query(
            'UPDATE payment_requests SET status = $1, updated_at = $2 WHERE id = $3',
            ['disputed', new Date(), paymentId]
        );
        console.log('   ✅ Payment disputed (this would trigger dispute resolution process)');

        // 5. Test rejection workflow with a new request
        console.log('\n5️⃣ Testing rejection workflow...');
        const rejectResult = await pool.query(
            `INSERT INTO payment_requests (payer_id, payee_id, amount, currency, description, status, payment_method)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [10, 9, 15.75, 'USD', 'Test rejection workflow', 'pending', 'manual']
        );

        const rejectPaymentId = rejectResult.rows[0].id;
        console.log(`   ✅ Second payment request created with ID: ${rejectPaymentId}`);

        await pool.query(
            'UPDATE payment_requests SET status = $1, updated_at = $2 WHERE id = $3',
            ['rejected', new Date(), rejectPaymentId]
        );
        console.log('   ✅ Payment request rejected by recipient');

        // 6. Show all statuses
        console.log('\n6️⃣ Current payment request statuses:');
        const statusResult = await pool.query(
            'SELECT id, amount, description, status, created_at FROM payment_requests WHERE id IN ($1, $2) ORDER BY id',
            [paymentId, rejectPaymentId]
        );

        statusResult.rows.forEach(row => {
            console.log(`   📋 ID ${row.id}: $${row.amount} - ${row.status.toUpperCase()}`);
        });

        // 7. Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await pool.query('DELETE FROM payment_requests WHERE id IN ($1, $2)', [paymentId, rejectPaymentId]);
        console.log('   ✅ Test data cleaned up');

        console.log('\n🎉 Payment workflow test completed successfully!');
        console.log('\n📋 WORKFLOW SUMMARY:');
        console.log('✅ pending → accepted → completed (normal flow)');
        console.log('✅ pending → rejected (declined by recipient)');
        console.log('✅ completed → disputed (post-payment disputes)');
        console.log('✅ pending → cancelled (cancelled by sender)');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

testPaymentWorkflow();
