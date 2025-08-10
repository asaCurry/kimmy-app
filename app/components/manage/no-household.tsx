import * as React from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { PageLayout } from "~/components/ui/layout";

export const NoHousehold: React.FC = () => {
  return (
    <PageLayout>
      <div className="text-center py-12">
        <div className="text-slate-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Household Found</h3>
        <p className="text-slate-400 mb-6">
          You need to create or join a household to manage members.
        </p>
        <Link to="/onboarding/create-household">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Create Household
          </Button>
        </Link>
      </div>
    </PageLayout>
  );
};
