import type { Route } from "./+types/member.$memberId.category.$category.record.$recordTypeId.edit.$recordId";
import * as React from "react";
import { redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui";
import { RequireAuth, useAuth } from "~/contexts";
import { Navigation } from "~/components";
import { DynamicRecordForm } from "~/components";
import { loadFamilyDataWithMember, getDatabase } from "~/lib";
import { recordTypes, records } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { ErrorBoundary } from "~/components/ui/error-boundary";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const { memberId, category, recordTypeId, recordId } = params;
  
  if (!memberId || !category || !recordTypeId || !recordId) {
    throw new Error("Missing required parameters");
  }

  try {
    const { family, member, familyMembers } = await loadFamilyDataWithMember(
      request,
      context,
      memberId
    );

    if (!family || !member) {
      throw new Error("Family or member not found");
    }

    // Load the record type
    const db = getDatabase(context);
    const recordType = await db
      .select()
      .from(recordTypes)
      .where(
        and(
          eq(recordTypes.id, parseInt(recordTypeId)),
          eq(recordTypes.category, category),
          eq(recordTypes.familyId, family.id)
        )
      )
      .get();

    if (!recordType) {
      throw new Error("Record type not found");
    }

    // Load the specific record
    const record = await db
      .select()
      .from(records)
      .where(
        and(
          eq(records.id, parseInt(recordId)),
          eq(records.recordTypeId, parseInt(recordTypeId)),
          eq(records.familyId, family.id)
        )
      )
      .get();

    if (!record) {
      throw new Error("Record not found");
    }

    return {
      family,
      member,
      familyMembers,
      recordType,
      record,
      category,
    };
  } catch (error) {
    console.error("Error loading edit record data:", error);
    throw error;
  }
}

export async function action({ request, context }: { request: Request; context: any; }) {
  const formData = await request.formData();
  const action = formData.get("_action");

  if (action === "delete") {
    const recordId = formData.get("recordId");
    if (!recordId) {
      throw new Error("Record ID is required for deletion");
    }

    const db = getDatabase(context);
    await db
      .delete(records)
      .where(eq(records.id, parseInt(recordId.toString())));

    // Redirect back to the records list
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const memberId = pathParts[2];
    const category = pathParts[4];
    const recordTypeId = pathParts[6];
    
    return redirect(`/member/${memberId}/category/${encodeURIComponent(category)}/record/${recordTypeId}`);
  }

  throw new Error("Invalid action");
}

const RecordEditPage: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const { family, member, familyMembers, recordType, record, category } = loaderData;
  const { user } = useAuth();

  if (!record) {
    return (
      <PageLayout>
        <PageHeader
          title="Record Not Found"
          subtitle="The requested record could not be found"
        />
        <div className="text-center py-8">
          <p className="text-slate-400">The record you're looking for doesn't exist or has been deleted.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Navigation family={family} member={member} />
      <PageHeader
        title={`Edit ${recordType.name}`}
        subtitle={`Editing record: ${record.title}`}
      />
      
      <div className="max-w-4xl mx-auto">
        <DynamicRecordForm
          recordType={recordType}
          familyMembers={familyMembers}
          familyId={family.id}
          memberId={member.id}
          category={category}
          mode="edit"
          initialData={record}
          customOnSubmit={async (data) => {
            // TODO: Implement record update functionality
            console.log("Updating record with data:", data);
            // For now, just log the data
            return { success: true };
          }}
        />
      </div>
    </PageLayout>
  );
};

export default function RecordEditPageWrapper() {
  return (
    <RequireAuth>
      <ErrorBoundary>
        <RecordEditPage />
      </ErrorBoundary>
    </RequireAuth>
  );
}
