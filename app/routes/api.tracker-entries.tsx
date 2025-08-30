import type { ActionFunctionArgs } from "react-router";
import { getDatabase } from "~/lib/db-utils";
import { TrackerDB } from "~/lib/tracker-db";
import {
  createTrackerEntrySchema,
  startTimeTrackingSchema,
  stopTimeTrackingSchema,
  quickLogSchema,
} from "~/lib/schemas";
import {
  safeParseInt,
  safeParseFloat,
  safeParseOptionalInt,
  safeParseDate,
  safeGetString,
  validateAction,
  validateSession,
  ApiResponse,
} from "~/lib/validation-utils";

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
    const validActions = ["complete-tracking", "quick-log", "create-entry", "delete-entry"];
    const action = validateAction(formData.get("_action"), validActions);
    
    const validatedSession = validateSession(session);
    const trackerDB = new TrackerDB(db);

    switch (action) {
      case "complete-tracking": {
        try {
          const trackerId = safeParseInt(formData.get("trackerId"), "trackerId");
          const memberId = safeParseOptionalInt(formData.get("memberId"));
          const startTimeStr = formData.get("startTime") as string;
          const endTimeStr = formData.get("endTime") as string;
          const notes = safeGetString(formData.get("notes"));

          // Validate and parse dates
          const start = safeParseDate(startTimeStr, "startTime");
          const end = safeParseDate(endTimeStr, "endTime");

          // Validate time range
          if (end <= start) {
            return ApiResponse.error("End time must be after start time");
          }

          // Calculate duration in minutes with decimal precision
          const durationMs = end.getTime() - start.getTime();
          const durationMinutes = durationMs / (1000 * 60);

          const data = {
            trackerId,
            memberId,
            startTime: startTimeStr,
            endTime: endTimeStr,
            notes,
          };

          const entry = await trackerDB.createTrackerEntry(
            {
              trackerId: data.trackerId,
              memberId: data.memberId,
              value: durationMinutes,
              startTime: data.startTime,
              endTime: data.endTime,
              notes: data.notes,
              tags: undefined,
            },
            validatedSession.currentHouseholdId,
            validatedSession.userId
          );

          return ApiResponse.success({ entry });
        } catch (error) {
          console.error("Error in complete-tracking:", error);
          return ApiResponse.error(
            error instanceof Error ? error.message : "Failed to complete tracking"
          );
        }
      }

      case "quick-log": {
        try {
          const data = {
            trackerId: safeParseInt(formData.get("trackerId"), "trackerId"),
            memberId: safeParseOptionalInt(formData.get("memberId")),
            value: safeParseFloat(formData.get("value"), "value"),
            notes: safeGetString(formData.get("notes")),
            tags: safeGetString(formData.get("tags")),
          };

          const validatedData = quickLogSchema.parse(data);
          const entry = await trackerDB.quickLog(
            validatedData,
            validatedSession.currentHouseholdId,
            validatedSession.userId
          );

          return ApiResponse.success({ entry });
        } catch (error) {
          console.error("Error in quick-log:", error);
          return ApiResponse.error(
            error instanceof Error ? error.message : "Failed to create quick log"
          );
        }
      }

      case "create-entry": {
        try {
          const data = {
            trackerId: safeParseInt(formData.get("trackerId"), "trackerId"),
            memberId: safeParseOptionalInt(formData.get("memberId")),
            value: safeParseFloat(formData.get("value"), "value"),
            startTime: safeGetString(formData.get("startTime")),
            endTime: safeGetString(formData.get("endTime")),
            notes: safeGetString(formData.get("notes")),
            tags: safeGetString(formData.get("tags")),
          };

          const validatedData = createTrackerEntrySchema.parse(data);
          const entry = await trackerDB.createTrackerEntry(
            validatedData,
            validatedSession.currentHouseholdId,
            validatedSession.userId
          );

          return ApiResponse.success({ entry });
        } catch (error) {
          console.error("Error in create-entry:", error);
          return ApiResponse.error(
            error instanceof Error ? error.message : "Failed to create entry"
          );
        }
      }

      case "delete-entry": {
        try {
          const id = safeParseInt(formData.get("id"), "entry ID");

          const success = await trackerDB.deleteTrackerEntry(
            id,
            validatedSession.currentHouseholdId
          );
          
          if (!success) {
            return ApiResponse.notFound("Entry");
          }

          return ApiResponse.success({ deleted: true });
        } catch (error) {
          console.error("Error in delete-entry:", error);
          return ApiResponse.error(
            error instanceof Error ? error.message : "Failed to delete entry"
          );
        }
      }

      default:
        return ApiResponse.error("Invalid action");
    }
  } catch (error) {
    console.error("Error in tracker entry action:", error);
    
    // Handle validation errors specifically
    if (error instanceof Error && error.message.includes("required")) {
      return ApiResponse.error(error.message, 400);
    }
    
    return ApiResponse.serverError("Failed to perform action");
  }
}
