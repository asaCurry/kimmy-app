import type { Route } from "./+types/login";
import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormLabel, FormInput, FormError, FormDescription } from "~/components/ui/form";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "~/contexts/auth-context";
import { getDemoCredentials } from "~/lib/auth";
import { useFormValidation, VALIDATION_RULE_SETS } from "~/lib/validation";
import { PageLoading, ButtonLoading } from "~/components/ui/loading";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In - Kimmy App" },
    { name: "description", content: "Sign in to your Kimmy App account" },
  ];
}

const Login: React.FC<Route.ComponentProps> = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { errors, validateAllFields, clearError } = useFormValidation(VALIDATION_RULE_SETS.login);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    clearError(field);
    if (loginError) {
      setLoginError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAllFields(formData)) {
      return;
    }

    setIsSubmitting(true);
    setLoginError("");
    
    try {
      await login(formData.email, formData.password);
      // Navigation will be handled by the useEffect above
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (credentials: { email: string; password: string }) => {
    setFormData(credentials);
    setErrors({});
    setLoginError("");
  };

  const demoCredentials = getDemoCredentials();

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoading message="Loading..." />;
  }

  return (
    <PageLayout maxWidth="2xl">
      <div className="max-w-md mx-auto">
        <PageHeader
          title="Welcome Back"
          subtitle="Sign in to your account"
        />

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl text-slate-100">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <Form onSubmit={handleSubmit}>
              {loginError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{loginError}</p>
                </div>
              )}

              <FormField>
                <FormLabel htmlFor="email" required>Email Address</FormLabel>
                <FormInput
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                />
                {errors.email && <FormError>{errors.email}</FormError>}
              </FormField>

              <FormField>
                <FormLabel htmlFor="password" required>Password</FormLabel>
                <div className="relative">
                  <FormInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <FormError>{errors.password}</FormError>}
              </FormField>

              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <ButtonLoading isLoading={isSubmitting} loadingText="Signing In...">
                    Sign In
                  </ButtonLoading>
                </Button>
              </div>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{" "}
                <Link to="/onboarding" className="text-blue-400 hover:text-blue-300">
                  Get started
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400 mb-3">Demo Accounts</h4>
          <div className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <button
                key={index}
                onClick={() => handleDemoLogin(cred)}
                className="w-full text-left p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded text-sm transition-colors"
              >
                <div className="text-slate-300">{cred.email}</div>
                <div className="text-slate-500 text-xs">Password: {cred.password}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Click any demo account to auto-fill the form
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Login;