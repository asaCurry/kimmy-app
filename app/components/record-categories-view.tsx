import * as React from "react";
import { PageHeader } from "~/components/ui/layout";
import { CategoryCard } from "~/components/category-card";
import { AddCard } from "~/components/ui/interactive-card";
import { mockRecordTypes, type FamilyMember } from "~/lib/utils";

interface RecordCategoriesViewProps {
  member: FamilyMember;
  onBack: () => void;
  onSelectCategory: (category: string) => void;
}

export const RecordCategoriesView: React.FC<RecordCategoriesViewProps> = ({ 
  member, 
  onBack, 
  onSelectCategory 
}) => {
  const categories = Object.keys(mockRecordTypes);

  return (
    <div>
      <PageHeader
        title={`${member.name}'s Records`}
        subtitle="Choose a category to view or add records"
      />

      <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard 
            key={category} 
            category={category} 
            recordCount={mockRecordTypes[category].length}
            onSelect={() => onSelectCategory(category)} 
          />
        ))}
        <AddCard 
          title="Add Category"
          description="Create a new record type category"
        />
      </div>
    </div>
  );
};