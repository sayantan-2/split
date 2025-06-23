import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../db";
import { groups, groupMembers, users } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const updateGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
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
      return handleGetGroup(req, res, groupId);
    case "PUT":
      return handleUpdateGroup(req, res, groupId, membership[0].role);
    case "DELETE":
      return handleDeleteGroup(req, res, groupId, membership[0].role);
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetGroup(
  req: NextApiRequest,
  res: NextApiResponse,
  groupId: string
) {
  try {
    // Get group details
    const group = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (group.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Get group members
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

    return res.status(200).json({
      group: {
        ...group[0],
        members,
      },
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleUpdateGroup(
  req: NextApiRequest,
  res: NextApiResponse,
  groupId: string,
  userRole: string
) {
  try {
    // Only admins can update group details
    if (userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can update group details" });
    }

    const validation = updateGroupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.issues,
      });
    }

    const updateData = validation.data;

    const updatedGroup = await db
      .update(groups)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, groupId))
      .returning();

    return res.status(200).json({
      message: "Group updated successfully",
      group: updatedGroup[0],
    });
  } catch (error) {
    console.error("Error updating group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleDeleteGroup(
  req: NextApiRequest,
  res: NextApiResponse,
  groupId: string,
  userRole: string
) {
  try {
    // Only admins can delete groups
    if (userRole !== "admin") {
      return res.status(403).json({ error: "Only admins can delete groups" });
    }

    // In a transaction, delete group members first, then the group
    await db.transaction(async (tx) => {
      await tx.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
      await tx.delete(groups).where(eq(groups.id, groupId));
    });

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
