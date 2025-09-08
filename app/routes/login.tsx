import type { Route } from "./+types/login";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useActionData, useNavigation } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormError,
} from "~/components/ui/form";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "~/contexts/auth-context";
import { useFormValidation, VALIDATION_RULE_SETS } from "~/lib/validation";
import { PageLoading, ButtonLoading } from "~/components/ui/loading";
import { authApi } from "~/lib/auth-db";
import { createValidatedAction } from "~/lib/validation-layer.server";
import { z } from "zod";

// Login form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Sign In - Hey, Kimmy" },
    { name: "description", content: "Sign in to your Hey, Kimmy account" },
  ];
}

export const action = createValidatedAction(
  loginSchema,
  async (data, { env }) => {
    try {
      const session = await authApi.login(env, data.email, data.password);

      if (!session) {
        return Response.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Set the session cookie and return success
      const maxAge = 60 * 60 * 24 * 7; // 7 days in seconds
      return new Response(JSON.stringify({ success: true, session }), {
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `kimmy_auth_session=${encodeURIComponent(JSON.stringify(session))}; Path=/; SameSite=Lax; Max-Age=${maxAge}`,
        },
      });
    } catch (error) {
      console.error("Login action error:", error);

      if (error instanceof Response) {
        throw error;
      }

      return Response.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Login failed",
        },
        { status: 500 }
      );
    }
  }
);

const Login: React.FC<Route.ComponentProps> = () => {
  const navigate = useNavigate();
  const { updateSession, isAuthenticated, isLoading } = useAuth();
  const actionData = useActionData<typeof action>() as
    | { success?: boolean; session?: any; error?: string }
    | undefined;
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { errors, clearError, clearAllErrors } = useFormValidation(
    VALIDATION_RULE_SETS.login
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const hasProcessedLogin = useRef(false);

  // Handle authentication state and redirects
  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated && !isLoading) {
      navigate("/", { replace: true });
      return;
    }

    // If login was successful and we haven't processed it yet, handle session update and redirect
    if (
      actionData?.success &&
      actionData.session &&
      !hasProcessedLogin.current
    ) {
      hasProcessedLogin.current = true;
      // Update session in auth context
      updateSession(actionData.session);
      // Navigate to home after successful login
      navigate("/", { replace: true });
    } else if (actionData?.error) {
      setLoginError(actionData.error);
    }
  }, [actionData, isAuthenticated, isLoading, navigate, updateSession]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    clearError(field);
    if (loginError) {
      setLoginError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Don't prevent default - let the form submit naturally to the action
    // e.preventDefault();
    clearAllErrors();
    setLoginError("");

    // Form will submit naturally to the action
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <PageLayout maxWidth="2xl" showFooter={false}>
      <div className="max-w-md mx-auto">
        <PageHeader title="Welcome Back" subtitle="Sign in to your account" />

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl text-slate-100">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              method="post"
              onSubmit={handleSubmit}
              className="space-y-6"
              autoComplete="on"
            >
              {(loginError || actionData?.error) && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">
                    {loginError || actionData?.error}
                  </p>
                </div>
              )}

              <FormField>
                <FormLabel htmlFor="email" required>
                  Email Address
                </FormLabel>
                <FormInput
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="username"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
                {errors.email && <FormError>{errors.email}</FormError>}
              </FormField>

              <FormField>
                <FormLabel htmlFor="password" required>
                  Password
                </FormLabel>
                <div className="relative">
                  <FormInput
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={e =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pr-10"
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
                {errors.password && <FormError>{errors.password}</FormError>}
              </FormField>

              <div className="flex flex-col space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || navigation.state === "submitting"}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <ButtonLoading
                    isLoading={
                      isSubmitting || navigation.state === "submitting"
                    }
                    loadingText="Signing In..."
                  >
                    Sign In
                  </ButtonLoading>
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot your password?
              </Link>

              <p className="text-slate-400 text-sm">
                Don't have an account?{" "}
                <Link
                  to="/onboarding"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Get started
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Login Help */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-2">
            New to Hey, Kimmy?
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Create an account to get started with managing your household's
            records records.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Create Account →
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default Login;
