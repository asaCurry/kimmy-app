import type { Route } from "./+types/api.household-members";
import { userDb } from "~/lib/db";

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const env = (context.cloudflare as any)?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    // Extract household ID from session instead of URL
    const cookieHeader = request.headers.get("cookie");
    let householdId = null;

    if (cookieHeader) {
      try {
        const cookies = cookieHeader.split(";").reduce(
          (acc, cookie) => {
            const [key, value] = cookie.trim().split("=");
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        );

        const sessionData = cookies["kimmy_auth_session"];
        if (sessionData) {
          const session = JSON.parse(decodeURIComponent(sessionData));
          householdId = session.currentHouseholdId || null;
        }
      } catch (error) {
        console.error("Failed to parse session cookie:", error);
      }
    }

    if (!householdId) {
      throw new Response("Household ID not found in session", { status: 400 });
    }

    // Fetch household members from database
    const dbMembers = await userDb.findByhouseholdId(env, householdId);

    // Transform database User type to Householdmember type
    const members = dbMembers.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: (member.role || "member") as "admin" | "member",
      age: member.age,
      relationshipToAdmin: member.relationshipToAdmin,
    }));

    return { members };
  } catch (error) {
    console.error("Household members API error:", error);

    if (error instanceof Response) {
      throw error;
    }

    throw new Response("Failed to fetch household members", { status: 500 });
  }
}
