// import type { Route } from "./+types/settings";
import * as React from "react";
import { redirect } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { UserProfile } from "~/components/user-profile";
import { withDatabaseAndSession } from "~/lib/db-utils";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "~/lib/password-utils";
import { logger } from "~/lib/logger";

export function meta() {
  return [
    { title: "Account Settings - Kimmy" },
    {
      name: "description",
      content: "Manage your account settings and profile",
    },
  ];
}

export async function loader({ request, context }: any) {
  // Check authentication
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    throw redirect("/welcome");
  }

  const cookies = cookieHeader.split(";").reduce(
    (acc: Record<string, string>, cookie: string) => {
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
    throw redirect("/welcome");
  }

  let session;
  try {
    session = JSON.parse(decodeURIComponent(sessionData));
  } catch (error) {
    throw redirect("/welcome");
  }

  if (!session.currentHouseholdId) {
    throw redirect("/welcome");
  }

  return { session };
}

export async function action({ request, context }: any) {
  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "update-profile": {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;

      if (!name || !email) {
        return {
          error: "Name and email are required",
          action: "update-profile",
        };
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          error: "Please enter a valid email address",
          action: "update-profile",
        };
      }

      return withDatabaseAndSession(request, context, async (db, session) => {
        try {
          // Check if email is already taken by another user
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (
            existingUser.length > 0 &&
            existingUser[0].id !== session.userId
          ) {
            return {
              error: "Email address is already in use",
              action: "update-profile",
            };
          }

          // Update user profile
          await db
            .update(users)
            .set({
              name,
              email,
            })
            .where(eq(users.id, session.userId));

          logger.info("User profile updated", {
            userId: session.userId,
            email: email.slice(0, 3) + "***", // Log partial email for privacy
          });

          return {
            success: true,
            message: "Profile updated successfully",
            action: "update-profile",
          };
        } catch (error) {
          logger.error("Profile update error", {
            userId: session.userId,
            error: error instanceof Error ? error.message : "Unknown error",
          });

          return {
            error: "Failed to update profile. Please try again.",
            action: "update-profile",
          };
        }
      });
    }

    case "change-password": {
      const currentPassword = formData.get("currentPassword") as string;
      const newPassword = formData.get("newPassword") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return {
          error: "All password fields are required",
          action: "change-password",
        };
      }

      if (newPassword.length < 8) {
        return {
          error: "New password must be at least 8 characters long",
          action: "change-password",
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          error: "New passwords do not match",
          action: "change-password",
        };
      }

      if (currentPassword === newPassword) {
        return {
          error: "New password must be different from current password",
          action: "change-password",
        };
      }

      return withDatabaseAndSession(request, context, async (db, session) => {
        try {
          // Get current user data
          const userData = await db
            .select()
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1);

          if (!userData.length) {
            return {
              error: "User not found",
              action: "change-password",
            };
          }

          const user = userData[0];

          // Verify current password
          const isCurrentPasswordValid = await verifyPassword(
            currentPassword,
            user.hashedPassword || ""
          );
          if (!isCurrentPasswordValid) {
            return {
              error: "Current password is incorrect",
              action: "change-password",
            };
          }

          // Hash new password
          const newPasswordHash = await hashPassword(newPassword);

          // Update password
          await db
            .update(users)
            .set({
              hashedPassword: newPasswordHash,
            })
            .where(eq(users.id, session.userId));

          logger.info("User password changed", {
            userId: session.userId,
            email: user.email.slice(0, 3) + "***",
          });

          return {
            success: true,
            message: "Password updated successfully",
            action: "change-password",
          };
        } catch (error) {
          logger.error("Password change error", {
            userId: session.userId,
            error: error instanceof Error ? error.message : "Unknown error",
          });

          return {
            error: "Failed to update password. Please try again.",
            action: "change-password",
          };
        }
      });
    }

    default:
      return { error: "Invalid action" };
  }
}

const Settings: React.FC = () => {
  const { session } = useAuth();

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout maxWidth="2xl">
        <PageHeader
          title="Account Settings"
          subtitle={`Manage your profile and account preferences, ${session?.name}`}
        />
        <UserProfile />
      </PageLayout>
    </RequireAuth>
  );
};

export default Settings;
