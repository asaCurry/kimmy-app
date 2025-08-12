/**
 * App header with logo/home icon and navigation
 */

import * as React from "react";
import { useState } from "react";
import { Link } from "react-router";
import { Home, Users, Plus, Settings, Bell, User, Menu, X } from "lucide-react";
import { Button } from "./button";
import { useAuth } from "~/contexts/auth-context";
import { cn } from "~/lib/utils";

interface AppHeaderProps {
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ className }) => {
  const { session, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-slate-700 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/75",
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        {/* Logo/Home Section */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:from-blue-600 group-hover:to-purple-700 transition-all">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Hey, Kimmy
              </h1>
              {session?.currentHouseholdId && (
                <div className="text-xs text-slate-400">
                  Household ID: {session.currentHouseholdId}
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation - Only show when authenticated */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-2">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/manage">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Users className="mr-2 h-4 w-4" />
                Manage
              </Button>
            </Link>
            <Link to="/manage/add-member">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </Link>
          </nav>
        )}

        {/* User Section */}
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              {/* Mobile navigation menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* User info */}
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <div className="text-right">
                  <p className="text-slate-300 font-medium">{session?.name}</p>
                  <p className="text-slate-500 text-xs">
                    Role: {session?.role}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </header>
  );
};

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useAuth();

  if (!isOpen || !isAuthenticated) return null;

  return (
    <div className="md:hidden border-b border-slate-700 bg-slate-900">
      <nav className="container mx-auto px-4 py-4 space-y-2">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Home className="h-5 w-5 text-slate-400" />
          <span className="text-slate-300">Home</span>
        </Link>
        <Link
          to="/manage"
          onClick={onClose}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Users className="h-5 w-5 text-slate-400" />
          <span className="text-slate-300">Manage Household</span>
        </Link>
        <Link
          to="/manage/add-member"
          onClick={onClose}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-5 w-5 text-slate-400" />
          <span className="text-slate-300">Add Member</span>
        </Link>
      </nav>
    </div>
  );
};
