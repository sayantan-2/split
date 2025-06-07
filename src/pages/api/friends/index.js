import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { query } from "@/lib/db";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
        try {            // Get all friends for the current user with bill counts
            const result = await query(`
                SELECT
                    u.id,
                    u.name,
                    u.username,
                    COUNT(DISTINCT bp.bill_id) as bills_count
                FROM users u
                INNER JOIN friendships f ON u.id = f.friend_id
                LEFT JOIN bill_participants bp ON u.id = bp.user_id
                LEFT JOIN bills b ON bp.bill_id = b.id AND b.status = 'active'
                WHERE f.user_id = $1 AND f.status = 'accepted'
                GROUP BY u.id, u.name, u.username
                ORDER BY u.name ASC
            `, [session.user.id]);

            const friends = result.rows.map(friend => ({
                id: friend.id,
                name: friend.name,
                username: friend.username,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=6366f1&color=fff`,
                bills: parseInt(friend.bills_count) || 0
            }));

            res.status(200).json({ friends });
        } catch (error) {
            console.error("Error fetching friends:", error);
            res.status(500).json({ error: "Failed to fetch friends" });
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}
