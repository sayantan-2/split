import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name too long"),
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

  switch (req.method) {
    case "GET":
      return handleGetGroups(req, res, session.user.id);
    case "POST":
      return handleCreateGroup(req, res, session.user.id);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleGetGroups(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Get all groups where user is a member
    const userGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        avatar: groups.avatar,
        createdBy: groups.createdBy,
        createdAt: groups.createdAt,
        role: groupMembers.role,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId))
      .orderBy(groups.createdAt);

    return res.status(200).json({ groups: userGroups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleCreateGroup(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const validation = createGroupSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: validation.error.issues,
      });
    }

    const { name, description } = validation.data;

    // Start a transaction to create group and add creator as admin
    const newGroup = await db.transaction(async (tx) => {
      // Create the group
      const group = await tx
        .insert(groups)
        .values({
          name,
          description,
          createdBy: userId,
        })
        .returning();

      // Add creator as admin member
      await tx.insert(groupMembers).values({
        groupId: group[0].id,
        userId: userId,
        role: "admin",
      });

      return group[0];
    });

    return res.status(201).json({
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
