import type { Route } from "./+types/onboarding";
import * as React from "react";
import { Link } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { UserPlus, Home, ArrowRight } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Get Started - Kimmy App" },
    { name: "description", content: "Create your account and set up your household" },
  ];
}

const Onboarding: React.FC<Route.ComponentProps> = () => {
  return (
    <PageLayout>
      <PageHeader
        title="Welcome to Kimmy App"
        subtitle="Let's get you set up with your family records"
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <p className="text-lg text-slate-300">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Account Card */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/25">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-100">Create Account</CardTitle>
              <CardDescription className="text-slate-400">
                Start by creating your personal account
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-500 mb-6">
                Set up your login credentials and personal information
              </p>
              <Link to="/onboarding/create-account">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Create Household Card */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/25">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-100">Create Household</CardTitle>
              <CardDescription className="text-slate-400">
                Set up your family or household
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-500 mb-6">
                Create a household and become the administrator
              </p>
              <Link to="/onboarding/create-household">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
                  Create Household
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Existing User Section */}
        <div className="text-center pt-8 border-t border-slate-700">
          <p className="text-slate-400 mb-4">
            Already have an account?
          </p>
          <Link to="/login">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default Onboarding;