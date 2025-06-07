import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { query } from "@/lib/db";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
        // Get pending friend requests
        try {
            const result = await query(`
                SELECT
                    f.id as friendship_id,
                    u.id,
                    u.name,
                    u.username,
                    f.created_at
                FROM friendships f
                INNER JOIN users u ON f.user_id = u.id
                WHERE f.friend_id = $1 AND f.status = 'pending'
                ORDER BY f.created_at DESC
            `, [session.user.id]);

            const requests = result.rows.map(request => ({
                friendshipId: request.friendship_id,
                id: request.id,
                name: request.name,
                username: request.username,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name)}&background=6366f1&color=fff`,
                requestedAt: request.created_at
            }));

            res.status(200).json({ requests });
        } catch (error) {
            console.error("Error fetching friend requests:", error);
            res.status(500).json({ error: "Failed to fetch friend requests" });
        }
    } else if (req.method === "PUT") {
        // Accept or reject friend request
        const { friendshipId, action } = req.body;

        if (!friendshipId || !action || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({ error: "Invalid request parameters" });
        }

        try {
            // Verify the friendship request exists and is for the current user
            const friendshipResult = await query(
                "SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = 'pending'",
                [friendshipId, session.user.id]
            );

            if (friendshipResult.rows.length === 0) {
                return res.status(404).json({ error: "Friend request not found" });
            }

            if (action === 'accept') {
                // Accept the friend request
                await query(
                    "UPDATE friendships SET status = 'accepted', updated_at = NOW() WHERE id = $1",
                    [friendshipId]
                );

                // Create reciprocal friendship
                const friendship = friendshipResult.rows[0];
                await query(
                    "INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at) VALUES ($1, $2, 'accepted', NOW(), NOW()) ON CONFLICT DO NOTHING",
                    [session.user.id, friendship.user_id]
                );

                res.status(200).json({ message: "Friend request accepted" });
            } else {
                // Reject/delete the friend request
                await query(
                    "DELETE FROM friendships WHERE id = $1",
                    [friendshipId]
                );
                res.status(200).json({ message: "Friend request rejected" });
            }
        } catch (error) {
            console.error("Error handling friend request:", error);
            res.status(500).json({ error: "Failed to handle friend request" });
        }
    } else {
        res.setHeader("Allow", ["GET", "PUT"]);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}