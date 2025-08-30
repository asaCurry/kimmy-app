/**
 * Database-backed authentication system
 * Replaces the mock authentication with real database operations
 */

import { authDb, userDb, householdDb } from "./db";
import { isDatabaseAvailable } from "./utils";
import { inviteCodeDb } from "./db";
import { generateSessionToken } from "./token-utils";
import { createSecureToken, verifySecureToken, type SecureSessionData } from "./secure-session";
import { authLogger } from "./logger";

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
  role: "admin" | "member";
  admin: number; // Database field for admin debug privileges (0 = false, 1 = true)
  expiresAt: Date;
}

export const sessionStorage = {
  setToken(token: SessionToken): void {
    if (typeof window !== "undefined") {
      // Validate token before storing
      if (token.expiresAt && new Date(token.expiresAt) <= new Date()) {
        return;
      }
      window.sessionStorage.setItem("kimmy_auth_token", JSON.stringify(token));
    }
  },

  getToken(): SessionToken | null {
    if (typeof window !== "undefined") {
      try {
        const tokenData = window.sessionStorage.getItem("kimmy_auth_token");
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
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("kimmy_auth_token");
    }
  },

  setSessionData(session: AuthSession): void {
    if (typeof window !== "undefined") {
      // Set session in sessionStorage for client-side access (temporary - will be removed)
      window.sessionStorage.setItem(
        "kimmy_auth_session",
        JSON.stringify(session)
      );

      // Set secure HTTP-only cookie for server-side access
      const maxAge = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
      const isSecure = window.location.protocol === 'https:';
      
      document.cookie = [
        `kimmy_auth_session=${encodeURIComponent(JSON.stringify(session))}`,
        'path=/',
        `max-age=${maxAge}`,
        isSecure ? 'Secure' : '', // Only set Secure flag over HTTPS
        'SameSite=Strict', // CSRF protection
        // Note: HttpOnly cannot be set from JavaScript, needs server-side implementation
      ].filter(Boolean).join('; ');
    }
  },

  getSessionData(): AuthSession | null {
    if (typeof window !== "undefined") {
      try {
        const sessionData = window.sessionStorage.getItem("kimmy_auth_session");
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
    if (typeof window !== "undefined") {
      // Clear sessionStorage
      window.sessionStorage.removeItem("kimmy_auth_session");

      // Clear all possible cookie variations with different attributes
      const cookieNames = [
        "kimmy_auth_session",
        "kimmy_auth_session=",
        "kimmy_auth_session=;",
      ];

      cookieNames.forEach(cookieName => {
        // Clear with different path and domain combinations
        document.cookie = `${cookieName}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${cookieName}; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `${cookieName}; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });

      // Also try to clear with Max-Age=0
      document.cookie = "kimmy_auth_session=; path=/; Max-Age=0";
    }
  },
};

// Authentication API functions
export const authApi = {
  async login(
    env: any,
    email: string,
    password: string
  ): Promise<AuthSession | null> {
    authLogger.info("Login attempt", { email: email.replace(/(.{2}).*@/, "$1***@") });

    if (!isDatabaseAvailable(env)) {
      authLogger.error("Database not available during login");
      throw new Error("Database not available");
    }

    try {
      const user = await authDb.authenticateUser(env, email, password);

      if (!user) {
        authLogger.warn("Authentication failed - invalid credentials", { email: email.replace(/(.{2}).*@/, "$1***@") });
        return null;
      }

      // Create secure session using new token system
      const sessionSecret = env.SESSION_SECRET || 'dev-secret-change-in-production';
      const secureToken = await createSecureToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        currentHouseholdId: user.householdId || undefined,
        role: user.role as "admin" | "member"
      }, { secret: sessionSecret });

      const session: AuthSession = {
        token: secureToken,
        userId: user.id,
        email: user.email,
        name: user.name,
        currentHouseholdId: user.householdId || undefined,
        role: user.role as "admin" | "member",
        admin: user.admin || 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      authLogger.info("Login successful", { userId: user.id, householdId: user.householdId });
      return session;
    } catch (error) {
      authLogger.error("Login failed", { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  },

  async createAccount(
    env: any,
    userData: {
      name: string;
      email: string;
      password: string;
      householdName?: string;
    }
  ): Promise<AuthSession | null> {
    if (!isDatabaseAvailable(env)) {
      throw new Error("Database not available");
    }

    try {
      const { user, householdId } = await authDb.createUserWithHousehold(
        env,
        userData
      );

      // Create session
      const session: AuthSession = {
        token: generateSessionToken(),
        userId: user.id,
        email: user.email,
        name: user.name,
        currentHouseholdId: householdId,
        role: "admin",
        admin: user.admin || 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      return session;
    } catch (error) {
      console.error("Account creation failed:", error);
      return null;
    }
  },

  async joinHouseholdWithInviteCode(
    env: any,
    userData: {
      name: string;
      email: string;
      password: string;
      inviteCode: string;
    }
  ): Promise<AuthSession | null> {
    if (!isDatabaseAvailable(env)) {
      throw new Error("Database not available");
    }

    try {
      // Validate invite code format
      if (!inviteCodeDb.validateInviteCodeFormat(userData.inviteCode)) {
        throw new Error("Invalid invite code format");
      }

      // Find household by invite code
      const household = await inviteCodeDb.getHouseholdByInviteCode(
        env,
        userData.inviteCode
      );
      if (!household) {
        throw new Error("Invalid or expired invite code");
      }

      // Create the user account
      const user = await userDb.create(env, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        householdId: household.id,
        role: "member", // New users joining via invite are members, not admins
      });

      // Create session
      const session: AuthSession = {
        token: generateSessionToken(),
        userId: user.id,
        email: user.email,
        name: user.name,
        currentHouseholdId: household.id,
        role: "member",
        admin: user.admin || 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      return session;
    } catch (error) {
      console.error("Failed to join household with invite code:", error);
      return null;
    }
  },

  async createHousehold(
    env: any,
    householdData: {
      name: string;
      adminFirstName: string;
      adminLastName: string;
    }
  ): Promise<AuthSession | null> {
    if (!isDatabaseAvailable(env)) {
      throw new Error("Database not available");
    }

    try {
      // Placeholder session for development
      const session: AuthSession = {
        token: generateSessionToken(),
        userId: 1,
        email: "placeholder@email.com",
        name: `${householdData.adminFirstName} ${householdData.adminLastName}`,
        currentHouseholdId: `household_${Date.now()}`,
        role: "admin",
        admin: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      return session;
    } catch (error) {
      console.error("Household creation failed:", error);
      return null;
    }
  },

  async getSession(env: any, token: string): Promise<AuthSession | null> {
    if (!isDatabaseAvailable(env)) {
      throw new Error("Database not available");
    }

    try {
      // For now, we'll validate the token format and check if user exists
      // In a real implementation, you'd validate the token cryptographically
      const tokenParts = token.split("_");
      if (tokenParts.length !== 3 || tokenParts[0] !== "session") {
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
        currentHouseholdId: user.householdId,
        role: user.role as "admin" | "member",
        admin: user.admin || 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Extend session
      };
    } catch (error) {
      console.error("Session validation failed:", error);
      return null;
    }
  },
};
