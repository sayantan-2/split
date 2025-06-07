import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { query } from "@/lib/db";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: "Search query must be at least 2 characters" });
        } try {            // Search for users by name or username, excluding current user and existing friends
            const result = await query(`
                SELECT
                    u.id,
                    u.name,
                    u.username,
                    CASE
                        WHEN f.id IS NOT NULL THEN f.status
                        ELSE null
                    END as friendship_status
                FROM users u
                LEFT JOIN friendships f ON u.id = f.friend_id AND f.user_id = $1
                WHERE
                    u.id != $1
                    AND (
                        LOWER(u.name) ILIKE $2
                        OR LOWER(u.username) ILIKE $2
                    )
                    AND (f.id IS NULL OR f.status = 'blocked')
                ORDER BY
                    CASE WHEN LOWER(u.username) ILIKE $3 THEN 1
                         WHEN LOWER(u.name) ILIKE $3 THEN 2
                         ELSE 3 END,
                    u.username ASC
                LIMIT 20
            `, [
                session.user.id,
                `%${q.toLowerCase()}%`,
                `${q.toLowerCase()}%`
            ]);

            const users = result.rows.map(user => ({
                id: user.id,
                name: user.name,
                username: user.username,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`,
                friendshipStatus: user.friendship_status
            }));

            res.status(200).json({ users });
        } catch (error) {
            console.error("Error searching users:", error);
            res.status(500).json({ error: "Failed to search users" });
        }
    } else {
        res.setHeader("Allow", ["GET"]);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}
