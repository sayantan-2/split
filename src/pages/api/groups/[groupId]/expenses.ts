import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../db";
import { expenses, expenseSplits, groupMembers, users } from "../../../../db/schema";
import { eq, and, desc } from "drizzle-orm";

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

  if (req.method === "GET") {
    // Get all expenses for this group
    try {
      const groupExpenses = await db
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
        .where(eq(expenses.groupId, groupId))
        .orderBy(desc(expenses.date));

      // Get splits for each expense
      const expensesWithSplits = await Promise.all(
        groupExpenses.map(async (expense) => {
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
            .where(eq(expenseSplits.expenseId, expense.id));

          return {
            ...expense,
            splits,
          };
        })
      );

      return res.status(200).json(expensesWithSplits);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }

  if (req.method === "POST") {
    // Create new expense
    try {
      const {
        title,
        description,
        amount,
        currency = "USD",
        category,
        splitType = "equal",
        date,
        splits
      } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ error: "Title is required" });
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid amount is required" });
      }

      if (!splits || !Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({ error: "Expense splits are required" });
      }

      // Validate that all split users are group members
      const splitUserIds = splits.map(split => split.userId);
      const groupMemberships = await db
        .select({ userId: groupMembers.userId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

      const validMemberIds = groupMemberships.map(m => m.userId);
      const invalidUserIds = splitUserIds.filter(id => !validMemberIds.includes(id));
      
      if (invalidUserIds.length > 0) {
        return res.status(400).json({ error: "Some users are not members of this group" });
      }

      // Validate split amounts
      const totalSplitAmount = splits.reduce((sum, split) => sum + parseFloat(split.amount), 0);
      const expenseAmount = parseFloat(amount);
      
      if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
        return res.status(400).json({ error: "Split amounts must equal the total expense amount" });
      }

      // Create expense
      const newExpense = await db
        .insert(expenses)
        .values({
          groupId,
          paidById: session.user.id,
          title: title.trim(),
          description: description?.trim() || null,
          amount: amount.toString(),
          currency,
          category: category?.trim() || null,
          splitType,
          date: date ? new Date(date) : new Date(),
        })
        .returning();

      // Create expense splits
      const expenseSplitData = splits.map(split => ({
        expenseId: newExpense[0].id,
        userId: split.userId,
        amount: split.amount.toString(),
        paid: split.userId === session.user.id, // The person who paid is marked as paid
      }));

      await db.insert(expenseSplits).values(expenseSplitData);

      return res.status(201).json({
        message: "Expense created successfully",
        expense: newExpense[0],
      });
    } catch (error) {
      console.error("Error creating expense:", error);
      return res.status(500).json({ error: "Failed to create expense" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
