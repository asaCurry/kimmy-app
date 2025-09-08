import { z } from "zod";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getValidatedEnv } from "./env.server";
import { getDatabase } from "./db-utils";
import { getSession } from "./db-utils";

export interface ValidatedContext {
  db: ReturnType<typeof getDatabase>;
  env: ReturnType<typeof getValidatedEnv>;
}

export interface AuthenticatedContext extends ValidatedContext {
  session: ReturnType<typeof getSession>;
}

/**
 * Creates a validated action handler with automatic form data parsing and validation
 */
export function createValidatedAction<T>(
  schema: z.ZodSchema<T>,
  handler: (
    data: T,
    context: ValidatedContext,
    args: ActionFunctionArgs
  ) => Promise<Response>
) {
  return async (args: ActionFunctionArgs) => {
    try {
      // Validate environment first
      const env = getValidatedEnv(args.context);
      const db = getDatabase(env);

      const context: ValidatedContext = { db, env };

      // Parse and validate form data
      const formData = await args.request.formData();
      const rawData = Object.fromEntries(formData);

      // Convert FormData null values to undefined for Zod
      const cleanedData = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value || undefined])
      );

      const data = schema.parse(cleanedData);

      return await handler(data, context, args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(
          {
            success: false,
            error: "Validation failed",
            details: error.issues.map(issue => ({
              path: issue.path,
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }

      // Re-throw other errors (like redirects)
      throw error;
    }
  };
}

/**
 * Creates a validated action handler that requires authentication
 */
export function createAuthenticatedAction<T>(
  schema: z.ZodSchema<T>,
  handler: (
    data: T,
    context: AuthenticatedContext,
    args: ActionFunctionArgs
  ) => Promise<Response>
) {
  return async (args: ActionFunctionArgs) => {
    try {
      // Validate environment first
      const env = getValidatedEnv(args.context);
      const db = getDatabase(env);

      // Handle authentication for API routes
      let session;
      try {
        session = getSession(args.request);
      } catch (error) {
        // If getSession throws a redirect, convert to API response
        if (error instanceof Response && error.status === 302) {
          return Response.json(
            { success: false, error: "Authentication required" },
            { status: 401 }
          );
        }
        throw error;
      }

      const context: AuthenticatedContext = { db, env, session };

      // Parse and validate form data
      const formData = await args.request.formData();
      const rawData = Object.fromEntries(formData);

      // Convert FormData null values to undefined for Zod
      const cleanedData = Object.fromEntries(
        Object.entries(rawData).map(([key, value]) => [key, value || undefined])
      );

      const data = schema.parse(cleanedData);

      return await handler(data, context, args);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(
          {
            success: false,
            error: "Validation failed",
            details: error.issues.map(issue => ({
              path: issue.path,
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }

      // Re-throw other errors (like redirects)
      throw error;
    }
  };
}

/**
 * Creates a validated loader handler
 */
export function createValidatedLoader(
  handler: (
    context: ValidatedContext,
    args: LoaderFunctionArgs
  ) => Promise<Response>
) {
  return async (args: LoaderFunctionArgs) => {
    const env = getValidatedEnv(args.context);
    const db = getDatabase(env);

    const context: ValidatedContext = { db, env };

    return await handler(context, args);
  };
}

/**
 * Creates a validated loader handler that requires authentication
 */
export function createAuthenticatedLoader(
  handler: (
    context: AuthenticatedContext,
    args: LoaderFunctionArgs
  ) => Promise<Response>
) {
  return async (args: LoaderFunctionArgs) => {
    const env = getValidatedEnv(args.context);
    const db = getDatabase(env);

    // Handle authentication for API routes
    let session;
    try {
      session = getSession(args.request);
    } catch (error) {
      // If getSession throws a redirect, convert to API response for loaders
      if (error instanceof Response && error.status === 302) {
        return Response.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }
      throw error;
    }

    const context: AuthenticatedContext = { db, env, session };

    return await handler(context, args);
  };
}
