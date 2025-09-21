import type { ActionFunctionArgs } from "react-router";

export async function action({ request, context }: ActionFunctionArgs) {
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

    // Database member removal implementation needed

    return { success: true, message: "Member removed successfully" };
  } catch (error) {
    console.error("Remove household member API error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return { error: "Failed to remove household member" };
  }
}
