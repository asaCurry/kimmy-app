import * as React from "react";
import { Link } from "react-router";
import { IconCard } from "~/components/ui/interactive-card";
import { Button } from "~/components/ui/button";
import { UserPlus, Key, Settings, RefreshCw } from "lucide-react";
import type { Householdmember } from "~/lib/utils";

interface QuickActionsProps {
  currentHouseholdId: string | undefined;
  isLoadingMembers: boolean;
  onRefresh: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  currentHouseholdId,
  isLoadingMembers,
  onRefresh,
}) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-200">Quick Actions</h2>
        <Button
          onClick={onRefresh}
          disabled={isLoadingMembers}
          variant="outline"
          size="sm"
          className="text-slate-300 border-slate-600 hover:bg-slate-700"
        >
          {isLoadingMembers ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-300"></div>
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/manage/add-member">
          <IconCard
            icon={
              <div className="text-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            }
            title="Add Member"
            description="Add a new household member or child"
            showChevron={true}
            className="hover:scale-105 transition-transform duration-200"
          />
        </Link>

        <IconCard
          icon={
            <div className="text-2xl bg-gradient-to-r from-emerald-500 to-blue-500 p-2 rounded-lg">
              <Key className="h-6 w-6 text-white" />
            </div>
          }
          title="Invite Code"
          description="Share your household invite code"
          showChevron={true}
          className="hover:scale-105 transition-transform duration-200"
          onClick={() => {
            // Scroll to invite code manager section
            const inviteSection = document.querySelector('[data-section="invite-code"]');
            if (inviteSection) {
              inviteSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />

        <IconCard
          icon={
            <div className="text-2xl bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
          }
          title="Settings"
          description="Manage household settings"
          showChevron={true}
          className="hover:scale-105 transition-transform duration-200"
        />
      </div>
    </section>
  );
};
