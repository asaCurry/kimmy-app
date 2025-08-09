import type { Route } from "./+types/onboarding.create-account";
import * as React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormLabel, FormInput, FormError, FormDescription } from "~/components/ui/form";
import { ArrowLeft, UserPlus } from "lucide-react";
import { authAPI, sessionStorage } from "~/lib/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Account - Kimmy App" },
    { name: "description", content: "Create your personal account to get started" },
  ];
}

const CreateAccount: React.FC<Route.ComponentProps> = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { token, session } = await authAPI.createAccount({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      
      // Store authentication data
      sessionStorage.setToken(token);
      sessionStorage.setSessionData(session);
      
      // Navigate to household creation
      navigate("/onboarding/create-household");
    } catch (error) {
      console.error("Account creation failed:", error);
      setErrors({ submit: error instanceof Error ? error.message : "Account creation failed" });
    } finally {
      setIsSubmitting(false);
    }
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
            <Form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <FormField>
                  <FormLabel htmlFor="firstName" required>First Name</FormLabel>
                  <FormInput
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <FormError>{errors.firstName}</FormError>}
                </FormField>

                <FormField>
                  <FormLabel htmlFor="lastName" required>Last Name</FormLabel>
                  <FormInput
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <FormError>{errors.lastName}</FormError>}
                </FormField>
              </div>

              <FormField>
                <FormLabel htmlFor="email" required>Email Address</FormLabel>
                <FormInput
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
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
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Create a password"
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
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <FormError>{errors.confirmPassword}</FormError>}
              </FormField>

              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
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
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default CreateAccount;