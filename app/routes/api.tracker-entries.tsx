import type { ActionFunctionArgs } from "react-router";
import { getDatabase } from "~/lib/db-utils";
import { TrackerDB } from "~/lib/tracker-db";
import { 
  createTrackerEntrySchema, 
  startTimeTrackingSchema, 
  stopTimeTrackingSchema,
  quickLogSchema 
} from "~/lib/schemas";

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const env = (context as any).cloudflare?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const db = getDatabase(env);

    // Get session from cookies
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      throw new Response("Unauthorized", { status: 401 });
    }

      const cookies = cookieHeader.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      const sessionData = cookies["kimmy_auth_session"];
      if (!sessionData) {
        throw new Response("Unauthorized", { status: 401 });
      }

      let session;
      try {
        session = JSON.parse(decodeURIComponent(sessionData));
      } catch (error) {
        throw new Response("Unauthorized", { status: 401 });
      }

      if (!session.currentHouseholdId || !session.userId) {
        throw new Response("Unauthorized", { status: 401 });
      }

      const formData = await request.formData();
      const action = formData.get("_action") as string;

      const trackerDB = new TrackerDB(db);

      switch (action) {
        case "complete-tracking": {
          const data = {
            trackerId: parseInt(formData.get("trackerId") as string),
            memberId: formData.get("memberId") ? parseInt(formData.get("memberId") as string) : undefined,
            startTime: formData.get("startTime") as string,
            endTime: formData.get("endTime") as string,
            notes: formData.get("notes") as string || undefined,
          };

          // Calculate duration in minutes with decimal precision
          const start = new Date(data.startTime);
          const end = new Date(data.endTime);
          const durationMs = end.getTime() - start.getTime();
          const durationMinutes = durationMs / (1000 * 60); // Keep decimal precision

          const entry = await trackerDB.createTrackerEntry({
            trackerId: data.trackerId,
            memberId: data.memberId,
            value: durationMinutes,
            startTime: data.startTime,
            endTime: data.endTime,
            notes: data.notes,
            tags: undefined,
          }, session.currentHouseholdId, session.userId);

          return { success: true, entry };
        }

        case "quick-log": {
          const data = {
            trackerId: parseInt(formData.get("trackerId") as string),
            memberId: formData.get("memberId") ? parseInt(formData.get("memberId") as string) : undefined,
            value: parseFloat(formData.get("value") as string),
            notes: formData.get("notes") as string || undefined,
            tags: formData.get("tags") as string || undefined,
          };

          const validatedData = quickLogSchema.parse(data);
          const entry = await trackerDB.quickLog(
            validatedData,
            session.currentHouseholdId,
            session.userId
          );

          return { success: true, entry };
        }

        case "create-entry": {
          const data = {
            trackerId: parseInt(formData.get("trackerId") as string),
            memberId: formData.get("memberId") ? parseInt(formData.get("memberId") as string) : undefined,
            value: parseFloat(formData.get("value") as string),
            startTime: formData.get("startTime") as string || undefined,
            endTime: formData.get("endTime") as string || undefined,
            notes: formData.get("notes") as string || undefined,
            tags: formData.get("tags") as string || undefined,
          };

          const validatedData = createTrackerEntrySchema.parse(data);
          const entry = await trackerDB.createTrackerEntry(
            validatedData,
            session.currentHouseholdId,
            session.userId
          );

          return { success: true, entry };
        }

        case "delete-entry": {
          const id = parseInt(formData.get("id") as string);
          if (isNaN(id)) {
            return { success: false, error: "Invalid entry ID" };
          }

          const success = await trackerDB.deleteTrackerEntry(id, session.currentHouseholdId);
          if (!success) {
            return { success: false, error: "Entry not found" };
          }

          return { success: true };
        }

              default:
        return { success: false, error: "Invalid action" };
    }
  } catch (error) {
    console.error("Error in tracker entry action:", error);
    return { success: false, error: "Failed to perform action" };
  }
}
