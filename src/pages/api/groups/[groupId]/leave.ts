import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groupMembers } from "@/db/schema";
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

  const { groupId } = req.query;
  if (typeof groupId !== "string") {
    return res.status(400).json({ error: "Invalid group ID" });
  }

  try {
    // Check if user is a member of the group
    const membership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return res
        .status(404)
        .json({ error: "You are not a member of this group" });
    }

    // Check if user is the only admin
    const adminCount = await db
      .select()
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.role, "admin"))
      );

    if (membership[0].role === "admin" && adminCount.length === 1) {
      return res.status(400).json({
        error:
          "Cannot leave group as the only admin. Please assign another admin first or delete the group.",
      });
    }

    // Remove the user from the group
    const deletedMember = await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .returning();

    if (deletedMember.length === 0) {
      return res.status(404).json({ error: "Failed to leave group" });
    }

    return res.status(200).json({
      message: "Successfully left the group",
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
