import type { Route } from "./+types/member.$memberId.category.$category.record.$recordTypeId.edit.$recordId";
import * as React from "react";
import { redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui";
import { RequireAuth, useAuth } from "~/contexts";
import { Navigation } from "~/components";
import { DynamicRecordForm } from "~/components";
import { loadHouseholdDataWithMember, getDatabase } from "~/lib";
import { recordTypes, records } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { ErrorBoundary } from "~/components/ui/error-boundary";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const { memberId, category, recordTypeId, recordId } = params;
  
  if (!memberId || !category || !recordTypeId || !recordId) {
    throw new Error("Missing required parameters");
  }

  try {
    const { household, member, householdMembers } = await loadHouseholdDataWithMember(
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

export async function action({ request, context, params }: { request: Request; context: any; params: any; }) {
  const formData = await request.formData();
  const action = formData.get("_action");
  const { memberId, category, recordTypeId, recordId } = params;

  if (!memberId || !category || !recordTypeId || !recordId) {
    throw new Error("Missing required parameters");
  }

  try {
    const { household } = await loadHouseholdDataWithMember(request, context, memberId);
    if (!family) {
      throw new Error("Family not found");
    }

    const db = getDatabase(context);

    if (action === "delete") {
      // Handle record deletion
      const record = await db
        .select()
        .from(records)
        .where(
          and(
            eq(records.id, parseInt(recordId)),
            eq(records.familyId, family.id)
          )
        )
        .get();

      if (!record) {
        throw new Error("Record not found");
      }

      await db
        .delete(records)
        .where(eq(records.id, parseInt(recordId)));

      // Redirect back to the records list
      return redirect(`/member/${memberId}/category/${encodeURIComponent(category)}/record/${recordTypeId}`);

    } else if (action === "update") {
      // Handle record update
      const record = await db
        .select()
        .from(records)
        .where(
          and(
            eq(records.id, parseInt(recordId)),
            eq(records.familyId, family.id)
          )
        )
        .get();

      if (!record) {
        throw new Error("Record not found");
      }

      // Extract update data from form
      const updates = {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        tags: formData.get("tags") as string,
        isPrivate: formData.get("isPrivate") === "true" ? 1 : 0,
        datetime: formData.get("datetime") as string,
        updatedAt: new Date().toISOString(),
      };

      // Validate required fields
      if (!updates.title?.trim()) {
        throw new Error("Title is required");
      }

      // Update the record
      await db
        .update(records)
        .set(updates)
        .where(eq(records.id, parseInt(recordId)));

      // Redirect to the record detail view
      return redirect(`/member/${memberId}/category/${encodeURIComponent(category)}/record/${recordTypeId}/view/${recordId}`);
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Error in record action:", error);
    throw error;
  }
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
          onBack={() => {
            // Navigate back to the record detail view
            window.location.href = `/member/${member.id}/category/${encodeURIComponent(category)}/record/${recordType.id}/view/${record.id}`;
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
