/**
 * Authentication context and provider
 */

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import type { AuthSession } from '~/lib/types';
import { sessionStorage, authAPI } from '~/lib/auth';
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

  // Initialize auth state from session storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = sessionStorage.getToken();
        const storedSession = sessionStorage.getSessionData();
        
        if (storedToken && storedSession) {
          // Verify token is still valid
          const isValid = await authAPI.verifyToken(storedToken.token);
          if (isValid) {
            setSession(storedSession);
          } else {
            // Token is invalid, clear storage
            sessionStorage.clearToken();
          }
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
      const { token, session: newSession } = await authAPI.login(email, password);
      
      // Store in session storage
      sessionStorage.setToken(token);
      sessionStorage.setSessionData(newSession);
      
      // Update context state
      setSession(newSession);
    } catch (error) {
      throw error; // Re-throw for component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authAPI.logout();
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
    const storedToken = sessionStorage.getToken();
    if (!storedToken) {
      setSession(null);
      return;
    }

    try {
      const isValid = await authAPI.verifyToken(storedToken.token);
      if (!isValid) {
        setSession(null);
        sessionStorage.clearToken();
      }
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

  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  // Handle unauthenticated users
  useEffect(() => {
    if (!isLoading && !session && !fallback) {
      navigate('/welcome', { replace: true });
    }
  }, [isLoading, session, fallback, navigate]);

  if (!session) {
    if (fallback) {
      return fallback;
    }
    // Show loading while redirecting
    return <PageLoading message="Redirecting..." />;
  }

  if (requireHousehold && (!session.currentHouseholdId || session.households.length === 0)) {
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