import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse cookies from a cookie header string
 */
export function parseCookies(
  cookieHeader: string | null
): Record<string, string> {
  console.log("🔧 parseCookies - Input:", cookieHeader);
  
  if (!cookieHeader) {
    console.log("🔧 parseCookies - No cookie header, returning empty object");
    return {};
  }

  const result = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      console.log(`🔧 parseCookies - Processing cookie: "${key}" = "${value}"`);
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );
  
  console.log("🔧 parseCookies - Final result:", result);
  return result;
}

/**
 * Extract environment from Cloudflare context safely
 */
export function extractEnv(context: any): any {
  return context?.cloudflare?.env;
}

/**
 * Check if database is available in the current environment
 */
export function isDatabaseAvailable(env: any): boolean {
  return !!env?.DB;
}

/**
 * Safely extract session data from cookies
 */
export function extractSessionFromCookies(cookieHeader: string | null): any {
  console.log("🍪 extractSessionFromCookies - Cookie header:", cookieHeader);
  
  if (!cookieHeader) {
    console.log("🍪 extractSessionFromCookies - No cookie header");
    return null;
  }

  const cookies = parseCookies(cookieHeader);
  console.log("🍪 extractSessionFromCookies - Parsed cookies:", cookies);
  
  const sessionData = cookies["kimmy_auth_session"];
  console.log("🍪 extractSessionFromCookies - Session data:", sessionData);

  if (!sessionData) {
    console.log("🍪 extractSessionFromCookies - No session data found");
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(sessionData));
    console.log("🍪 extractSessionFromCookies - Successfully parsed session:", parsed);
    return parsed;
  } catch (error) {
    console.log("🍪 extractSessionFromCookies - Failed to parse session:", error);
    return null;
  }
}

// Legacy types - these should be replaced with the actual database types
export interface Householdmember {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  age?: number;
  relationshipToAdmin?: string;
}

export interface RecordType {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "checkbox"
    | "file";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
