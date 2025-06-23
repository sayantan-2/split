import { db } from "./index";
import {
  users,
  groups,
  groupMembers,
  expenses,
  expenseSplits,
  settlements,
} from "./schema";
import { eq, and, desc, sum, sql } from "drizzle-orm";

// User utilities
export const userQueries = {
  // Get user by email
  async getByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  // Get user by ID
  async getById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  // Create new user
  async create(userData: { email: string; name: string; avatar?: string }) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  // Update user
  async update(
    id: string,
    updates: Partial<{ name: string; avatar: string; emailVerified: Date }>
  ) {
    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  },
};

// Group utilities
export const groupQueries = {
  // Get user's groups
  async getUserGroups(userId: string) {
    return await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        avatar: groups.avatar,
        createdAt: groups.createdAt,
        role: groupMembers.role,
        memberCount: sql<number>`count(${groupMembers.id})`,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId))
      .groupBy(groups.id, groupMembers.role)
      .orderBy(desc(groups.createdAt));
  },

  // Get group details with members
  async getGroupWithMembers(groupId: string) {
    return await db
      .select({
        group: groups,
        member: users,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groups.id, groupId));
  },

  // Create new group
  async create(groupData: {
    name: string;
    description?: string;
    createdBy: string;
  }) {
    return await db.transaction(async (tx) => {
      // Create group
      const [group] = await tx.insert(groups).values(groupData).returning();

      // Add creator as admin member
      await tx.insert(groupMembers).values({
        groupId: group.id,
        userId: groupData.createdBy,
        role: "admin",
      });

      return group;
    });
  },

  // Add member to group
  async addMember(
    groupId: string,
    userId: string,
    role: "admin" | "member" = "member"
  ) {
    const [member] = await db
      .insert(groupMembers)
      .values({
        groupId,
        userId,
        role,
      })
      .returning();
    return member;
  },
};

// Expense utilities
export const expenseQueries = {
  // Get group expenses
  async getGroupExpenses(groupId: string) {
    return await db
      .select({
        expense: expenses,
        paidBy: users,
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.paidById, users.id))
      .where(eq(expenses.groupId, groupId))
      .orderBy(desc(expenses.date));
  },

  // Get expense with splits
  async getExpenseWithSplits(expenseId: string) {
    return await db
      .select({
        expense: expenses,
        paidBy: users,
        split: expenseSplits,
        splitUser: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
        },
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.paidById, users.id))
      .leftJoin(expenseSplits, eq(expenses.id, expenseSplits.expenseId))
      .leftJoin(users, eq(expenseSplits.userId, users.id))
      .where(eq(expenses.id, expenseId));
  },

  // Create expense with splits
  async createWithSplits(
    expenseData: {
      groupId: string;
      paidById: string;
      title: string;
      description?: string;
      amount: string;
      currency?: string;
      category?: string;
      splitType?: "equal" | "exact" | "percentage";
      date?: Date;
    },
    splits: Array<{ userId: string; amount: string }>
  ) {
    return await db.transaction(async (tx) => {
      // Create expense
      const [expense] = await tx
        .insert(expenses)
        .values(expenseData)
        .returning();

      // Create splits
      const splitRecords = splits.map((split) => ({
        expenseId: expense.id,
        userId: split.userId,
        amount: split.amount,
      }));

      await tx.insert(expenseSplits).values(splitRecords);

      return expense;
    });
  },
};

// Balance utilities
export const balanceQueries = {
  // Get user's balance in a group
  async getUserGroupBalance(userId: string, groupId: string) {
    // Amount user has paid
    const paidQuery = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(eq(expenses.paidById, userId), eq(expenses.groupId, groupId)));

    // Amount user owes
    const owesQuery = await db
      .select({ total: sum(expenseSplits.amount) })
      .from(expenseSplits)
      .innerJoin(expenses, eq(expenseSplits.expenseId, expenses.id))
      .where(
        and(eq(expenseSplits.userId, userId), eq(expenses.groupId, groupId))
      );

    const paid = Number(paidQuery[0]?.total || 0);
    const owes = Number(owesQuery[0]?.total || 0);

    return {
      paid,
      owes,
      balance: paid - owes, // Positive means user is owed money, negative means user owes money
    };
  },

  // Get all balances in a group
  async getGroupBalances(groupId: string) {
    // Get all group members
    const members = await db
      .select({ userId: groupMembers.userId, user: users })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));

    // Calculate balance for each member
    const balances = await Promise.all(
      members.map(async (member) => {
        const balance = await balanceQueries.getUserGroupBalance(
          member.userId,
          groupId
        );
        return {
          user: member.user,
          ...balance,
        };
      })
    );

    return balances;
  },
};

// Settlement utilities
export const settlementQueries = {
  // Record a settlement
  async create(settlementData: {
    groupId: string;
    payerId: string;
    payeeId: string;
    amount: string;
    currency?: string;
    description?: string;
  }) {
    const [settlement] = await db
      .insert(settlements)
      .values(settlementData)
      .returning();
    return settlement;
  },

  // Get group settlements
  async getGroupSettlements(groupId: string) {
    return await db
      .select({
        settlement: settlements,
        payer: users,
        payee: users,
      })
      .from(settlements)
      .innerJoin(users, eq(settlements.payerId, users.id))
      .innerJoin(users, eq(settlements.payeeId, users.id))
      .where(eq(settlements.groupId, groupId))
      .orderBy(desc(settlements.settledAt));
  },
};
