import {
  Link,
  useSearchParams,
  useFetcher,
  useNavigate,
  useLoaderData,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type MetaArgs,
} from "react-router";
import * as React from "react";
import { useState, useEffect } from "react";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import { getDatabase } from "~/lib/db-utils";
import { PasswordResetService } from "~/lib/password-reset";
import { hashPassword } from "~/lib/password-utils";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";

export function meta(_args: MetaArgs) {
  return [
    { title: "Reset Password - Hey, Kimmy" },
    {
      name: "description",
      content: "Set your new Hey, Kimmy account password",
    },
  ];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    throw new Response("Missing reset token", { status: 400 });
  }

  try {
    const env = (context as any).cloudflare?.env;
    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const db = getDatabase(env);
    const passwordResetService = new PasswordResetService(db);

    // Validate the token
    const tokenData = await passwordResetService.validateResetToken(token);

    if (!tokenData) {
      return {
        success: false,
        error: "Invalid or expired reset token",
        token: null,
        user: null,
      };
    }

    return {
      success: true,
      error: null,
      token,
      user: {
        id: tokenData.user.id,
        name: tokenData.user.name,
        email: tokenData.user.email,
      },
    };
  } catch (error) {
    console.error("Error validating reset token:", error);
    return {
      success: false,
      error: "Failed to validate reset token",
      token: null,
      user: null,
    };
  }
}

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const env = (context as any).cloudflare?.env;
    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const formData = await request.formData();
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate inputs
    if (!token || !password || !confirmPassword) {
      return Response.json({
        success: false,
        error: "Missing required fields",
      });
    }

    if (password !== confirmPassword) {
      return Response.json({
        success: false,
        error: "Passwords do not match",
      });
    }

    if (password.length < 8) {
      return Response.json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    const db = getDatabase(env);
    const passwordResetService = new PasswordResetService(db);

    // Validate the token again
    const tokenData = await passwordResetService.validateResetToken(token);
    if (!tokenData) {
      return Response.json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    await db
      .update(users)
      .set({ hashedPassword })
      .where(eq(users.id, tokenData.user.id));

    // Mark the token as used
    await passwordResetService.useResetToken(token);

    // Revoke all other reset tokens for this user
    await passwordResetService.revokeAllUserTokens(tokenData.user.id);

    return Response.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return Response.json({
      success: false,
      error: "Failed to reset password",
    });
  }
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { success, error, user } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setIsResetComplete(true);
        toast.success("Password reset successfully!", {
          position: "top-right",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        toast.error(fetcher.data.error || "Failed to reset password", {
          position: "top-right",
        });
      }
    }
  }, [fetcher.data, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields", { position: "top-right" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match", { position: "top-right" });
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long", {
        position: "top-right",
      });
      return;
    }

    const submitData = new FormData();
    submitData.append("token", token || "");
    submitData.append("password", formData.password);
    submitData.append("confirmPassword", formData.confirmPassword);

    fetcher.submit(submitData, { method: "post" });
  };

  const isLoading = fetcher.state === "submitting";

  // Invalid or expired token
  if (!success) {
    return (
      <PageLayout maxWidth="2xl" showFooter={false}>
        <div className="max-w-md mx-auto">
          <PageHeader
            title="Invalid Reset Link"
            subtitle="This link is no longer valid"
          />

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-100">
                Link Expired
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-300">
                {error || "This password reset link is invalid or has expired."}
              </p>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-400">
                  Reset links expire after 30 minutes for security reasons.
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Link to="/forgot-password">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    Request New Reset Link
                  </Button>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // Password reset successful
  if (isResetComplete) {
    return (
      <PageLayout maxWidth="2xl" showFooter={false}>
        <div className="max-w-md mx-auto">
          <PageHeader
            title="Password Reset"
            subtitle="Your password has been updated"
          />

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-100">Success!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-300">
                Your password has been reset successfully.
              </p>

              <p className="text-sm text-slate-400">
                You'll be redirected to the sign in page in a few seconds.
              </p>

              <Link to="/login">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Continue to Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  // Password reset form
  return (
    <PageLayout maxWidth="2xl" showFooter={false}>
      <div className="max-w-md mx-auto">
        <PageHeader
          title="Set New Password"
          subtitle={`Hello, ${user?.name}`}
        />

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl text-slate-100">
              Create New Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  New Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">
                  Confirm New Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Password must be at least 8 characters long.
                </p>
              </div>

              <div className="flex flex-col space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
