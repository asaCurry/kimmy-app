/**
 * Database-backed authentication system
 * Replaces the mock authentication with real database operations
 */

import { authDb, userDb, familyDb } from './db';
import { isDatabaseAvailable } from './utils';

// Session management (unchanged for session storage)
export interface SessionToken {
  token: string;
  userId: number;
  expiresAt: Date;
}

export interface AuthSession {
  token: string;
  userId: number;
  email: string;
  name: string;
  currentHouseholdId?: string; // Optional - users might not have a household yet
  role: 'admin' | 'member';
  expiresAt: Date;
}

export const sessionStorage = {
  setToken(token: SessionToken): void {
    if (typeof window !== 'undefined') {
      // Validate token before storing
      if (token.expiresAt && new Date(token.expiresAt) <= new Date()) {
        return;
      }
      window.sessionStorage.setItem('kimmy_auth_token', JSON.stringify(token));
    }
  },

  getToken(): SessionToken | null {
    if (typeof window !== 'undefined') {
      try {
        const tokenData = window.sessionStorage.getItem('kimmy_auth_token');
        if (tokenData) {
          const token = JSON.parse(tokenData);
          // Check if token is expired
          if (token.expiresAt && new Date(token.expiresAt) <= new Date()) {
            this.clearToken();
            return null;
          }
          return token;
        }
      } catch (error) {
        // Clear invalid token data
        this.clearToken();
      }
    }
    return null;
  },

  clearToken(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('kimmy_auth_token');
    }
  },

  setSessionData(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      // Set session in sessionStorage for client-side access
      window.sessionStorage.setItem('kimmy_auth_session', JSON.stringify(session));
      
      // Also set as a cookie for server-side access
      document.cookie = `kimmy_auth_session=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=${Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)}`;
    }
  },

  getSessionData(): AuthSession | null {
    if (typeof window !== 'undefined') {
      try {
        const sessionData = window.sessionStorage.getItem('kimmy_auth_session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          // Check if session is expired
          if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
            this.clearSession();
            return null;
          }
          return session;
        }
      } catch (error) {
        // Clear invalid session data
        this.clearSession();
      }
    }
    return null;
  },

  clearSession(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('kimmy_auth_session');
      // Clear cookie
      document.cookie = 'kimmy_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },
};

// Authentication API functions
export const authApi = {
  async login(env: any, email: string, password: string): Promise<AuthSession | null> {
    if (!isDatabaseAvailable(env)) {
      throw new Error('Database not available');
    }

    try {
      const user = await authDb.authenticateUser(env, email, password);
      if (!user) return null;

      // Create session
      const session: AuthSession = {
        token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        email: user.email,
        name: user.name,
        currentHouseholdId: user.familyId || undefined, // Only set if user has a family
        role: user.role as 'admin' | 'member',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      return session;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  },

  async createAccount(env: any, userData: {
    name: string;
    email: string;
    password: string;
    familyName?: string;
  }): Promise<AuthSession | null> {
    if (!isDatabaseAvailable(env)) {
      throw new Error('Database not available');
    }

    try {
      const { user, familyId } = await authDb.createUserWithFamily(env, userData);

      // Create session
      const session: AuthSession = {
        token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        email: user.email,
        name: user.name,
        currentHouseholdId: familyId,
        role: 'admin',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      return session;
    } catch (error) {
      console.error('Account creation failed:', error);
      return null;
    }
  },

  async createHousehold(env: any, householdData: {
    name: string;
    adminFirstName: string;
    adminLastName: string;
  }): Promise<AuthSession | null> {
    if (!isDatabaseAvailable(env)) {
      throw new Error('Database not available');
    }

    try {
      // This would need to be implemented in the database layer
      // For now, we'll create a placeholder session
      const session: AuthSession = {
        token: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 1, // Placeholder - would come from actual user creation
        email: 'placeholder@email.com', // Placeholder
        name: `${householdData.adminFirstName} ${householdData.adminLastName}`,
        currentHouseholdId: `household_${Date.now()}`, // Placeholder
        role: 'admin',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      return session;
    } catch (error) {
      console.error('Household creation failed:', error);
      return null;
    }
  },

  async getSession(env: any, token: string): Promise<AuthSession | null> {
    if (!isDatabaseAvailable(env)) {
      throw new Error('Database not available');
    }

    try {
      // For now, we'll validate the token format and check if user exists
      // In a real implementation, you'd validate the token cryptographically
      const tokenParts = token.split('_');
      if (tokenParts.length !== 3 || tokenParts[0] !== 'session') {
        return null;
      }

      // Extract user ID from token (this is a simplified approach)
      // In production, you'd decode a JWT or similar
      const userId = parseInt(tokenParts[1]);
      if (isNaN(userId)) return null;

      const user = await userDb.findById(env, userId);
      if (!user) return null;

      // Return session data
      return {
        token,
        userId: user.id,
        email: user.email,
        name: user.name,
        currentHouseholdId: user.familyId,
        role: user.role as 'admin' | 'member',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Extend session
      };
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  },
};