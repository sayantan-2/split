import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  groups,
  groupMembers,
  expenses,
  expenseSplits,
  settlements,
  invitations,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { groupId } = req.query;
  if (!groupId || typeof groupId !== "string") {
    return res.status(400).json({ error: "Group ID is required" });
  }

  // Check if user is admin of this group
  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.role, "admin")
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return res
      .status(403)
      .json({ error: "Only group admins can modify group settings" });
  }

  if (req.method === "PUT") {
    // Update group
    try {
      const { name, description } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: "Group name is required" });
      }

      const updatedGroup = await db
        .update(groups)
        .set({
          name: name.trim(),
          description: description?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(groups.id, groupId))
        .returning();

      return res.status(200).json(updatedGroup[0]);
    } catch (error) {
      console.error("Error updating group:", error);
      return res.status(500).json({ error: "Failed to update group" });
    }
  }
  if (req.method === "DELETE") {
    // Delete group and all related data
    try {
      // We need to delete in the correct order due to foreign key constraints

      // 1. Delete expense splits first (they reference expenses)
      const groupExpenses = await db
        .select({ id: expenses.id })
        .from(expenses)
        .where(eq(expenses.groupId, groupId));
      if (groupExpenses.length > 0) {
        const expenseIds = groupExpenses.map((e: { id: string }) => e.id);
        for (const expenseId of expenseIds) {
          await db
            .delete(expenseSplits)
            .where(eq(expenseSplits.expenseId, expenseId));
        }
      }

      // 2. Delete expenses
      await db.delete(expenses).where(eq(expenses.groupId, groupId));

      // 3. Delete settlements
      await db.delete(settlements).where(eq(settlements.groupId, groupId));

      // 4. Delete invitations
      await db.delete(invitations).where(eq(invitations.groupId, groupId));

      // 5. Delete group members
      await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));

      // 6. Finally delete the group
      await db.delete(groups).where(eq(groups.id, groupId));

      return res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      return res.status(500).json({ error: "Failed to delete group" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
