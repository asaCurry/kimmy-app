import { recordTypes } from "~/db/schema";
import { withDatabaseAndSession } from "~/lib/db-utils";

export async function action({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  const formData = await request.formData();
  const householdId = formData.get("householdId") as string;

  if (!householdId) {
    throw new Response("Household ID required", { status: 400 });
  }

  return withDatabaseAndSession(request, context, async (db, session) => {
    // Create basic record types for the household
    const basicRecordTypes = [
      {
        name: "General Record",
        description: "A basic record type for general information",
        icon: "📝",
        color: "blue",
        allowPrivate: 1,
        fields: JSON.stringify([]),
      },
    ];

    const createdRecordTypes = [];

    for (const recordType of basicRecordTypes) {
      const newRecordType = await db
        .insert(recordTypes)
        .values({
          ...recordType,
          householdId,
          createdBy: session.userId,
        })
        .returning();

      createdRecordTypes.push(newRecordType[0]);
    }

    return {
      success: true,
      message: `Created ${createdRecordTypes.length} basic record types`,
      recordTypes: createdRecordTypes,
    };
  });
}
