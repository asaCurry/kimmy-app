import type { Route } from "./+types/home";
import * as React from "react";
import { Link } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { Button } from "~/components/ui/button";
import { MemberCard } from "~/components/member-card";
import { RequireAuth } from "~/contexts/auth-context";
import { mockFamilyMembers } from "~/lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Kimmy App - Family Records" },
    { name: "description", content: "Manage your family's records and notes" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: (context.cloudflare as any)?.env?.VALUE_FROM_CLOUDFLARE || "Default message" };
}

const Home: React.FC<Route.ComponentProps> = ({ loaderData }) => {
  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout>
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="mb-2 text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Kimmy App</h1>
          <p className="text-lg sm:text-xl text-slate-300">Choose a family member to view their records</p>
          <p className="text-sm text-slate-500 mt-2">{loaderData.message}</p>
        </div>

        {/* Quick Navigation */}
        <div className="mb-8 flex justify-center gap-4">
          <Link to="/manage">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Manage Household
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
          {mockFamilyMembers.map((member) => (
            <Link key={member.id} to={`/member/${member.id}`}>
              <MemberCard 
                member={member} 
                onSelect={() => {}} 
              />
            </Link>
          ))}
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default Home;

