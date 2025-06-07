import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { query } from "@/lib/db";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.method === "POST") {
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({ error: "Friend ID is required" });
        }

        if (friendId === session.user.id) {
            return res.status(400).json({ error: "Cannot add yourself as a friend" });
        }

        try {
            // Check if friendship already exists
            const existingFriendship = await query(
                "SELECT * FROM friendships WHERE user_id = $1 AND friend_id = $2",
                [session.user.id, friendId]
            );

            if (existingFriendship.rows.length > 0) {
                const status = existingFriendship.rows[0].status;
                if (status === 'pending') {
                    return res.status(400).json({ error: "Friend request already sent" });
                } else if (status === 'accepted') {
                    return res.status(400).json({ error: "Already friends" });
                } else if (status === 'blocked') {
                    return res.status(400).json({ error: "Cannot send friend request" });
                }
            }

            // Check if the other user exists
            const userExists = await query(
                "SELECT id FROM users WHERE id = $1",
                [friendId]
            );

            if (userExists.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            // Create friend request
            await query(
                "INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, 'pending')",
                [session.user.id, friendId]
            );

            res.status(201).json({ message: "Friend request sent successfully" });
        } catch (error) {
            console.error("Error adding friend:", error);
            res.status(500).json({ error: "Failed to send friend request" });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}
