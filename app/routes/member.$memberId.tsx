import type { Route } from "./+types/member.$memberId";
import * as React from "react";
import { Link, redirect } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { Navigation } from "~/components/navigation";
import { CategoryCard } from "~/components/category-card";
import { AddCard } from "~/components/ui/interactive-card";
import { PageHeader } from "~/components/ui/layout";
import { mockFamilyMembers, mockRecordTypes, type FamilyMember } from "~/lib/utils";

export function meta({ params }: Route.MetaArgs) {
  const member = mockFamilyMembers.find(m => m.id === params.memberId);
  return [
    { title: `${member?.name || 'Member'} Records - Kimmy App` },
    { name: "description", content: `Manage ${member?.name || 'family member'}'s records and notes` },
  ];
}

export function loader({ params }: Route.LoaderArgs) {
  const member = mockFamilyMembers.find(m => m.id === params.memberId);
  if (!member) {
    throw redirect("/");
  }
  return { member };
}

const MemberCategories: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  const { member } = loaderData;
  const categories = Object.keys(mockRecordTypes);

  return (
    <PageLayout>
      <Navigation
        currentView="categories"
        member={member}
      />
      
      <PageHeader
        title={`${member.name}'s Records`}
        subtitle="Choose a category to view or add records"
      />

      <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link key={category} to={`/member/${member.id}/category/${encodeURIComponent(category)}`}>
            <CategoryCard 
              category={category} 
              recordCount={mockRecordTypes[category].length}
              onSelect={() => {}} 
            />
          </Link>
        ))}
        <AddCard 
          title="Add Category"
          description="Create a new record type category"
        />
      </div>
    </PageLayout>
  );
};

export default MemberCategories;