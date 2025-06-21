import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { billData, participants } = req.body;

        if (!billData || !participants || participants.length === 0) {
            return res.status(400).json({ error: 'Missing bill data or participants' });
        }

        // Create the bill
        const billResult = await client.query(`
            INSERT INTO bills (
                title, description, merchant, total_amount, subtotal,
                tax_amount, currency, created_by, source, bill_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [
            billData.payment.name || 'Bill Split',
            billData.payment.description || '',
            billData.payment.merchant || '',
            billData.totals.total,
            billData.totals.subtotal,
            billData.totals.totalTax,
            billData.payment.currency || 'USD',
            session.user.id,
            'manual',
            new Date()
        ]);

        const billId = billResult.rows[0].id;

        // Create bill items
        for (let i = 0; i < billData.payment.paymentItems.length; i++) {
            const item = billData.payment.paymentItems[i];

            const itemResult = await client.query(`
                INSERT INTO bill_items (
                    bill_id, name, unit_price, quantity, total_price,
                    tax_percentage, tax_amount, line_number
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            `, [
                billId,
                item.name,
                item.unitPrice || 0,
                item.quantity || 1,
                item.totalPrice,
                item.taxPercentage || 0,
                (item.totalPrice * (item.taxPercentage || 0)) / 100,
                i
            ]);

            const itemId = itemResult.rows[0].id;

            // Create item splits
            for (const share of item.splitByShares) {
                if (share.amount > 0) {
                    const totalShares = item.splitByShares.reduce((sum, s) => sum + s.amount, 0);
                    const fullAmountWithTax = item.totalPrice * (1 + (item.taxPercentage || 0) / 100);
                    const amountPerShare = fullAmountWithTax / totalShares;
                    const userTotal = amountPerShare * share.amount;
                    const userSubtotal = (item.totalPrice / totalShares) * share.amount;
                    const userTax = userTotal - userSubtotal;

                    await client.query(`
                        INSERT INTO bill_item_splits (
                            bill_item_id, user_id, share_amount,
                            subtotal_amount, tax_amount, total_amount
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    `, [
                        itemId,
                        share.userID,
                        share.amount,
                        userSubtotal,
                        userTax,
                        userTotal
                    ]);
                }
            }
        }

        // Create bill participants
        for (const participant of participants) {
            await client.query(`
                INSERT INTO bill_participants (
                    bill_id, user_id, role, total_share, joined_at
                ) VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (bill_id, user_id) DO UPDATE SET
                    total_share = EXCLUDED.total_share,
                    joined_at = EXCLUDED.joined_at
            `, [
                billId,
                participant.userId,
                participant.userId === session.user.id ? 'creator' : 'participant',
                participant.total,
                new Date()
            ]);
        }

        // Create payment requests for participants who owe money
        const paymentRequests = [];
        for (const participant of participants) {
            if (participant.userId !== session.user.id && participant.total > 0) {
                const requestResult = await client.query(`
                    INSERT INTO payment_requests (
                        bill_id, payer_id, payee_id, amount, currency,
                        description, payment_method, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                `, [
                    billId,
                    participant.userId,
                    session.user.id,
                    participant.total,
                    billData.payment.currency || 'USD',
                    `Payment for bill split: ${billData.payment.merchant || 'Bill'}`,
                    'manual',
                    'pending'
                ]);

                paymentRequests.push({
                    id: requestResult.rows[0].id,
                    payer_id: participant.userId,
                    amount: participant.total
                });
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            bill: { id: billId },
            paymentRequests: paymentRequests
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving bill and creating payment requests:', error);
        res.status(500).json({ error: 'Failed to save bill and create payment requests' });
    } finally {
        client.release();
    }
}
