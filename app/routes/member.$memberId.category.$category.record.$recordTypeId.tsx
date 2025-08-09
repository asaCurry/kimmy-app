import type { Route } from "./+types/member.$memberId.category.$category.record.$recordTypeId";
import * as React from "react";
import { redirect, useNavigate } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { Navigation } from "~/components/navigation";
import { DynamicRecordForm } from "~/components/dynamic-record-form";
import { mockFamilyMembers, mockRecordTypes, type FamilyMember, type RecordType } from "~/lib/utils";

export function meta({ params }: Route.MetaArgs) {
  const member = mockFamilyMembers.find(m => m.id === params.memberId);
  const category = decodeURIComponent(params.category);
  const recordTypes = mockRecordTypes[category] || [];
  const recordType = recordTypes.find(rt => rt.id === params.recordTypeId);
  
  return [
    { title: `New ${recordType?.name || 'Record'} for ${member?.name || 'Member'} - Kimmy App` },
    { name: "description", content: `Create a new ${recordType?.name || 'record'} for ${member?.name || 'family member'}` },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const member = mockFamilyMembers.find(m => m.id === params.memberId);
  const category = decodeURIComponent(params.category);
  const recordTypes = mockRecordTypes[category] || [];
  const recordType = recordTypes.find(rt => rt.id === params.recordTypeId);
  
  if (!member || !recordType) {
    throw redirect("/");
  }
  
  return { member, category, recordType };
}

const RecordForm: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const { member, category, recordType } = loaderData;
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/member/${member.id}/category/${encodeURIComponent(category)}`);
  };

  return (
    <PageLayout maxWidth="2xl">
      <Navigation
        currentView="form"
        member={member}
        category={category}
        recordType={recordType}
      />
      
      <DynamicRecordForm 
        member={member} 
        recordType={recordType} 
        onBack={handleBack} 
      />
    </PageLayout>
  );
};

export default RecordForm;