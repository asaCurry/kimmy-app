import { TrackerDB } from "~/lib/tracker-db";
import { createAuthenticatedAction } from "~/lib/validation-layer.server";
import { z } from "zod";
import { apiLogger } from "~/lib/logger";

const trackerActionSchema = z.object({
  _action: z.enum([
    "complete-tracking",
    "quick-log",
    "create-entry",
    "delete-entry",
  ]),
  trackerId: z.coerce.number().int().positive().optional(),
  memberId: z.coerce.number().int().positive().optional(),
  value: z.coerce.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  id: z.coerce.number().int().positive().optional(),
});

function safeParseDate(dateStr: string | undefined, fieldName: string): Date {
  if (!dateStr) {
    throw new Error(`${fieldName} is required`);
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName} format`);
  }
  return date;
}

const ApiResponse = {
  success: (data: any) => Response.json({ success: true, ...data }),
  error: (message: string, status: number = 400) =>
    Response.json({ success: false, error: message }, { status }),
  notFound: (resource: string) =>
    Response.json(
      { success: false, error: `${resource} not found` },
      { status: 404 }
    ),
  serverError: (message: string) =>
    Response.json({ success: false, error: message }, { status: 500 }),
};

export const action = createAuthenticatedAction(
  trackerActionSchema,
  async (data, { env, db, session }) => {
    const trackerDB = new TrackerDB(db);

    switch (data._action) {
      case "complete-tracking": {
        if (!data.trackerId || !data.startTime || !data.endTime) {
          return ApiResponse.error(
            "trackerId, startTime, and endTime are required for complete-tracking"
          );
        }

        try {
          // Validate and parse dates
          const start = safeParseDate(data.startTime, "startTime");
          const end = safeParseDate(data.endTime, "endTime");

          // Validate time range
          if (end <= start) {
            return ApiResponse.error("End time must be after start time");
          }

          // Calculate duration in minutes with decimal precision
          const durationMs = end.getTime() - start.getTime();
          const durationMinutes = durationMs / (1000 * 60);

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
            session.currentHouseholdId,
            session.userId
          );

          return ApiResponse.success({ entry });
        } catch (error) {
          apiLogger.error("Error in complete-tracking", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          return ApiResponse.error(
            error instanceof Error
              ? error.message
              : "Failed to complete tracking"
          );
        }
      }

      case "quick-log": {
        if (!data.trackerId || data.value === undefined) {
          return ApiResponse.error(
            "trackerId and value are required for quick-log"
          );
        }

        try {
          const entry = await trackerDB.quickLog(
            {
              trackerId: data.trackerId,
              memberId: data.memberId,
              value: data.value,
              notes: data.notes,
              tags: data.tags,
            },
            session.currentHouseholdId,
            session.userId
          );

          return ApiResponse.success({ entry });
        } catch (error) {
          apiLogger.error("Error in quick-log", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          return ApiResponse.error(
            error instanceof Error
              ? error.message
              : "Failed to create quick log"
          );
        }
      }

      case "create-entry": {
        if (!data.trackerId || data.value === undefined) {
          return ApiResponse.error(
            "trackerId and value are required for create-entry"
          );
        }

        try {
          const entry = await trackerDB.createTrackerEntry(
            {
              trackerId: data.trackerId,
              memberId: data.memberId,
              value: data.value,
              startTime: data.startTime,
              endTime: data.endTime,
              notes: data.notes,
              tags: data.tags,
            },
            session.currentHouseholdId,
            session.userId
          );

          return ApiResponse.success({ entry });
        } catch (error) {
          apiLogger.error("Error in create-entry", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          return ApiResponse.error(
            error instanceof Error ? error.message : "Failed to create entry"
          );
        }
      }

      case "delete-entry": {
        if (!data.id) {
          return ApiResponse.error("id is required for delete-entry");
        }

        try {
          const success = await trackerDB.deleteTrackerEntry(
            data.id,
            session.currentHouseholdId
          );

          if (!success) {
            return ApiResponse.notFound("Entry");
          }

          return ApiResponse.success({ deleted: true });
        } catch (error) {
          apiLogger.error("Error in delete-entry", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          return ApiResponse.error(
            error instanceof Error ? error.message : "Failed to delete entry"
          );
        }
      }

      default:
        return ApiResponse.error("Invalid action");
    }
  }
);
