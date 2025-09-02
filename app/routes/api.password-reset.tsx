import type { ActionFunctionArgs } from "react-router";
import { getDatabase } from "~/lib/db-utils";
import {
  PasswordResetService,
  generateResetEmailContent,
} from "~/lib/password-reset";
import { z } from "zod";

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const env = (context as any).cloudflare?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const db = getDatabase(env);
    const formData = await request.formData();
    const action = formData.get("_action") as string;

    switch (action) {
      case "request-reset": {
        try {
          const email = formData.get("email") as string;

          // Validate input
          const { email: validatedEmail } = requestResetSchema.parse({ email });

          const passwordResetService = new PasswordResetService(db);

          // Always return success to prevent email enumeration attacks
          // But only send email if user actually exists
          const tokenData =
            await passwordResetService.createResetToken(validatedEmail);

          if (tokenData && env.KIMMY_EMAIL) {
            const { token, user } = tokenData;
            const baseUrl = env.BASE_URL || "https://kimmy-app.workers.dev";

            // Generate email content
            const emailContent = generateResetEmailContent(
              user.name,
              token,
              baseUrl
            );

            try {
              // Send password reset email using Cloudflare Email Routing
              await env.KIMMY_EMAIL.send({
                from: "noreply@kimmy-app.com",
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
              });

              console.log(`Password reset email sent to ${user.email}`);
            } catch (emailError) {
              console.error("Failed to send password reset email:", emailError);
              // Don't throw - we still want to return success to prevent enumeration
            }
          }

          // Always return success message regardless of whether user exists
          return Response.json({
            success: true,
            message:
              "If an account with that email exists, we've sent a password reset link.",
          });
        } catch (error) {
          console.error("Error in password reset request:", error);

          if (error instanceof z.ZodError) {
            return Response.json(
              {
                success: false,
                error: "Invalid email address",
              },
              { status: 400 }
            );
          }

          return Response.json(
            {
              success: false,
              error: "Failed to process reset request",
            },
            { status: 500 }
          );
        }
      }

      default: {
        return Response.json(
          {
            success: false,
            error: "Invalid action",
          },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error("Error in password reset action:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 500 }
    );
  }
}
