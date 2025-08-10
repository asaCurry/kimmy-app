import * as React from "react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Users } from "lucide-react";
import type { FamilyMember } from "~/lib/utils";
import { MemberCard } from "./member-card";

interface HouseholdOverviewProps {
  householdMembers: FamilyMember[];
}

export const HouseholdOverview: React.FC<HouseholdOverviewProps> = ({ householdMembers }) => {
  const adminMembers = householdMembers.filter(m => m.role === 'admin');
  const regularMembers = householdMembers.filter(m => m.role === 'member' && !m.age);
  const children = householdMembers.filter(m => m.role === 'member' && m.age);

  if (householdMembers.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Household Overview</h2>
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Family Members Yet</h3>
          <p className="text-slate-400 mb-6">
            Get started by adding your first family member.
          </p>
          <Link to="/manage/add-member">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105">
              Add Family Member
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-200 mb-4">Household Overview</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <MemberCard
          title="Administrators"
          members={adminMembers}
          iconColor="text-blue-400"
          badgeColor="bg-blue-500/20 text-blue-400"
          badgeText="ADMIN"
          emptyMessage="No administrators yet"
        />
        
        <MemberCard
          title="Members"
          members={regularMembers}
          iconColor="text-emerald-400"
          badgeColor="bg-emerald-500/20 text-emerald-400"
          badgeText="MEMBER"
          emptyMessage="No adult members yet"
        />
        
        <MemberCard
          title="Children"
          members={children}
          iconColor="text-purple-400"
          badgeColor="bg-purple-500/20 text-purple-400"
          badgeText="CHILD"
          emptyMessage="No children added yet"
          showAge={true}
        />
      </div>
    </section>
  );
};
