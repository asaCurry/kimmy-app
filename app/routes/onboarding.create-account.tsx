import type { Route } from "./+types/onboarding.create-account";
import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useActionData, useNavigation } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormLabel, FormInput, FormError, FormDescription } from "~/components/ui/form";
import { ArrowLeft, UserPlus } from "lucide-react";
import { authApi } from "~/lib/auth-db";
import { useAuth } from "~/contexts/auth-context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Account - Hey, Kimmy" },
    { name: "description", content: "Create your personal account to get started" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    console.log('🚀 Action triggered for account creation');
    
    const env = (context.cloudflare as any)?.env;
    console.log('🔧 Environment check:', !!env?.DB);
    
    if (!env?.DB) {
      console.error('❌ Database not available');
      throw new Response('Database not available', { status: 500 });
    }

    const formData = await request.formData();
    console.log('📝 Form data received:', {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      hasPassword: !!formData.get('password'),
      hasConfirmPassword: !!formData.get('confirmPassword'),
    });
    
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      console.log('❌ Validation failed: missing fields');
      return { error: 'All fields are required' };
    }

    if (password !== confirmPassword) {
      console.log('❌ Validation failed: passwords do not match');
      return { error: 'Passwords do not match' };
    }

    if (password.length < 6) {
      console.log('❌ Validation failed: password too short');
      return { error: 'Password must be at least 6 characters long' };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('❌ Validation failed: invalid email');
      return { error: 'Please enter a valid email address' };
    }

    console.log('✅ Validation passed, creating account...');
    const session = await authApi.createAccount(env, {
      name: `${firstName} ${lastName}`,
      email,
      password,
    });

    if (!session) {
      return { error: 'Account creation failed' };
    }

    console.log('✅ Account created successfully:', { userId: session.userId, email: session.email });
    // Return success with session data
    return { success: true, session };
  } catch (error) {
    console.error('❌ Account creation action error:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    return { 
      error: error instanceof Error ? error.message : 'Account creation failed' 
    };
  }
}

const CreateAccount: React.FC<Route.ComponentProps> = () => {
  const navigate = useNavigate();
  const { updateSession } = useAuth();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle action data changes
  useEffect(() => {
    if (actionData?.success && actionData.session) {
      updateSession(actionData.session);
      navigate("/");
    } else if (actionData?.error) {
      setErrors({ submit: actionData.error });
    }
  }, [actionData, updateSession, navigate]);

  const handleFormSubmit = (e: React.FormEvent) => {
    console.log('🔄 Form submission started');
    
    // Clear any previous errors
    setErrors({});
    
    // Get form data
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    console.log('📝 Client-side form data:', {
      firstName,
      lastName,
      email,
      hasPassword: !!password,
      hasConfirmPassword: !!confirmPassword,
    });

    // Client-side validation
    const newErrors: Record<string, string> = {};

    if (!firstName?.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!password?.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!confirmPassword?.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Client-side validation failed:', newErrors);
      e.preventDefault();
      setErrors(newErrors);
      return;
    }

    console.log('✅ Client-side validation passed, allowing form submission');
    // If validation passes, let the form submit naturally
  };

  return (
    <PageLayout maxWidth="2xl">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link 
            to="/onboarding" 
            className="inline-flex items-center text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Onboarding
          </Link>
        </div>

        <PageHeader
          title="Create Your Account"
          subtitle="Enter your details to get started"
        />

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl text-slate-100">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form method="post" onSubmit={handleFormSubmit} className="space-y-6">
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField>
                  <FormLabel htmlFor="firstName" required>First Name</FormLabel>
                  <FormInput
                    id="firstName"
                    name="firstName"
                    type="text"
                    defaultValue=""
                    placeholder="Enter your first name"
                    required
                  />
                  {errors.firstName && <FormError>{errors.firstName}</FormError>}
                </FormField>

                <FormField>
                  <FormLabel htmlFor="lastName" required>Last Name</FormLabel>
                  <FormInput
                    id="lastName"
                    name="lastName"
                    type="text"
                    defaultValue=""
                    placeholder="Enter your last name"
                    required
                  />
                  {errors.lastName && <FormError>{errors.lastName}</FormError>}
                </FormField>
              </div>

              <FormField>
                <FormLabel htmlFor="email" required>Email Address</FormLabel>
                <FormInput
                  id="email"
                  name="email"
                  type="email"
                  defaultValue=""
                  placeholder="Enter your email address"
                  required
                />
                {errors.email && <FormError>{errors.email}</FormError>}
                <FormDescription>
                  This will be used to sign in to your account
                </FormDescription>
              </FormField>

              <FormField>
                <FormLabel htmlFor="password" required>Password</FormLabel>
                <FormInput
                  id="password"
                  name="password"
                  type="password"
                  defaultValue=""
                  placeholder="Create a password"
                  required
                />
                {errors.password && <FormError>{errors.password}</FormError>}
                <FormDescription>
                  Must be at least 6 characters long
                </FormDescription>
              </FormField>

              <FormField>
                <FormLabel htmlFor="confirmPassword" required>Confirm Password</FormLabel>
                <FormInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  defaultValue=""
                  placeholder="Confirm your password"
                  required
                />
                {errors.confirmPassword && <FormError>{errors.confirmPassword}</FormError>}
              </FormField>

              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={navigation.state === "submitting"}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {navigation.state === "submitting" ? "Creating Account..." : "Create Account"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/onboarding")}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default CreateAccount;