import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { db } from "../../../db";
import { invitations, groups, groupMembers, users } from "../../../db/schema";
import { eq, and } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Invitation token is required" });
    }

    // Find the invitation
    const invitation = await db
      .select({
        id: invitations.id,
        groupId: invitations.groupId,
        email: invitations.email,
        accepted: invitations.accepted,
        expiresAt: invitations.expiresAt,
        groupName: groups.name,
        groupDescription: groups.description,
      })
      .from(invitations)
      .leftJoin(groups, eq(invitations.groupId, groups.id))
      .where(eq(invitations.token, token))
      .limit(1);

    if (invitation.length === 0) {
      return res.status(404).json({ error: "Invalid invitation token" });
    }

    const invite = invitation[0];

    // Check if invitation has expired
    if (new Date() > invite.expiresAt) {
      return res.status(410).json({ error: "Invitation has expired" });
    }

    // Check if invitation has already been accepted
    if (invite.accepted) {
      return res.status(409).json({ error: "Invitation has already been accepted" });
    }

    // Get current user's email
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (currentUser.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if invitation email matches current user's email
    if (invite.email !== currentUser[0].email) {
      return res.status(403).json({ 
        error: "This invitation was sent to a different email address" 
      });
    }

    // Check if user is already a member
    const existingMember = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, invite.groupId),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return res.status(409).json({ error: "You are already a member of this group" });
    }

    // Add user to group
    const newMember = await db
      .insert(groupMembers)
      .values({
        groupId: invite.groupId,
        userId: session.user.id,
        role: "member",
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(invitations)
      .set({ accepted: true })
      .where(eq(invitations.id, invite.id));

    return res.status(200).json({
      message: "Successfully joined the group",
      group: {
        id: invite.groupId,
        name: invite.groupName,
        description: invite.groupDescription,
      },
      member: newMember[0],
    });

  } catch (error) {
    console.error("Error joining group:", error);
    return res.status(500).json({ error: "Failed to join group" });
  }
}
