import type { Route } from "./+types/api.family-members.remove";
import { userDb } from "~/lib/db";

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const env = (context.cloudflare as any)?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const formData = await request.formData();
    const memberId = formData.get("memberId") as string;

    // Validation
    if (!memberId) {
      return { error: "Member ID is required" };
    }

    // TODO: Implement actual member removal from database
    // For now, this is a placeholder that returns success
    console.log("Removing member:", memberId);

    return { success: true, message: "Member removed successfully" };
  } catch (error) {
    console.error("Remove family member API error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return { error: "Failed to remove family member" };
  }
}
