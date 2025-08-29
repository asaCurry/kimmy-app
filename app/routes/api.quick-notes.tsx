import type { ActionFunctionArgs } from "react-router";
import { getDatabase } from "~/lib/db-utils";
import { quickNotes } from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { parseCookies } from "~/lib/utils";

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return { error: "No session found" };
    }

    const cookies = parseCookies(cookieHeader);
    const sessionData = cookies["kimmy_auth_session"];

    if (!sessionData) {
      return { error: "No session found" };
    }

    const session = JSON.parse(decodeURIComponent(sessionData));
    if (!session.userId || !session.currentHouseholdId) {
      return { error: "Invalid session" };
    }

    const formData = await request.formData();
    const action = formData.get("_action");

    if (action === "create") {
      const content = formData.get("content") as string;
      const tags = formData.get("tags") as string;
      const householdId = formData.get("householdId") as string;
      const memberId = formData.get("memberId") as string;

      if (!content || !householdId || !memberId) {
        return { error: "Missing required fields" };
      }

      const db = getDatabase(context.cloudflare.env);

      const newNote = await db
        .insert(quickNotes)
        .values({
          content: content.trim(),
          tags: tags.trim() || null,
          householdId,
          createdBy: session.userId,
          recordId: null, // Optional link to a record
          attachments: null, // No file attachments for quick notes
        })
        .returning();

      return {
        success: true,
        note: newNote[0],
        message: "Quick note created successfully",
      };
    }

    if (action === "delete") {
      const noteId = formData.get("noteId") as string;

      if (!noteId) {
        return { error: "Note ID is required" };
      }

      const db = getDatabase(context.cloudflare.env);

      // Verify the note belongs to the user's household
      const note = await db
        .select()
        .from(quickNotes)
        .where(
          and(
            eq(quickNotes.id, parseInt(noteId)),
            eq(quickNotes.householdId, session.currentHouseholdId)
          )
        )
        .limit(1);

      if (note.length === 0) {
        return { error: "Note not found or access denied" };
      }

      // Delete the note
      await db.delete(quickNotes).where(eq(quickNotes.id, parseInt(noteId)));

      return {
        success: true,
        deletedNoteId: parseInt(noteId),
        message: "Quick note deleted successfully",
      };
    }

    return { error: "Invalid action" };
  } catch (error) {
    console.error("Quick notes action error:", error);
    return { error: "Failed to process request" };
  }
}

export async function loader({ request, context }: ActionFunctionArgs) {
  try {
    const cookieHeader = request.headers.get("cookie");
    if (!cookieHeader) {
      return { notes: [] };
    }

    const cookies = parseCookies(cookieHeader);
    const sessionData = cookies["kimmy_auth_session"];

    if (!sessionData) {
      return { notes: [] };
    }

    const session = JSON.parse(decodeURIComponent(sessionData));
    if (!session.currentHouseholdId) {
      return { notes: [] };
    }

    const url = new URL(request.url);
    const memberId = url.searchParams.get("memberId");

    if (!memberId) {
      return { error: "Member ID is required" };
    }

    const db = getDatabase(context.cloudflare.env);

    // Get quick notes for the specific member and household
    const notes = await db
      .select()
      .from(quickNotes)
      .where(
        and(
          eq(quickNotes.householdId, session.currentHouseholdId)
          // Note: We're not filtering by memberId since quick notes are household-wide
          // but we could add this filter if you want member-specific notes
        )
      )
      .orderBy(desc(quickNotes.createdAt))
      .limit(20); // Limit to 20 most recent notes

    return { notes };
  } catch (error) {
    console.error("Quick notes loader error:", error);
    return { notes: [] };
  }
}
