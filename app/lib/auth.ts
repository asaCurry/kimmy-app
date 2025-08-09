/**
 * Authentication utilities and session management
 */

import type { AuthSession, User, HouseholdMember } from './types';

// Session storage keys
const SESSION_TOKEN_KEY = 'kimmy_session_token';
const SESSION_DATA_KEY = 'kimmy_session_data';

// Session token interface
export interface SessionToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

/**
 * Session Storage Management
 */
export const sessionStorage = {
  // Store session token
  setToken(token: SessionToken): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, JSON.stringify({
        ...token,
        expiresAt: token.expiresAt.toISOString()
      }));
    }
  },

  // Get session token
  getToken(): SessionToken | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      const token: SessionToken = {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt)
      };
      
      // Check if token is expired
      if (token.expiresAt < new Date()) {
        this.clearToken();
        return null;
      }
      
      return token;
    } catch {
      return null;
    }
  },

  // Store session data
  setSessionData(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_DATA_KEY, JSON.stringify(session));
    }
  },

  // Get session data
  getSessionData(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = window.sessionStorage.getItem(SESSION_DATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  // Clear all session data
  clearToken(): void {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
      window.sessionStorage.removeItem(SESSION_DATA_KEY);
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const session = this.getSessionData();
    return !!(token && session);
  }
};

/**
 * Mock Authentication API (replace with real API calls)
 */
export const authAPI = {
  // Login user
  async login(email: string, password: string): Promise<{ token: SessionToken; session: AuthSession }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user validation
    if (email === 'sarah.johnson@email.com' && password === 'password') {
      const token: SessionToken = {
        token: `token_${Date.now()}_${Math.random()}`,
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
      
      const session: AuthSession = {
        userId: 'user-1',
        email: 'sarah.johnson@email.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        currentHouseholdId: 'household-1',
        households: [
          {
            id: 'household-1',
            name: 'The Johnson Family',
            role: 'ADMIN',
          }
        ],
      };
      
      return { token, session };
    } else if (email === 'mike.johnson@email.com' && password === 'password') {
      const token: SessionToken = {
        token: `token_${Date.now()}_${Math.random()}`,
        userId: 'user-2',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      const session: AuthSession = {
        userId: 'user-2',
        email: 'mike.johnson@email.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        currentHouseholdId: 'household-1',
        households: [
          {
            id: 'household-1',
            name: 'The Johnson Family',
            role: 'MEMBER',
          }
        ],
      };
      
      return { token, session };
    }
    
    throw new Error('Invalid credentials');
  },

  // Create account
  async createAccount(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }): Promise<{ token: SessionToken; session: AuthSession }> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock account creation
    const userId = `user-${Date.now()}`;
    const token: SessionToken = {
      token: `token_${Date.now()}_${Math.random()}`,
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    
    const session: AuthSession = {
      userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      households: [], // No households yet
    };
    
    return { token, session };
  },

  // Create household
  async createHousehold(householdData: {
    name: string;
    adminFirstName: string;
    adminLastName: string;
  }): Promise<AuthSession> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const householdId = `household-${Date.now()}`;
    const currentSession = sessionStorage.getSessionData();
    
    if (!currentSession) {
      throw new Error('No active session');
    }
    
    // Update session with new household
    const updatedSession: AuthSession = {
      ...currentSession,
      currentHouseholdId: householdId,
      households: [
        ...currentSession.households,
        {
          id: householdId,
          name: householdData.name,
          role: 'ADMIN',
        }
      ],
    };
    
    return updatedSession;
  },

  // Logout
  async logout(): Promise<void> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // Clear session storage
    sessionStorage.clearToken();
  },

  // Verify token (check if still valid)
  async verifyToken(token: string): Promise<boolean> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock verification - in real app, this would hit the server
    const storedToken = sessionStorage.getToken();
    return !!(storedToken && storedToken.token === token);
  }
};

/**
 * Helper functions
 */

// Check if user belongs to a specific household
export function userBelongsToHousehold(session: AuthSession | null, householdId: string): boolean {
  if (!session) return false;
  return session.households.some(h => h.id === householdId);
}

// Get user's role in a specific household
export function getUserRoleInHousehold(session: AuthSession | null, householdId: string): 'ADMIN' | 'MEMBER' | null {
  if (!session) return null;
  const household = session.households.find(h => h.id === householdId);
  return household?.role || null;
}

// Check if user is admin of any household
export function isUserAdmin(session: AuthSession | null): boolean {
  if (!session) return false;
  return session.households.some(h => h.role === 'ADMIN');
}

// Check if user is admin of specific household
export function isUserAdminOfHousehold(session: AuthSession | null, householdId: string): boolean {
  if (!session) return false;
  const household = session.households.find(h => h.id === householdId);
  return household?.role === 'ADMIN';
}

// Generate demo credentials message
export function getDemoCredentials(): { email: string; password: string }[] {
  return [
    { email: 'sarah.johnson@email.com', password: 'password' },
    { email: 'mike.johnson@email.com', password: 'password' }
  ];
}