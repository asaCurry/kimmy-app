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
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );
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
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  const sessionData = cookies["kimmy_auth_session"];

  if (!sessionData) return null;

  try {
    return JSON.parse(decodeURIComponent(sessionData));
  } catch {
    return null;
  }
}

// Legacy types - these should be replaced with the actual database types
export interface FamilyMember {
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
