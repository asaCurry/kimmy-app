import type { Route } from "./+types/api.invite-codes.regenerate";
import { inviteCodeDb } from "~/lib/db";
import { createAuthenticatedAction } from "~/lib/validation-layer.server";
import { z } from "zod";

// Schema for invite code regeneration
const regenerateInviteCodeSchema = z.object({
  householdId: z
    .string()
    .uuid("Invalid household ID format")
    .min(1, "Household ID is required"),
});

export const action = createAuthenticatedAction(
  regenerateInviteCodeSchema,
  async (data, { env, session }) => {
    try {
      // Authorization: verify user is admin of household (session provides userId)
      // TODO: Add household admin check when user-household relationships are implemented

      // Regenerate the invite code
      const newInviteCode = await inviteCodeDb.regenerateInviteCode(
        env,
        data.householdId
      );

      if (!newInviteCode) {
        return Response.json(
          { success: false, error: "Failed to regenerate invite code" },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        inviteCode: newInviteCode,
        message: "Invite code regenerated successfully",
      });
    } catch (error) {
      console.error("Regenerate invite code API error:", error);

      if (error instanceof Response) {
        throw error;
      }

      return Response.json(
        { success: false, error: "Failed to regenerate invite code" },
        { status: 500 }
      );
    }
  }
);
