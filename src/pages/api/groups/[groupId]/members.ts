import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { db } from "../../../../db";
import { groupMembers, users } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]).default("member"),
});

const updateMemberSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { groupId } = req.query;
  if (typeof groupId !== "string") {
    return res.status(400).json({ error: "Invalid group ID" });
  }

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
    return res.status(403).json({ error: "Access denied" });
  }

  switch (req.method) {
    case "GET":
      return handleGetMembers(req, res, groupId);
    case "POST":
      return handleAddMember(req, res, groupId, membership[0].role);
    case "PUT":
      return handleUpdateMember(req, res, groupId, membership[0].role);
    case "DELETE":
      return handleRemoveMember(
        req,
        res,
        groupId,
        membership[0].role,
        session.user.id
      );
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetMembers(
  req: NextApiRequest,
  res: NextApiResponse,
  groupId: string
) {
  try {
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: groupMembers.role,
        joinedAt: groupMembers.joinedAt,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(groupMembers.joinedAt);

    return res.status(200).json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleAddMember(
  req: NextApiRequest,
  res: NextApiResponse,
  groupId: string,
  userRole: string
) {
  try {
    // Only admins can add members
    if (userRole !== "admin") {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    const validation = addMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.issues,
      });
    }

    const { email, role } = validation.data;

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, user[0].id)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return res.status(409).json({ error: "User is already a member" });
    }

    // Add member
    const newMember = await db
      .insert(groupMembers)
      .values({
        groupId,
        userId: user[0].id,
        role,
      })
      .returning();

    return res.status(201).json({
      message: "Member added successfully",
      member: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        role: newMember[0].role,
        joinedAt: newMember[0].joinedAt,
      },
    });
  } catch (error) {
    console.error("Error adding member:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleUpdateMember(
  req: NextApiRequest,
  res: NextApiResponse,
  groupId: string,
  userRole: string
) {
  try {
    // Only admins can update member roles
    if (userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can update member roles" });
    }

    const validation = updateMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.issues,
      });
    }

    const { memberId } = req.query;
    if (typeof memberId !== "string") {
      return res.status(400).json({ error: "Invalid member ID" });
    }

    const { role } = validation.data;

    const updatedMember = await db
      .update(groupMembers)
      .set({ role })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, memberId)
        )
      )
      .returning();

    if (updatedMember.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    return res.status(200).json({
      message: "Member role updated successfully",
      member: updatedMember[0],
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleRemoveMember(
  req: NextApiRequest,
  res: NextApiResponse,
  groupId: string,
  userRole: string,
  currentUserId: string
) {
  try {
    const { memberId } = req.query;
    if (typeof memberId !== "string") {
      return res.status(400).json({ error: "Invalid member ID" });
    }

    // Users can remove themselves, or admins can remove others
    if (userRole !== "admin" && memberId !== currentUserId) {
      return res.status(403).json({ error: "Permission denied" });
    }

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
      return res.status(404).json({ error: "Member not found" });
    }

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
