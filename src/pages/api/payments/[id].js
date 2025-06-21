import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    const pool = getPool();

    try {
        if (req.method === 'GET') {
            // Get specific payment request details
            const result = await pool.query(
                `SELECT
                    pr.*,
                    payer.name as payer_name,
                    payer.email as payer_email,
                    payee.name as payee_name,
                    payee.email as payee_email,
                    b.title as bill_title,
                    b.total_amount as bill_total
                FROM payment_requests pr
                JOIN users payer ON pr.payer_id = payer.id
                JOIN users payee ON pr.payee_id = payee.id
                LEFT JOIN bills b ON pr.bill_id = b.id
                WHERE pr.id = $1 AND (pr.payer_id = $2 OR pr.payee_id = $2)`,
                [id, session.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Payment request not found' });
            }
            const row = result.rows[0];
            const request = {
                id: row.id,
                bill_id: row.bill_id,
                bill_title: row.bill_title,
                bill_total: row.bill_total,
                payer_id: row.payer_id,
                payer_name: row.payer_name,
                payer_email: row.payer_email,
                payee_id: row.payee_id,
                payee_name: row.payee_name,
                payee_email: row.payee_email,
                amount: parseFloat(row.amount),
                currency: row.currency,
                description: row.description,
                status: row.status,
                payment_method: row.payment_method,
                external_payment_id: row.external_payment_id,
                created_at: row.created_at,
                updated_at: row.updated_at,
                due_date: row.due_date,
                completed_at: row.completed_at,
                notes: row.notes,
                reminder_count: row.reminder_count,
                last_reminder_sent: row.last_reminder_sent
            };
            return res.status(200).json({ request });

        } else if (req.method === 'PUT' || req.method === 'PATCH') {
            // Update payment request (support both PUT and PATCH)
            const { status, notes, paymentMethod } = req.body;

            // Verify user has permission to update this request
            const checkResult = await pool.query(
                'SELECT payer_id, payee_id, status FROM payment_requests WHERE id = $1',
                [id]
            );

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Payment request not found' });
            }

            const request = checkResult.rows[0];
            const userId = parseInt(session.user.id);

            // Only payer or payee can update the request
            if (request.payer_id !== userId && request.payee_id !== userId) {
                return res.status(403).json({ error: 'Not authorized to update this payment request' });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];
            let paramCount = 0;

            if (status !== undefined) {
                paramCount++;
                updates.push(`status = $${paramCount}`);
                values.push(status);

                // If marking as completed, set completed_at
                if (status === 'completed') {
                    paramCount++;
                    updates.push(`completed_at = $${paramCount}`);
                    values.push(new Date());
                }
            }

            if (notes !== undefined) {
                paramCount++;
                updates.push(`notes = $${paramCount}`);
                values.push(notes);
            }

            if (paymentMethod !== undefined) {
                paramCount++;
                updates.push(`payment_method = $${paramCount}`);
                values.push(paymentMethod);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }

            // Add updated_at
            paramCount++;
            updates.push(`updated_at = $${paramCount}`);
            values.push(new Date());

            // Add WHERE clause
            paramCount++;
            values.push(id);

            const updateQuery = `
                UPDATE payment_requests
                SET ${updates.join(', ')}
                WHERE id = $${paramCount}
                RETURNING *
            `;

            const result = await pool.query(updateQuery, values);
            const updatedRequest = result.rows[0];

            return res.status(200).json({
                message: 'Payment request updated successfully',
                paymentRequest: {
                    id: updatedRequest.id,
                    status: updatedRequest.status,
                    updatedAt: updatedRequest.updated_at
                }
            });

        } else if (req.method === 'DELETE') {
            // Cancel/delete payment request
            const checkResult = await pool.query(
                'SELECT payer_id, payee_id, status FROM payment_requests WHERE id = $1',
                [id]
            );

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Payment request not found' });
            }

            const request = checkResult.rows[0];
            const userId = parseInt(session.user.id);

            // Only payer can cancel the request, or payee can decline
            if (request.payer_id !== userId && request.payee_id !== userId) {
                return res.status(403).json({ error: 'Not authorized to cancel this payment request' });
            }

            // Can't cancel completed payments
            if (request.status === 'completed') {
                return res.status(400).json({ error: 'Cannot cancel completed payment' });
            }

            await pool.query(
                'UPDATE payment_requests SET status = $1, updated_at = $2 WHERE id = $3',
                ['cancelled', new Date(), id]
            );

            return res.status(200).json({ message: 'Payment request cancelled successfully' });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('Payment request error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
