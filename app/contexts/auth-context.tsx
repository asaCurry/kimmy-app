/**
 * Authentication context and provider
 */

import * as React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { PageLoading } from "~/components/ui/loading";
import { authApi, type AuthSession, sessionStorage } from "~/lib/auth-db";

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: (navigate?: () => void) => void;
  updateSession: (session: AuthSession) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First try to get session from sessionStorage
        let storedSession = sessionStorage.getSessionData();

        // If no session in storage, try to get from cookies
        if (!storedSession) {
          const cookies = document.cookie.split(";").reduce(
            (acc, cookie) => {
              const [key, value] = cookie.trim().split("=");
              if (key && value) {
                acc[key] = value;
              }
              return acc;
            },
            {} as Record<string, string>
          );

          const sessionData = cookies["kimmy_auth_session"];
          if (sessionData) {
            try {
              storedSession = JSON.parse(decodeURIComponent(sessionData));
              // Also save to sessionStorage for consistency
              if (storedSession) {
                sessionStorage.setSessionData(storedSession);
              }
            } catch (error) {
              console.error("Failed to parse session from cookie:", error);
            }
          }
        }

        if (storedSession) {
          // Check if session is expired
          if (
            storedSession.expiresAt &&
            new Date(storedSession.expiresAt) <= new Date()
          ) {
            sessionStorage.clearSession();
            // Clear cookie as well
            document.cookie =
              "kimmy_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setSession(null);
            setIsAuthenticated(false);
          } else {
            setSession(storedSession);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        // Clear invalid session data
        sessionStorage.clearSession();
        document.cookie =
          "kimmy_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setSession(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const updateSession = (newSession: AuthSession) => {
    setSession(newSession);
    setIsAuthenticated(true);
    sessionStorage.setSessionData(newSession);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Use the new authApi pattern
      const session = await authApi.login({}, email, password);
      if (session) {
        updateSession(session);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = (navigate?: () => void) => {
    // Clear all session data
    setSession(null);
    setIsAuthenticated(false);
    sessionStorage.clearSession();

    // Clear cookie as well
    document.cookie =
      "kimmy_auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Navigate to login page if callback provided
    if (navigate) {
      navigate();
    }
  };

  const value: AuthContextType = {
    session,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Higher-order component for route protection
interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireHousehold?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  fallback,
  requireHousehold = false,
}) => {
  const { session, isLoading } = useAuth();

  // Handle unauthenticated users - redirect to login
  if (!isLoading && !session) {
    if (fallback) {
      return fallback;
    }
    // Redirect to login page
    window.location.href = "/login";
    return <PageLoading message="Redirecting to login..." />;
  }

  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  if (requireHousehold && !session?.currentHouseholdId) {
    return (
      fallback || (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">
              Household Required
            </h2>
            <p className="text-slate-400 mb-6">
              You need to be part of a household to access this page.
            </p>
            <a
              href="/onboarding/create-account"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-md hover:from-emerald-600 hover:to-blue-600 transition-colors"
            >
              Create Account & Household
            </a>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
};
