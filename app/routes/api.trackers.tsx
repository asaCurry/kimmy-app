import type { ActionFunctionArgs } from "react-router";
import { getDatabase } from "~/lib/db-utils";
import { TrackerDB } from "~/lib/tracker-db";
import { createTrackerSchema, updateTrackerSchema } from "~/lib/schemas";



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

    console.log("API received action:", action);
    console.log("API received formData:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const trackerDB = new TrackerDB(db);

    switch (action) {
      case "create": {
        try {
          const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string || undefined,
            type: formData.get("type") as "time" | "cumulative",
            unit: formData.get("unit") as string,
            color: formData.get("color") as string || "#3b82f6",
            icon: formData.get("icon") as string || "⏱️",
          };

          console.log("Data before validation:", data);
          const validatedData = createTrackerSchema.parse(data);
          console.log("Data after validation:", validatedData);

          const tracker = await trackerDB.createTracker(
            validatedData,
            session.currentHouseholdId,
            session.userId
          );

          console.log("Tracker created successfully:", tracker);
          return { success: true, tracker };
        } catch (error) {
          console.error("Error creating tracker:", error);
          if (error instanceof Error) {
            return { success: false, error: error.message };
          }
          return { success: false, error: "Unknown error occurred" };
        }
      }

      case "update": {
        const id = parseInt(formData.get("id") as string);
        if (isNaN(id)) {
          return { success: false, error: "Invalid tracker ID" };
        }

        const data = {
          name: formData.get("name") as string || undefined,
          description: formData.get("description") as string || undefined,
          type: formData.get("type") as "time" | "cumulative" || undefined,
          unit: formData.get("unit") as string || undefined,
          color: formData.get("color") as string || undefined,
          icon: formData.get("icon") as string || undefined,
        };

        const validatedData = updateTrackerSchema.parse(data);
        const tracker = await trackerDB.updateTracker(
          id,
          validatedData,
          session.currentHouseholdId
        );

        if (!tracker) {
          return { success: false, error: "Tracker not found" };
        }

        return { success: true, tracker };
      }

      case "delete": {
        const id = parseInt(formData.get("id") as string);
        if (isNaN(id)) {
          return { success: false, error: "Invalid tracker ID" };
        }

        const success = await trackerDB.deleteTracker(id, session.currentHouseholdId);
        if (!success) {
          return { success: false, error: "Tracker not found" };
        }

        return { success: true };
      }

      default:
        return { success: false, error: "Invalid action" };
    }
  } catch (error) {
    console.error("Error in tracker action:", error);
    return { success: false, error: "Failed to perform action" };
  }
}
