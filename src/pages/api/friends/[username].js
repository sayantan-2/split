import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { query } from "@/lib/db";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ error: "Username is required" });
        }

        try {
            // First, get the friend's basic info and verify they are actually friends
            const friendResult = await query(`
                SELECT
                    u.id,
                    u.name,
                    u.username,
                    u.email
                FROM users u
                INNER JOIN friendships f ON u.id = f.friend_id
                WHERE f.user_id = $1
                AND f.status = 'accepted'
                AND u.username = $2
            `, [session.user.id, username]);

            if (friendResult.rows.length === 0) {
                return res.status(404).json({ error: "Friend not found or not in your friend list" });
            }

            const friend = friendResult.rows[0];

            // Get bills summary for this friend
            const summaryResult = await query(`
                SELECT
                    COALESCE(SUM(
                        CASE
                            WHEN bp1.user_id = $1 THEN bp1.amount_owed - bp1.amount_paid
                            ELSE 0
                        END
                    ), 0) as you_owe,
                    COALESCE(SUM(
                        CASE
                            WHEN bp2.user_id = $2 THEN bp2.amount_owed - bp2.amount_paid
                            ELSE 0
                        END
                    ), 0) as they_owe
                FROM bills b
                INNER JOIN bill_participants bp1 ON b.id = bp1.bill_id AND bp1.user_id = $1
                INNER JOIN bill_participants bp2 ON b.id = bp2.bill_id AND bp2.user_id = $2
                WHERE b.status = 'active'
            `, [session.user.id, friend.id]);

            const summary = summaryResult.rows[0] || { you_owe: 0, they_owe: 0 };
            const netAmount = parseFloat(summary.they_owe) - parseFloat(summary.you_owe);

            // Get bill history between current user and this friend
            const historyResult = await query(`
                SELECT
                    b.id,
                    b.title,
                    b.total_amount,
                    b.created_at,
                    bp1.amount_owed as your_amount,
                    bp1.amount_paid as your_paid,
                    bp2.amount_owed as friend_amount,
                    bp2.amount_paid as friend_paid
                FROM bills b
                INNER JOIN bill_participants bp1 ON b.id = bp1.bill_id AND bp1.user_id = $1
                INNER JOIN bill_participants bp2 ON b.id = bp2.bill_id AND bp2.user_id = $2
                WHERE b.status = 'active'
                ORDER BY b.created_at DESC
                LIMIT 20
            `, [session.user.id, friend.id]);

            const history = historyResult.rows.map(bill => {
                const yourNet = parseFloat(bill.your_amount) - parseFloat(bill.your_paid);
                const friendNet = parseFloat(bill.friend_amount) - parseFloat(bill.friend_paid);

                return {
                    id: bill.id,
                    label: bill.title,
                    date: new Date(bill.created_at).toLocaleDateString('en-US', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit'
                    }),
                    amount: yourNet > 0 ? -yourNet : friendNet,
                    currency: 'USD' // Default currency for now
                };
            });

            const friendData = {
                id: friend.id,
                name: friend.name,
                username: friend.username,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=6366f1&color=fff`,
                currency: 'USD',
                summary: {
                    amount: Math.abs(netAmount),
                    status: netAmount >= 0 ? 'owed' : 'owe',
                    currency: 'USD'
                },
                history: history
            };

            res.status(200).json({ friend: friendData });
        } catch (error) {
            console.error("Error fetching friend data:", error);
            res.status(500).json({ error: "Failed to fetch friend data" });
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}
