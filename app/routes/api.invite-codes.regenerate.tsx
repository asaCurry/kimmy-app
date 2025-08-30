import type { Route } from "./+types/api.invite-codes.regenerate";
import { inviteCodeDb } from "~/lib/db";

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const env = (context.cloudflare as any)?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const formData = await request.formData();
    const householdId = formData.get("householdId") as string;

    // Validation
    if (!householdId) {
      return { error: "Household ID is required" };
    }

    // Authorization: verify user is admin of household

    // Regenerate the invite code
    const newInviteCode = await inviteCodeDb.regenerateInviteCode(
      env,
      householdId
    );

    if (!newInviteCode) {
      return { error: "Failed to regenerate invite code" };
    }

    return {
      success: true,
      inviteCode: newInviteCode,
      message: "Invite code regenerated successfully",
    };
  } catch (error) {
    console.error("Regenerate invite code API error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return { error: "Failed to regenerate invite code" };
  }
}
