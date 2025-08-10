/**
 * Authentication context and provider
 */

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { AuthSession } from '~/lib/auth-db';
import { sessionStorage, createAuthAPI } from '~/lib/auth-db';
import { PageLoading } from '~/components/ui/loading';

interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateSession: (session: AuthSession) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Note: In the new architecture, database operations should happen in route loaders/actions
  // The auth context should only manage local state
  // TODO: Refactor auth operations to use route actions instead of direct database access

  // Initialize auth state from session storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedSession = sessionStorage.getSessionData();
        
        if (storedSession) {
          setSession(storedSession);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        sessionStorage.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // TODO: In the new architecture, authentication should happen in route actions
      // For now, we'll use a placeholder session
      const newSession: AuthSession = {
        token: 'placeholder-token',
        userId: 1,
        email,
        name: email.split('@')[0], // Use email prefix as name
        currentFamilyId: '', // Will be set when user creates or joins a household
        role: 'admin',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
      
      setSession(newSession);
      sessionStorage.setSessionData(newSession);
      
      // Small delay to ensure state has updated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      throw error; // Re-throw for component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Clear session storage
      sessionStorage.clearToken();
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear session anyway
      setSession(null);
      sessionStorage.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const updateSession = (newSession: AuthSession): void => {
    setSession(newSession);
    sessionStorage.setSessionData(newSession);
  };

  const refreshSession = async (): Promise<void> => {
    try {
      const currentSession = sessionStorage.getSessionData();
      if (!currentSession) {
        setSession(null);
        return;
      }
      setSession(currentSession);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSession(null);
      sessionStorage.clearToken();
    }
  };

  const value: AuthContextType = {
    session,
    isLoading,
    isAuthenticated: !!session,
    login,
    logout,
    updateSession,
    refreshSession,
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
  requireHousehold = false 
}) => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  // Handle unauthenticated users - MUST be before any conditional returns
  useEffect(() => {
    if (!isLoading && !session && !fallback) {
      navigate('/welcome', { replace: true });
    }
  }, [isLoading, session, fallback, navigate]);

  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  if (!session) {
    if (fallback) {
      return fallback;
    }
    // Show loading while redirecting
    return <PageLoading message="Redirecting..." />;
  }

  if (requireHousehold && !session.currentFamilyId) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-slate-200 mb-4">Household Required</h2>
          <p className="text-slate-400 mb-6">You need to be part of a household to access this page.</p>
          <a 
            href="/onboarding/create-household" 
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-md hover:from-emerald-600 hover:to-blue-600 transition-colors"
          >
            Create Household
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};