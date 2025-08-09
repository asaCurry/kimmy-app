import type { Route } from "./+types/member.$memberId.category.$category";
import * as React from "react";
import { Link, redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { Navigation } from "~/components/navigation";
import { RecordTypeCard } from "~/components/record-type-card";
import { AddCard } from "~/components/ui/interactive-card";
import { PageHeader } from "~/components/ui/layout";
import { mockFamilyMembers, mockRecordTypes, type FamilyMember } from "~/lib/utils";

export function meta({ params }: Route.MetaArgs) {
  const member = mockFamilyMembers.find(m => m.id === params.memberId);
  const category = decodeURIComponent(params.category);
  return [
    { title: `${member?.name || 'Member'} - ${category} Records - Kimmy App` },
    { name: "description", content: `Manage ${member?.name || 'family member'}'s ${category.toLowerCase()} records` },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const member = mockFamilyMembers.find(m => m.id === params.memberId);
  const category = decodeURIComponent(params.category);
  
  if (!member || !mockRecordTypes[category]) {
    throw redirect("/");
  }
  
  const recordTypes = mockRecordTypes[category] || [];
  return { member, category, recordTypes };
}

const CategoryRecordTypes: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const { member, category, recordTypes } = loaderData;

  return (
    <PageLayout>
      <Navigation
        currentView="record-types"
        member={member}
        category={category}
      />
      
      <PageHeader
        title={`${member.name} - ${category}`}
        subtitle="Choose a record type to create a new record"
      />

      <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2">
        {recordTypes.map((recordType) => (
          <Link 
            key={recordType.id} 
            to={`/member/${member.id}/category/${encodeURIComponent(category)}/record/${recordType.id}`}
          >
            <RecordTypeCard 
              recordType={recordType} 
              onSelect={() => {}} 
            />
          </Link>
        ))}
        <AddCard 
          title="Add Record Type"
          description={`Create a new ${category.toLowerCase()} record type`}
        />
      </div>
    </PageLayout>
  );
};

export default CategoryRecordTypes;