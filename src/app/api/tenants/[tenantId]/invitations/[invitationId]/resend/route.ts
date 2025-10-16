/** @format */

import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/auth";
import { requireAuthResponse, getUserId } from "@/lib/session";
import prisma from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; invitationId: string }> }
) {
  const sessionResult = await requireAuthResponse();
  if (sessionResult instanceof NextResponse) {
    return sessionResult;
  }

  const { tenantId, invitationId } = await params;
  const userId = getUserId(sessionResult);
  const role = sessionResult.user.role;

  // Only admins can resend invitations
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get existing invitation
    const invitation = await prisma.invitation.findUnique({
      where: {
        id: invitationId,
        tenantId: Number(tenantId),
      },
      include: {
        tenant: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invitation.accepted) {
      return NextResponse.json(
        { error: "Invitation has already been accepted" },
        { status: 400 }
      );
    }

    // Generate new token
    const newToken = generateToken(
      {
        userId: 0,
        role: "INVITATION",
        email: invitation.email,
        tenantId: Number(tenantId),
      } as any,
      "7d"
    );

    // Update invitation with new token and expiry
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // Send new invitation email
    try {
      await sendInvitationEmail({
        to: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role as any,
        tenantName: invitation.tenant.name,
        invitationUrl: `${process.env.NEXTAUTH_URL}/invite?token=${newToken}`,
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email, but invitation was updated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Invitation resent successfully",
      invitation: updatedInvitation,
    });
  } catch (error: any) {
    console.error("Error resending invitation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resend invitation" },
      { status: 500 }
    );
  }
}

