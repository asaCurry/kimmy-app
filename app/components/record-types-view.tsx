import * as React from "react";
import { PageHeader } from "~/components/ui/layout";
import { RecordTypeCard } from "~/components/record-type-card";
import { AddCard } from "~/components/ui/interactive-card";
import { mockRecordTypes, type FamilyMember, type RecordType } from "~/lib/utils";

interface RecordTypesViewProps {
  member: FamilyMember;
  category: string;
  onBack: () => void;
  onSelectRecordType: (recordType: RecordType) => void;
}

export const RecordTypesView: React.FC<RecordTypesViewProps> = ({ 
  member, 
  category, 
  onBack, 
  onSelectRecordType 
}) => {
  const recordTypes = mockRecordTypes[category] || [];

  return (
    <div>
      <PageHeader
        title={`${member.name} - ${category}`}
        subtitle="Choose a record type to create a new record"
      />

      <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2">
        {recordTypes.map((recordType) => (
          <RecordTypeCard 
            key={recordType.id} 
            recordType={recordType} 
            onSelect={() => onSelectRecordType(recordType)} 
          />
        ))}
        <AddCard 
          title="Add Record Type"
          description={`Create a new ${category.toLowerCase()} record type`}
        />
      </div>
    </div>
  );
};