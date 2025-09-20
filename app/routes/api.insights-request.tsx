import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { eq, and, desc } from "drizzle-orm";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { insightsRequests } from "~/db/schema";
import type { NewInsightsRequest } from "~/db/schema";

export async function loader({ request, context }: LoaderFunctionArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    // Only admin users can access insights requests
    if (session.role !== "admin") {
      throw new Response("Unauthorized", { status: 403 });
    }

    // Get all insights requests for this household
    const requests = await db
      .select()
      .from(insightsRequests)
      .where(eq(insightsRequests.householdId, session.currentHouseholdId))
      .orderBy(desc(insightsRequests.createdAt));

    return {
      success: true,
      requests,
    };
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    // Only admin users can create insights requests
    if (session.role !== "admin") {
      throw new Response("Unauthorized", { status: 403 });
    }

    const formData = await request.formData();
    const action = formData.get("_action") as string;

    switch (action) {
      case "create": {
        const type = (formData.get("type") as string) || "comprehensive";
        const priority = (formData.get("priority") as string) || "normal";
        const description = formData.get("description") as string;
        const parameters = formData.get("parameters") as string;

        // Validate type
        const validTypes = ["comprehensive", "health", "growth", "behavior"];
        if (!validTypes.includes(type)) {
          throw new Response("Invalid request type", { status: 400 });
        }

        // Validate priority
        const validPriorities = ["urgent", "high", "normal", "low"];
        if (!validPriorities.includes(priority)) {
          throw new Response("Invalid priority", { status: 400 });
        }

        const newRequest: NewInsightsRequest = {
          householdId: session.currentHouseholdId,
          requestedBy: session.userId,
          type,
          priority,
          description: description || null,
          parameters: parameters || null,
          status: "pending",
        };

        const result = await db
          .insert(insightsRequests)
          .values(newRequest)
          .returning();

        // TODO: Queue the request for async processing by a background worker
        // For now, we just create the record in the database

        return {
          success: true,
          request: result[0],
          message: `${type} insights request created successfully`,
        };
      }

      case "cancel": {
        const requestId = parseInt(formData.get("requestId") as string);
        if (!requestId) {
          throw new Response("Request ID required", { status: 400 });
        }

        // Only allow canceling pending requests
        await db
          .update(insightsRequests)
          .set({
            status: "cancelled",
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(insightsRequests.id, requestId),
              eq(insightsRequests.householdId, session.currentHouseholdId),
              eq(insightsRequests.status, "pending")
            )
          );

        return {
          success: true,
          message: "Request cancelled successfully",
        };
      }

      case "retry": {
        const requestId = parseInt(formData.get("requestId") as string);
        if (!requestId) {
          throw new Response("Request ID required", { status: 400 });
        }

        // Reset failed request to pending
        await db
          .update(insightsRequests)
          .set({
            status: "pending",
            error: null,
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(insightsRequests.id, requestId),
              eq(insightsRequests.householdId, session.currentHouseholdId),
              eq(insightsRequests.status, "failed")
            )
          );

        return {
          success: true,
          message: "Request queued for retry",
        };
      }

      default:
        throw new Response("Invalid action", { status: 400 });
    }
  });
}
