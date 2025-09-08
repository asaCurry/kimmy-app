import {
  PasswordResetService,
  generateResetEmailContent,
} from "~/lib/password-reset";
import { PasswordResetRateLimit } from "~/lib/password-reset-rate-limit";
import { createValidatedAction } from "~/lib/validation-layer.server";
import { z } from "zod";

const requestResetSchema = z.object({
  _action: z.literal("request-reset"),
  email: z.string().email("Invalid email address"),
});

export const action = createValidatedAction(
  requestResetSchema,
  async (data, { env, db }) => {
    if (!env.RATE_LIMIT_KV) {
      return Response.json(
        { success: false, error: "Rate limiting not available" },
        { status: 500 }
      );
    }

    try {
      // Check rate limit
      const rateLimiter = new PasswordResetRateLimit(env.RATE_LIMIT_KV);
      const rateLimit = await rateLimiter.checkRateLimit(data.email);

      if (!rateLimit.allowed) {
        return Response.json(
          {
            success: false,
            error: "Too many password reset requests. Please try again later.",
            retryAfter: rateLimit.retryAfter,
          },
          { status: 429 }
        );
      }

      const passwordResetService = new PasswordResetService(db);

      // Always return success to prevent email enumeration attacks
      // But only send email if user actually exists
      const tokenData = await passwordResetService.createResetToken(data.email);

      // Record the request for rate limiting (regardless of whether user exists)
      await rateLimiter.recordRequest(data.email);

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
      return Response.json(
        {
          success: false,
          error: "Failed to process reset request",
        },
        { status: 500 }
      );
    }
  }
);
