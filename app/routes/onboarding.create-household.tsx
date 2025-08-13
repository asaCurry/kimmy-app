import type { Route } from "./+types/onboarding.create-household";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useActionData,
  useNavigation,
  Form,
} from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormError,
  FormDescription,
} from "~/components/ui/form";
import { ArrowLeft, Home, Users } from "lucide-react";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { authApi } from "~/lib/auth-db";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Create Household - Hey, Kimmy" },
    {
      name: "description",
      content: "Set up your household and become the administrator",
    },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const env = (context.cloudflare as any)?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const formData = await request.formData();
    const householdName = formData.get("householdName") as string;
    const adminFirstName = formData.get("adminFirstName") as string;
    const adminLastName = formData.get("adminLastName") as string;

    // Validation
    if (!householdName || !adminFirstName || !adminLastName) {
      return { error: "All fields are required" };
    }

    const session = await authApi.createHousehold(env, {
      name: householdName,
      adminFirstName,
      adminLastName,
    });

    if (!session) {
      return { error: "Household creation failed" };
    }

    // Return success with session data
    return { success: true, session };
  } catch (error) {
    console.error("Household creation action error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return {
      error:
        error instanceof Error ? error.message : "Household creation failed",
    };
  }
}

const CreateHousehold: React.FC<Route.ComponentProps> = () => {
  const navigate = useNavigate();
  const { updateSession, session } = useAuth();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    householdName: "",
    adminFirstName: "",
    adminLastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle action data changes
  useEffect(() => {
    if (actionData?.success && actionData.session) {
      updateSession(actionData.session);

      // Create the admin member in the household
      // This logic is now handled by the server-side action

      // Navigate to main app
      navigate("/");
    } else if (actionData?.error) {
      setErrors({ submit: actionData.error });
    }
  }, [actionData, updateSession, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.householdName.trim()) {
      newErrors.householdName = "Household name is required";
    }

    if (!formData.adminFirstName.trim()) {
      newErrors.adminFirstName = "First name is required";
    }

    if (!formData.adminLastName.trim()) {
      newErrors.adminLastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Don't prevent default - let the form submit naturally to the action
    if (!validateForm()) {
      e.preventDefault();
      return;
    }

    // Form will submit naturally to the action
  };

  const generateInviteCode = () => {
    return (
      formData.householdName
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 6) + new Date().getFullYear().toString().slice(-2)
    );
  };

  return (
    <RequireAuth>
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
            title="Create Your Household"
            subtitle="Set up your household records space"
          />

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-100">
                Household Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form method="post" onSubmit={handleSubmit} className="space-y-6">
                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{errors.submit}</p>
                  </div>
                )}

                <FormField>
                  <FormLabel htmlFor="householdName" required>
                    Household Name
                  </FormLabel>
                  <FormInput
                    id="householdName"
                    name="householdName"
                    type="text"
                    value={formData.householdName}
                    onChange={e =>
                      handleInputChange("householdName", e.target.value)
                    }
                    placeholder="e.g., The Johnson Household"
                  />
                  {errors.householdName && (
                    <FormError>{errors.householdName}</FormError>
                  )}
                </FormField>

                {formData.householdName && (
                  <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                    <div className="flex items-center text-sm text-slate-300 mb-2">
                      <Users className="h-4 w-4 mr-2" />
                      Invite Code Preview
                    </div>
                    <div className="text-lg font-mono text-blue-400">
                      {generateInviteCode()}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Household members can use this code to join your household
                    </p>
                  </div>
                )}

                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-lg font-medium text-slate-200 mb-4">
                    Administrator Details
                  </h3>
                  <FormDescription className="mb-4">
                    As the household creator, you'll be the administrator with
                    full management permissions.
                  </FormDescription>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField>
                      <FormLabel htmlFor="adminFirstName" required>
                        First Name
                      </FormLabel>
                      <FormInput
                        id="adminFirstName"
                        name="adminFirstName"
                        type="text"
                        value={formData.adminFirstName}
                        onChange={e =>
                          handleInputChange("adminFirstName", e.target.value)
                        }
                        placeholder="Your first name"
                      />
                      {errors.adminFirstName && (
                        <FormError>{errors.adminFirstName}</FormError>
                      )}
                    </FormField>

                    <FormField>
                      <FormLabel htmlFor="adminLastName" required>
                        Last Name
                      </FormLabel>
                      <FormInput
                        id="adminLastName"
                        name="adminLastName"
                        type="text"
                        value={formData.adminLastName}
                        onChange={e =>
                          handleInputChange("adminLastName", e.target.value)
                        }
                        placeholder="Your last name"
                      />
                      {errors.adminLastName && (
                        <FormError>{errors.adminLastName}</FormError>
                      )}
                    </FormField>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 pt-6">
                  <Button
                    type="submit"
                    disabled={navigation.state === "submitting"}
                    className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                  >
                    {navigation.state === "submitting"
                      ? "Creating Household..."
                      : "Create Household"}
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

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-400 mb-2">
              What happens next?
            </h4>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• You'll become the household administrator</li>
              <li>• You can add household members and children</li>
              <li>• Start creating and managing household records</li>
              <li>• Invite other adults to join your household</li>
            </ul>
          </div>
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default CreateHousehold;
