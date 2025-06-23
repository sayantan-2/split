import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { invitations, groups, groupMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

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

  if (req.method === "POST") {
    // Send invitation
    try {
      const { email } = req.body;

      if (!email?.trim()) {
        return res.status(400).json({ error: "Email is required" });
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
        return res.status(403).json({ error: "Only group members can send invitations" });
      }

      // Check if user already exists and is already a member
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email.trim()))
        .limit(1);

      if (existingUser.length > 0) {
        const existingMember = await db
          .select()
          .from(groupMembers)
          .where(
            and(
              eq(groupMembers.groupId, groupId),
              eq(groupMembers.userId, existingUser[0].id)
            )
          )
          .limit(1);

        if (existingMember.length > 0) {
          return res.status(409).json({ error: "User is already a member of this group" });
        }
      }

      // Check if invitation already exists
      const existingInvitation = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.groupId, groupId),
            eq(invitations.email, email.trim()),
            eq(invitations.accepted, false)
          )
        )
        .limit(1);

      if (existingInvitation.length > 0) {
        return res.status(409).json({ error: "Invitation already sent to this email" });
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      // Create invitation
      const invitation = await db
        .insert(invitations)
        .values({
          groupId,
          invitedBy: session.user.id,
          email: email.trim(),
          token,
          expiresAt,
        })
        .returning();

      // Get group details for invitation
      const group = await db
        .select()
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1);

      return res.status(201).json({
        message: "Invitation sent successfully",
        invitation: invitation[0],
        inviteLink: `${process.env.NEXTAUTH_URL}/groups/join/${token}`,
        groupName: group[0]?.name,
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      return res.status(500).json({ error: "Failed to send invitation" });
    }
  }

  if (req.method === "GET") {
    // Get pending invitations for this group
    try {
      const pendingInvitations = await db
        .select({
          id: invitations.id,
          email: invitations.email,
          createdAt: invitations.createdAt,
          expiresAt: invitations.expiresAt,
          inviterName: users.name,
        })
        .from(invitations)
        .leftJoin(users, eq(invitations.invitedBy, users.id))
        .where(
          and(
            eq(invitations.groupId, groupId),
            eq(invitations.accepted, false)
          )
        );

      return res.status(200).json(pendingInvitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      return res.status(500).json({ error: "Failed to fetch invitations" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
