import type { Route } from "./+types/welcome";
import * as React from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { PageLayout } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { LogIn, UserPlus, Home, ArrowRight } from "lucide-react";
import { useAuth } from "~/contexts/auth-context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Welcome to Hey, Kimmy" },
    {
      name: "description",
      content: "Manage your household's records records and notes",
    },
  ];
}

const Welcome: React.FC<Route.ComponentProps> = () => {
  const { isAuthenticated, isLoading, session, logout } = useAuth();
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    if (isAuthenticated && session) {
      if (session.currentHouseholdId) {
        navigate(`/member/${session.currentHouseholdId}`);
      } else {
        navigate("/onboarding/create-account");
      }
    }
  }, [isAuthenticated, session, navigate]);

  const handleClearSession = () => {
    logout(() => navigate("/login"));
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (isAuthenticated && session) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Redirecting...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showFooter={false}>
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="mb-6 text-4xl sm:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to Hey, Kimmy
          </h1>
          <p className="text-xl sm:text-2xl text-slate-300 mb-4">
            The simple way to manage your household's records records
          </p>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Keep track of medical appointments, school events, achievements, and
            more. Share information securely with your household members.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-8 md:grid-cols-2 max-w-2xl mx-auto mb-12">
          {/* Sign In Card */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/25">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <LogIn className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-100">Sign In</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-400 mb-6">
                Already have an account? Sign in to access your household
                records.
              </p>
              <Link to="/login">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Get Started Card */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/25">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-100">
                Get Started
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-400 mb-6">
                New to Hey, Kimmy? Create your account and set up your
                household.
              </p>
              <Link to="/onboarding">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-3 text-left">
          <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Home className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Household Management
            </h3>
            <p className="text-slate-400">
              Create households and manage household members with role-based
              permissions.
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Flexible Records
            </h3>
            <p className="text-slate-400">
              Track health records, school events, achievements, and custom
              record types.
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Privacy Control
            </h3>
            <p className="text-slate-400">
              Keep records visible to the household or mark them private when
              needed.
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⏱️</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Activity Trackers
            </h3>
            <p className="text-slate-400">
              Monitor time, track progress, and log activities across your household.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Welcome;
