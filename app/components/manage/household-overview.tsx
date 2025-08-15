import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { Navigation } from "~/components/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, UserPlus, Settings, Users, Home, Plus } from "lucide-react";
import type { Householdmember } from "~/lib/utils";
import { MemberCard } from "./member-card";

interface HouseholdOverviewProps {
  householdMembers: Householdmember[];
}

export const HouseholdOverview: React.FC<HouseholdOverviewProps> = ({
  householdMembers,
}) => {
  const adminMembers = householdMembers.filter(m => m.role === "admin");
  const regularMembers = householdMembers.filter(
    m => m.role === "member" && !m.age
  );
  const children = householdMembers.filter(m => m.role === "member" && m.age);

  if (householdMembers.length === 0) {
    return (
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-200 mb-6">
          Household Overview
        </h2>
        <div className="text-center py-16 px-4">
          <div className="text-slate-400 mb-6">
            <svg
              className="w-20 h-20 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">
            No Household members Yet
          </h3>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Get started by adding your first household member to begin managing
            your household.
          </p>
          <Link to="/manage/add-member">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg">
              Add Household member
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-200 mb-6">
        Household Overview
      </h2>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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
