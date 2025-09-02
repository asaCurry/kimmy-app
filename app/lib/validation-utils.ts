/**
 * Input validation utilities for API endpoints
 * Provides safe parsing and validation of form data
 */

import { z } from "zod";

/**
 * Safely parse an integer from form data with validation
 */
export function safeParseInt(value: unknown, fieldName: string): number {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} is required`);
  }

  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid integer`);
  }

  return parsed;
}

/**
 * Safely parse a float from form data with validation
 */
export function safeParseFloat(value: unknown, fieldName: string): number {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} is required`);
  }

  const parsed = parseFloat(String(value));
  if (isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return parsed;
}

/**
 * Safely parse an optional integer from form data
 */
export function safeParseOptionalInt(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed)) {
    return undefined;
  }

  return parsed;
}

/**
 * Safely parse a date string with validation
 */
export function safeParseDate(value: unknown, fieldName: string): Date {
  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} is required`);
  }

  const dateStr = String(value);
  const parsed = new Date(dateStr);

  if (isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  return parsed;
}

/**
 * Validate that a string is not empty after trimming
 */
export function validateNonEmptyString(
  value: unknown,
  fieldName: string
): string {
  if (value === null || value === undefined) {
    throw new Error(`${fieldName} is required`);
  }

  const str = String(value).trim();
  if (str === "") {
    throw new Error(`${fieldName} cannot be empty`);
  }

  return str;
}

/**
 * Safely get a string value, returning undefined if empty
 */
export function safeGetString(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const str = String(value).trim();
  return str === "" ? undefined : str;
}

/**
 * Validate form action parameter
 */
export function validateAction(value: unknown, validActions: string[]): string {
  const action = String(value || "");

  if (!validActions.includes(action)) {
    throw new Error(
      `Invalid action. Must be one of: ${validActions.join(", ")}`
    );
  }

  return action;
}

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(content: string): string {
  return content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize notes/text content
 */
export function validateAndSanitizeText(
  value: unknown,
  maxLength: number = 1000
): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const str = String(value).trim();

  if (str === "") {
    return undefined;
  }

  if (str.length > maxLength) {
    throw new Error(`Text content cannot exceed ${maxLength} characters`);
  }

  // Sanitize to prevent XSS
  return sanitizeHtml(str);
}

/**
 * Common API response helpers
 */
export const ApiResponse = {
  success: <T>(data: T) => Response.json({ success: true, data }),
  error: (message: string, status: number = 400) =>
    Response.json({ success: false, error: message }, { status }),
  unauthorized: () =>
    Response.json({ success: false, error: "Unauthorized" }, { status: 401 }),
  notFound: (resource: string = "Resource") =>
    Response.json(
      { success: false, error: `${resource} not found` },
      { status: 404 }
    ),
  serverError: (message: string = "Internal server error") =>
    Response.json({ success: false, error: message }, { status: 500 }),
};

/**
 * Validate session data structure
 */
export function validateSession(session: any): {
  userId: number;
  currentHouseholdId: string;
} {
  if (!session || typeof session !== "object") {
    throw new Error("Invalid session data");
  }

  if (!session.userId || !session.currentHouseholdId) {
    throw new Error("Session missing required data");
  }

  return {
    userId: session.userId,
    currentHouseholdId: session.currentHouseholdId,
  };
}
