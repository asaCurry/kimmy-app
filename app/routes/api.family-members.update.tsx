import type { Route } from "./+types/api.household-members.update";
import { userDb } from "~/lib/db";

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const env = (context.cloudflare as any)?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const formData = await request.formData();
    const memberId = formData.get("memberId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const relationship = formData.get("relationship") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;

    // Validation
    if (!memberId || !firstName || !lastName || !relationship) {
      return { error: "Required fields are missing" };
    }

    // TODO: Implement actual member update in database
    // For now, this is a placeholder that returns success
    console.log("Updating member:", {
      memberId,
      firstName,
      lastName,
      email,
      relationship,
      dateOfBirth,
    });

    return { success: true, message: "Member updated successfully" };
  } catch (error) {
    console.error("Update household member API error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return { error: "Failed to update household member" };
  }
}
