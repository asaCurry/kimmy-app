import { drizzle } from "drizzle-orm/d1";
import { extractSessionFromCookies } from "~/lib/utils";

// Consolidated database connection utility
export function getDatabase(env: any) {
  if (!env?.DB) {
    throw new Response("Database not available", { status: 500 });
  }
  return drizzle(env.DB);
}

// Consolidated session validation utility
export function getSession(request: Request) {
  const session = extractSessionFromCookies(request.headers.get("cookie"));
  if (!session?.userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}

// Consolidated error handler
export function handleError(error: unknown, context: string): never {
  console.error(`${context} error:`, error);

  if (error instanceof Response) {
    throw error;
  }

  throw new Response(`Failed to ${context}`, { status: 500 });
}

// Common loader/action wrapper for database operations
export async function withDatabase<T>(
  context: any,
  operation: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  try {
    const db = getDatabase(context.cloudflare?.env);
    return await operation(db);
  } catch (error) {
    console.error("withDatabase error:", error);
    
    // If it's already a Response, re-throw it
    if (error instanceof Response) {
      throw error;
    }
    
    // If it's a database error, provide more details
    if (error instanceof Error) {
      console.error("Database operation failed:", error.message);
      console.error("Stack trace:", error.stack);
      throw new Response(`Database operation failed: ${error.message}`, { status: 500 });
    }
    
    // Generic fallback
    throw new Response("Database operation failed", { status: 500 });
  }
}

// Common loader/action wrapper with session validation
export async function withDatabaseAndSession<T>(
  request: Request,
  context: any,
  operation: (
    db: ReturnType<typeof drizzle>,
    session: ReturnType<typeof getSession>
  ) => Promise<T>
): Promise<T> {
  try {
    const db = getDatabase(context.cloudflare?.env);
    const session = getSession(request);
    return await operation(db, session);
  } catch (error) {
    handleError(error, "process authenticated operation");
  }
}
