/**
 * App footer with logout and additional navigation
 */

import * as React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogOut, Shield, Heart, ExternalLink, Settings } from "lucide-react";
import { Button } from "./button";
import { useAuth } from "~/contexts/auth-context";
import { cn } from "~/lib/utils";

interface AppFooterProps {
  className?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({ className }) => {
  const { session, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Call logout with navigation callback to redirect to login
      logout(() => navigate("/login"));
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <footer
      className={cn(
        "border-t border-slate-700 bg-slate-900/50 backdrop-blur",
        className
      )}
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-4">
          {/* App Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200">
                Hey, Kimmy
              </h3>
            </div>
            <p className="text-sm text-slate-400">
              Securely manage your family's records and information in one
              place.
            </p>
            {session?.currentHouseholdId && (
              <div className="text-xs text-slate-400">
                Household ID: {session.currentHouseholdId}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">
              Quick Links
            </h4>
            <nav className="space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/"
                    className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/manage"
                    className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Manage Household
                  </Link>
                  <Link
                    to="/manage/add-member"
                    className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Add Member
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/welcome"
                    className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Welcome
                  </Link>
                  <Link
                    to="/login"
                    className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/onboarding"
                    className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Support & Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Support</h4>
            <nav className="space-y-2">
              <a
                href="#"
                className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Help Center
              </a>
              <a
                href="#"
                className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="block text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="flex items-center text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                Contact Us
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </nav>
          </div>

          {/* Account Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Account</h4>
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-slate-300 font-medium">{session?.name}</p>
                  <p className="text-slate-500">{session?.email}</p>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Signing Out..." : "Sign Out"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/onboarding">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span>© 2024 Hey, Kimmy</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center">
              Made with <Heart className="mx-1 h-3 w-3 text-red-400" /> for
              families
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>Secure & Private</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
