import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../../lib/auth";
import { db } from "../../../../../db";
import { expenses, expenseSplits, groupMembers, users } from "../../../../../db/schema";
import { eq, and } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { groupId, expenseId } = req.query;
  if (!groupId || typeof groupId !== "string") {
    return res.status(400).json({ error: "Group ID is required" });
  }
  if (!expenseId || typeof expenseId !== "string") {
    return res.status(400).json({ error: "Expense ID is required" });
  }

  // Check if user is member of this group
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
    return res.status(403).json({ error: "Not a member of this group" });
  }

  // Check if expense exists and belongs to this group
  const expense = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.groupId, groupId)
      )
    )
    .limit(1);

  if (expense.length === 0) {
    return res.status(404).json({ error: "Expense not found" });
  }

  if (req.method === "GET") {
    // Get expense details with splits
    try {
      const expenseDetails = await db
        .select({
          id: expenses.id,
          title: expenses.title,
          description: expenses.description,
          amount: expenses.amount,
          currency: expenses.currency,
          category: expenses.category,
          splitType: expenses.splitType,
          date: expenses.date,
          createdAt: expenses.createdAt,
          paidByName: users.name,
          paidByEmail: users.email,
          paidById: expenses.paidById,
        })
        .from(expenses)
        .leftJoin(users, eq(expenses.paidById, users.id))
        .where(eq(expenses.id, expenseId))
        .limit(1);

      const splits = await db
        .select({
          id: expenseSplits.id,
          userId: expenseSplits.userId,
          amount: expenseSplits.amount,
          paid: expenseSplits.paid,
          userName: users.name,
          userEmail: users.email,
        })
        .from(expenseSplits)
        .leftJoin(users, eq(expenseSplits.userId, users.id))
        .where(eq(expenseSplits.expenseId, expenseId));

      return res.status(200).json({
        ...expenseDetails[0],
        splits,
      });
    } catch (error) {
      console.error("Error fetching expense:", error);
      return res.status(500).json({ error: "Failed to fetch expense" });
    }
  }

  if (req.method === "PUT") {
    // Update expense (only by the person who paid)
    try {
      if (expense[0].paidById !== session.user.id) {
        return res.status(403).json({ error: "Only the person who paid can edit this expense" });
      }

      const {
        title,
        description,
        amount,
        currency,
        category,
        date,
        splits
      } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }

      // Update expense
      const updatedExpense = await db
        .update(expenses)
        .set({
          title: title.trim(),
          description: description?.trim() || null,
          amount: amount.toString(),
          currency: currency || "USD",
          category: category?.trim() || null,
          date: date ? new Date(date) : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, expenseId))
        .returning();

      // If splits are provided, update them
      if (splits && Array.isArray(splits)) {
        // Delete existing splits
        await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));

        // Create new splits
        const expenseSplitData = splits.map(split => ({
          expenseId,
          userId: split.userId,
          amount: split.amount.toString(),
          paid: split.userId === session.user.id,
        }));

        await db.insert(expenseSplits).values(expenseSplitData);
      }

      return res.status(200).json({
        message: "Expense updated successfully",
        expense: updatedExpense[0],
      });
    } catch (error) {
      console.error("Error updating expense:", error);
      return res.status(500).json({ error: "Failed to update expense" });
    }
  }

  if (req.method === "DELETE") {
    // Delete expense (only by the person who paid)
    try {
      if (expense[0].paidById !== session.user.id) {
        return res.status(403).json({ error: "Only the person who paid can delete this expense" });
      }

      // Delete expense splits first
      await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));

      // Delete expense
      await db.delete(expenses).where(eq(expenses.id, expenseId));

      return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      return res.status(500).json({ error: "Failed to delete expense" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
