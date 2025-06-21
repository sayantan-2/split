import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const pool = getPool();

    try {
        if (req.method === 'GET') {
            // Get payment requests for current user
            const { status, type } = req.query;

            let query = `
                SELECT
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
                WHERE (pr.payer_id = $1 OR pr.payee_id = $1)
            `;

            const queryParams = [session.user.id];
            let paramCount = 1;

            if (status) {
                paramCount++;
                query += ` AND pr.status = $${paramCount}`;
                queryParams.push(status);
            }

            if (type === 'outgoing') {
                paramCount++;
                query += ` AND pr.payer_id = $${paramCount}`;
                queryParams.push(session.user.id);
            } else if (type === 'incoming') {
                paramCount++;
                query += ` AND pr.payee_id = $${paramCount}`;
                queryParams.push(session.user.id);
            }

            query += ' ORDER BY pr.created_at DESC';
            const result = await pool.query(query, queryParams);

            const requests = result.rows.map(row => ({
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
                due_date: row.due_date,
                created_at: row.created_at,
                updated_at: row.updated_at,
                completed_at: row.completed_at,
                notes: row.notes,
                reminder_count: row.reminder_count
            }));

            return res.status(200).json({ requests });
        } else if (req.method === 'POST') {
            // Create new payment request
            const {
                bill_id,
                billId,
                payer_id,
                payee_id,
                payeeId,
                amount,
                currency = 'USD',
                description,
                due_date,
                dueDate,
                payment_method = 'manual',
                notes
            } = req.body;
            // Support both naming conventions
            const finalBillId = bill_id || billId;
            const finalPayerId = payer_id || session.user.id;
            const finalPayeeId = payee_id || payeeId;
            const finalDueDate = due_date || dueDate;

            console.log('Payment request data:', {
                finalBillId,
                finalPayerId,
                finalPayeeId,
                amount,
                currency,
                description,
                finalDueDate,
                payment_method,
                notes
            });

            if (!finalPayeeId || !amount) {
                return res.status(400).json({
                    error: 'Payee ID and amount are required',
                    received: {
                        finalPayeeId,
                        amount,
                        payer_id,
                        payee_id,
                        payeeId
                    }
                });
            }
            // Check if payment request already exists
            const existingRequest = await pool.query(
                'SELECT id FROM payment_requests WHERE bill_id = $1 AND payer_id = $2 AND payee_id = $3',
                [finalBillId, finalPayerId, finalPayeeId]
            );

            if (existingRequest.rows.length > 0) {
                return res.status(400).json({ error: 'Payment request already exists for this bill' });
            }

            const result = await pool.query(
                `INSERT INTO payment_requests
                (bill_id, payer_id, payee_id, amount, currency, description, due_date, notes, payment_method)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [finalBillId, finalPayerId, finalPayeeId, amount, currency, description, finalDueDate, notes, payment_method]
            );

            const paymentRequest = result.rows[0];
            return res.status(201).json({
                message: 'Payment request created successfully',
                request: {
                    id: paymentRequest.id,
                    bill_id: paymentRequest.bill_id,
                    payer_id: paymentRequest.payer_id,
                    payee_id: paymentRequest.payee_id,
                    amount: parseFloat(paymentRequest.amount),
                    currency: paymentRequest.currency,
                    status: paymentRequest.status,
                    created_at: paymentRequest.created_at
                }
            });

        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('Payment requests error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
