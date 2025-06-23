import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/db";
import { invitations, groups, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Token is required" });
    }

    // Get invitation details without requiring authentication
    const invitation = await db
      .select({
        id: invitations.id,
        groupId: invitations.groupId,
        email: invitations.email,
        accepted: invitations.accepted,
        expiresAt: invitations.expiresAt,
        groupName: groups.name,
        groupDescription: groups.description,
        inviterName: users.name,
      })
      .from(invitations)
      .leftJoin(groups, eq(invitations.groupId, groups.id))
      .leftJoin(users, eq(invitations.invitedBy, users.id))
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
      return res
        .status(409)
        .json({ error: "Invitation has already been accepted" });
    }

    return res.status(200).json({
      groupName: invite.groupName,
      groupDescription: invite.groupDescription,
      inviterName: invite.inviterName,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching invitation details:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch invitation details" });
  }
}
