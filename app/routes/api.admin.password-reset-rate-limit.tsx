import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getDatabase } from "~/lib/db-utils";
import { PasswordResetRateLimit } from "~/lib/password-reset-rate-limit";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const adminActionSchema = z.object({
  email: z.string().email("Invalid email address"),
  action: z.enum(["clear", "status"]),
});

async function requireAdmin(context: any, email: string) {
  const env = context?.cloudflare?.env;
  if (!env?.DB) {
    throw new Response("Database not available", { status: 500 });
  }

  const db = getDatabase(env);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user?.admin) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return { db, user };
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const adminEmail = url.searchParams.get("adminEmail");
  const targetEmail = url.searchParams.get("email");

  if (!adminEmail || !targetEmail) {
    return Response.json(
      { success: false, error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    await requireAdmin(context, adminEmail);

    const env = (context as any).cloudflare?.env;
    if (!env?.RATE_LIMIT_KV) {
      throw new Response("Rate limiting not available", { status: 500 });
    }

    const rateLimiter = new PasswordResetRateLimit(env.RATE_LIMIT_KV);
    const status = await rateLimiter.getRateLimitStatus(targetEmail);

    return Response.json({
      success: true,
      email: targetEmail,
      rateLimitStatus: status,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Error checking rate limit status:", error);
    return Response.json(
      { success: false, error: "Failed to check rate limit status" },
      { status: 500 }
    );
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const adminEmail = formData.get("adminEmail") as string;
    const email = formData.get("email") as string;
    const action = formData.get("action") as string;

    if (!adminEmail) {
      return Response.json(
        { success: false, error: "Admin email required" },
        { status: 400 }
      );
    }

    // Validate admin permissions
    await requireAdmin(context, adminEmail);

    // Validate input
    const { email: validatedEmail, action: validatedAction } =
      adminActionSchema.parse({
        email,
        action,
      });

    const env = (context as any).cloudflare?.env;
    if (!env?.RATE_LIMIT_KV) {
      throw new Response("Rate limiting not available", { status: 500 });
    }

    const rateLimiter = new PasswordResetRateLimit(env.RATE_LIMIT_KV);

    switch (validatedAction) {
      case "clear": {
        await rateLimiter.clearRateLimit(validatedEmail);
        return Response.json({
          success: true,
          message: `Rate limit cleared for ${validatedEmail}`,
        });
      }

      case "status": {
        const status = await rateLimiter.getRateLimitStatus(validatedEmail);
        return Response.json({
          success: true,
          email: validatedEmail,
          rateLimitStatus: status,
        });
      }

      default: {
        return Response.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("Error in admin rate limit action:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: "Invalid input",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return Response.json(
      { success: false, error: "Failed to process admin request" },
      { status: 500 }
    );
  }
}
