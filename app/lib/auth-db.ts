/**
 * Database-backed authentication system
 * Replaces the mock authentication with real database operations
 */

import { authDb, userDb, familyDb } from './db';

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
  currentFamilyId: string;
  role: 'admin' | 'member';
  expiresAt: Date;
}

export const sessionStorage = {
  setToken(token: SessionToken): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('kimmy_auth_token', JSON.stringify(token));
    }
  },

  getToken(): SessionToken | null {
    if (typeof window === 'undefined') return null;
    
    const stored = window.sessionStorage.getItem('kimmy_auth_token');
    if (!stored) return null;
    
    try {
      const token = JSON.parse(stored);
      // Check if token is expired
      if (new Date(token.expiresAt) <= new Date()) {
        this.clearToken();
        return null;
      }
      return token;
    } catch {
      this.clearToken();
      return null;
    }
  },

  setSessionData(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('kimmy_auth_session', JSON.stringify(session));
    }
  },

  getSessionData(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    
    const stored = window.sessionStorage.getItem('kimmy_auth_session');
    if (!stored) return null;
    
    try {
      const session = JSON.parse(stored);
      // Check if session is expired
      if (new Date(session.expiresAt) <= new Date()) {
        this.clearToken();
        return null;
      }
      return session;
    } catch {
      this.clearToken();
      return null;
    }
  },

  clearToken(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('kimmy_auth_token');
      window.sessionStorage.removeItem('kimmy_auth_session');
    }
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const session = this.getSessionData();
    return !!(token && session);
  },
};

/**
 * Database-backed authentication API
 * Updated to work with the correct database utility pattern
 */
export function createAuthAPI(env: any) {
  return {
    async login(email: string, password: string): Promise<AuthSession> {
      console.log('🔐 Attempting login for:', email.trim());
      
      if (!env?.DB) {
        throw new Error('Database not available');
      }
      
      const user = await authDb.authenticateUser(env, email.trim(), password.trim());
      
      if (!user) {
        console.log('❌ Authentication failed');
        throw new Error('Invalid credentials');
      }

      console.log('✅ Authentication successful for user:', user.name);

      const token: SessionToken = {
        token: `token_${Date.now()}_${Math.random()}`,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      const session: AuthSession = {
        token: token.token,
        userId: user.id,
        email: user.email,
        name: user.name,
        currentFamilyId: user.familyId,
        role: user.role === 'admin' ? 'admin' : 'member',
        expiresAt: token.expiresAt,
      };

      // Store in session storage
      sessionStorage.setToken(token);
      sessionStorage.setSessionData(session);

      console.log('💾 Session stored, family ID:', session.currentFamilyId);
      return session;
    },

    async createAccount(userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }): Promise<AuthSession> {
      console.log('👤 Creating new account for:', userData.email);
      
      if (!env?.DB) {
        throw new Error('Database not available');
      }
      
      // Check if user already exists
      const existingUser = await userDb.findByEmail(env, userData.email);
      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Create user with their own family
      const { user, familyId } = await authDb.createUserWithFamily(env, {
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        password: userData.password,
      });

      console.log('✅ Account created, family ID:', familyId);

      // Auto-login the new user
      return await this.login(userData.email, userData.password);
    },

    async createHousehold(householdData: {
      name: string;
      adminFirstName: string;
      adminLastName: string;
      adminEmail: string;
    }): Promise<AuthSession> {
      console.log('🏠 Creating household:', householdData.name);
      
      if (!env?.DB) {
        throw new Error('Database not available');
      }
      
      // This endpoint assumes the user is already created but needs a family
      const existingUser = await userDb.findByEmail(env, householdData.adminEmail);
      if (!existingUser) {
        throw new Error('User account not found');
      }

      // Create new family for the user
      const familyId = await familyDb.generateFamilyId();
      
      // Update the user's family ID and role
      await userDb.updateRole(env, existingUser.id, 'admin');
      
      // Note: In a real implementation, we'd update the familyId too
      // For now, we'll create a new user record with the correct family
      const updatedUser = await userDb.create(env, {
        name: `${householdData.adminFirstName} ${householdData.adminLastName}`,
        email: existingUser.email,
        password: 'migrated', // Placeholder
        familyId,
        role: 'admin',
        relationshipToAdmin: 'self',
      });

      console.log('✅ Household created, family ID:', familyId);

      // Return updated session
      const token: SessionToken = {
        token: `token_${Date.now()}_${Math.random()}`,
        userId: updatedUser.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const session: AuthSession = {
        token: token.token,
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        currentFamilyId: familyId,
        role: 'admin',
        expiresAt: token.expiresAt,
      };

      sessionStorage.setToken(token);
      sessionStorage.setSessionData(session);

      return session;
    },

    async logout(): Promise<void> {
      console.log('👋 Logging out');
      sessionStorage.clearToken();
    },

    async getCurrentSession(): Promise<AuthSession | null> {
      return sessionStorage.getSessionData();
    },

    async validateSession(token: string): Promise<boolean> {
      const session = sessionStorage.getSessionData();
      const tokenData = sessionStorage.getToken();
      
      return !!(session && tokenData && tokenData.token === token);
    },
  };
}