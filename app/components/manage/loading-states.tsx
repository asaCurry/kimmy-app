import * as React from "react";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { LoadingSpinner } from "~/components/ui/loading-spinner";

interface LoadingStatesProps {
  type: "auth" | "members";
}

export const LoadingStates: React.FC<LoadingStatesProps> = ({ type }) => {
  if (type === "auth") {
    return (
      <PageLayout>
        <LoadingSpinner size="lg" text="Loading..." className="min-h-[400px]" />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Household Management"
        subtitle="Manage your household members and settings"
      />
      <LoadingSpinner
        size="lg"
        text="Loading household members..."
        className="min-h-[400px]"
      />
    </PageLayout>
  );
};
