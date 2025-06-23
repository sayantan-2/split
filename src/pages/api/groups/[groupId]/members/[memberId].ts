import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import { db } from "../../../../../db";
import { groupMembers } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { groupId, memberId } = req.query;
  if (typeof groupId !== "string" || typeof memberId !== "string") {
    return res.status(400).json({ error: "Invalid group ID or member ID" });
  }

  try {
    // Check if current user is a member of the group
    const currentUserMembership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (currentUserMembership.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Users can remove themselves, or admins can remove others
    if (currentUserMembership[0].role !== "admin" && memberId !== session.user.id) {
      return res.status(403).json({ error: "Permission denied" });
    }

    // If removing an admin, check if they're the only admin
    const targetMember = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, memberId)
        )
      )
      .limit(1);

    if (targetMember.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    if (targetMember[0].role === "admin") {
      const adminCount = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.role, "admin")
          )
        );

      if (adminCount.length === 1) {
        return res.status(400).json({ 
          error: "Cannot remove the only admin. Please assign another admin first." 
        });
      }
    }

    // Remove the member
    const deletedMember = await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, memberId)
        )
      )
      .returning();

    if (deletedMember.length === 0) {
      return res.status(404).json({ error: "Failed to remove member" });
    }

    return res.status(200).json({ 
      message: "Member removed successfully" 
    });

  } catch (error) {
    console.error("Error removing member:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
