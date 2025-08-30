/**
 * Common middleware utilities for API endpoints
 * Provides consistent session validation and error handling
 */

import { getDatabase } from "./db-utils";
import { validateSession, ApiResponse } from "./validation-utils";

export interface AuthenticatedRequest {
  db: any;
  session: {
    userId: number;
    currentHouseholdId: string;
  };
  formData: FormData;
  env: any;
}

/**
 * Higher-order function that handles common API endpoint setup
 * Validates database, session, and provides consistent error handling
 */
export function withAuthentication<T>(
  handler: (req: AuthenticatedRequest) => Promise<T>
) {
  return async ({ request, context }: { request: Request; context: any }) => {
    try {
      // Validate environment and database
      const env = (context as any).cloudflare?.env;
      if (!env?.DB) {
        return ApiResponse.serverError("Database not available");
      }

      const db = getDatabase(env);

      // Extract and validate session
      const cookieHeader = request.headers.get("cookie");
      if (!cookieHeader) {
        return ApiResponse.unauthorized();
      }

      const cookies = cookieHeader.split(";").reduce(
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
      if (!sessionData) {
        return ApiResponse.unauthorized();
      }

      let rawSession;
      try {
        rawSession = JSON.parse(decodeURIComponent(sessionData));
      } catch (error) {
        console.error("Invalid session cookie:", error);
        return ApiResponse.unauthorized();
      }

      const session = validateSession(rawSession);
      const formData = await request.formData();

      // Call the actual handler
      const result = await handler({
        db,
        session,
        formData,
        env,
      });

      return result;
    } catch (error) {
      console.error("API middleware error:", error);
      
      // Handle different error types
      if (error instanceof Response) {
        return error; // Re-throw Response objects
      }
      
      if (error instanceof Error) {
        // Handle validation errors
        if (error.message.includes("required") || error.message.includes("Invalid")) {
          return ApiResponse.error(error.message, 400);
        }
        
        // Handle authorization errors
        if (error.message.includes("Unauthorized") || error.message.includes("Session")) {
          return ApiResponse.unauthorized();
        }
        
        return ApiResponse.serverError(error.message);
      }
      
      return ApiResponse.serverError("An unexpected error occurred");
    }
  };
}

/**
 * Validate that a user has permission to access a specific household
 */
export function validateHouseholdAccess(
  session: { currentHouseholdId: string },
  targetHouseholdId: string
): boolean {
  return session.currentHouseholdId === targetHouseholdId;
}

/**
 * Rate limiting helper (basic implementation)
 * In production, you'd use a more sophisticated rate limiting solution
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * Clean up expired rate limit entries (call this periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}