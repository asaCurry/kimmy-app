import type { Route } from "./+types/onboarding.create-account";
import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useActionData, useNavigation } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormField,
  FormLabel,
  FormInput,
  FormError,
  FormDescription,
} from "~/components/ui/form";
import { ArrowLeft, UserPlus } from "lucide-react";
import { authApi } from "~/lib/auth-db";
import { useAuth } from "~/contexts/auth-context";
import { toast } from "react-toastify";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "Create Account & Household - Hey, Kimmy" },
    {
      name: "description",
      content: "Create your personal account and household to get started",
    },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const env = (context.cloudflare as any)?.env;

    if (!env?.DB) {
      console.error("❌ Database not available");
      throw new Response("Database not available", { status: 500 });
    }

    const formData = await request.formData();

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const householdType = formData.get("householdType") as string;
    const householdName = formData.get("householdName") as string;
    const inviteCode = formData.get("inviteCode") as string;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return { error: "All fields are required" };
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match" };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long" };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Please enter a valid email address" };
    }

    // If no household type is selected, default to "custom" since it's the default option
    const selectedHouseholdType = householdType || "custom";

    // Validate household-specific fields
    if (selectedHouseholdType === "custom" && !householdName?.trim()) {
      return { error: "Household name is required for custom household" };
    }

    if (selectedHouseholdType === "join" && !inviteCode?.trim()) {
      return { error: "Invite code is required to join existing household" };
    }

    // For "only me" option, no additional validation needed - household name will be auto-generated

    let session;
    if (selectedHouseholdType === "join" && inviteCode && inviteCode.trim()) {
      // Join existing household with invite code

      session = await authApi.joinHouseholdWithInviteCode(env, {
        name: `${firstName} ${lastName}`,
        email,
        password,
        inviteCode: inviteCode.trim(),
      });
    } else {
      // Create new account and household
      const householdNameToUse =
        selectedHouseholdType === "custom" && householdName?.trim()
          ? householdName.trim()
          : undefined; // undefined will use the default "Just me" naming

      session = await authApi.createAccount(env, {
        name: `${firstName} ${lastName}`,
        email,
        password,
        householdName: householdNameToUse,
      });
    }

    if (!session) {
      return { error: "Account creation failed" };
    }

    // Return success with session data
    return { success: true, session };
  } catch (error) {
    console.error("❌ Account creation action error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return {
      error: error instanceof Error ? error.message : "Account creation failed",
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
      toast.success("Account created successfully! Welcome to Kimmy!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      updateSession(actionData.session);
      navigate("/");
    } else if (actionData?.error) {
      toast.error(actionData.error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setErrors({ submit: actionData.error });
    }
  }, [actionData, updateSession, navigate]);

  const handleFormSubmit = (e: React.FormEvent) => {
    // Clear any previous errors
    setErrors({});

    // Temporarily disable validation on hidden fields to prevent browser validation errors
    const customHouseholdName = document.getElementById("customHouseholdName");
    const inviteCodeSection = document.getElementById("inviteCodeSection");
    const householdNameInput = document.getElementById(
      "householdName"
    ) as HTMLInputElement;
    const inviteCodeInput = document.getElementById(
      "inviteCode"
    ) as HTMLInputElement;

    // Store original required states
    const originalHouseholdNameRequired = householdNameInput?.required;
    const originalInviteCodeRequired = inviteCodeInput?.required;

    // Temporarily disable required on hidden fields
    if (
      customHouseholdName?.classList.contains("hidden") &&
      householdNameInput
    ) {
      householdNameInput.required = false;
    }
    if (inviteCodeSection?.classList.contains("hidden") && inviteCodeInput) {
      inviteCodeInput.required = false;
    }

    // Get form data
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const householdType = formData.get("householdType") as string;
    const householdName = formData.get("householdName") as string;
    const inviteCode = formData.get("inviteCode") as string;

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

    // Household-specific validation
    const selectedHouseholdType = householdType || "custom";

    if (selectedHouseholdType === "custom" && !householdName?.trim()) {
      newErrors.householdName = "Household name is required";
    }

    if (selectedHouseholdType === "join" && !inviteCode?.trim()) {
      newErrors.inviteCode = "Invite code is required";
    }

    // Ensure household name is not required for "Just me" option
    if (selectedHouseholdType === "onlyMe") {
      // Clear any household name errors for "Just me" option
      delete newErrors.householdName;
    }

    if (Object.keys(newErrors).length > 0) {
      e.preventDefault();
      setErrors(newErrors);

      // Restore original required states
      if (householdNameInput) {
        householdNameInput.required = originalHouseholdNameRequired;
      }
      if (inviteCodeInput) {
        inviteCodeInput.required = originalInviteCodeRequired;
      }

      return;
    }

    // Restore original required states before form submission
    if (householdNameInput) {
      householdNameInput.required = originalHouseholdNameRequired;
    }
    if (inviteCodeInput) {
      inviteCodeInput.required = originalInviteCodeRequired;
    }

    // If validation passes, let the form submit naturally
  };

  // Handle household type selection
  const handleHouseholdTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const householdType = e.target.value;
    const customHouseholdName = document.getElementById("customHouseholdName");
    const inviteCodeSection = document.getElementById("inviteCodeSection");
    const householdNameInput = document.getElementById(
      "householdName"
    ) as HTMLInputElement;

    if (customHouseholdName) {
      customHouseholdName.classList.toggle(
        "hidden",
        householdType !== "custom"
      );
    }

    if (inviteCodeSection) {
      inviteCodeSection.classList.toggle("hidden", householdType !== "join");
    }

    // Update required attribute based on household type
    if (householdNameInput) {
      householdNameInput.required = householdType === "custom";

      // Clear the field value when switching to "Just me" to avoid validation issues
      if (householdType === "onlyMe") {
        householdNameInput.value = "";
      }
    }
  };

  // Initialize the form state on component mount
  useEffect(() => {
    // Since "custom" is the default, ensure the custom household name field is visible
    const customHouseholdName = document.getElementById("customHouseholdName");
    const householdNameInput = document.getElementById(
      "householdName"
    ) as HTMLInputElement;

    if (customHouseholdName) {
      customHouseholdName.classList.remove("hidden");
    }

    // Set initial required state since "custom" is default
    if (householdNameInput) {
      householdNameInput.required = true;
    }
  }, []);

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
          title="Create Your Account & Household"
          subtitle="Enter your details and set up your household"
        />

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl text-slate-100">
              Account & Household Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              method="post"
              onSubmit={handleFormSubmit}
              className="space-y-6"
              noValidate
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField>
                  <FormLabel htmlFor="firstName" required>
                    First Name
                  </FormLabel>
                  <FormInput
                    id="firstName"
                    name="firstName"
                    type="text"
                    defaultValue=""
                    placeholder="Enter your first name"
                    required
                  />
                  {errors.firstName && (
                    <FormError>{errors.firstName}</FormError>
                  )}
                </FormField>

                <FormField>
                  <FormLabel htmlFor="lastName" required>
                    Last Name
                  </FormLabel>
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
                <FormLabel htmlFor="email" required>
                  Email Address
                </FormLabel>
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
                <FormLabel htmlFor="password" required>
                  Password
                </FormLabel>
                <FormInput
                  id="password"
                  name="password"
                  type="password"
                  defaultValue=""
                  placeholder="Enter your password"
                  required
                />
                {errors.password && <FormError>{errors.password}</FormError>}
                <FormDescription>
                  Must be at least 6 characters long
                </FormDescription>
              </FormField>

              <FormField>
                <FormLabel htmlFor="confirmPassword" required>
                  Confirm Password
                </FormLabel>
                <FormInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  defaultValue=""
                  placeholder="Confirm your password"
                  required
                />
                {errors.confirmPassword && (
                  <FormError>{errors.confirmPassword}</FormError>
                )}
              </FormField>

              {/* Household Setup Section */}
              <div className="border-t border-slate-700 pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-slate-100 mb-2">
                    Household Setup
                  </h3>
                  <p className="text-sm text-slate-400">
                    Choose how you'd like to set up your household (this will be
                    created automatically with your account)
                  </p>
                </div>

                {/* Household Type Selection */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="householdCustom"
                      name="householdType"
                      value="custom"
                      defaultChecked
                      onChange={handleHouseholdTypeChange}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="householdCustom"
                      className="text-slate-200 cursor-pointer"
                    >
                      <div className="font-medium">Custom household</div>
                      <div className="text-sm text-slate-400">
                        Create a household with your chosen name
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="householdOnlyMe"
                      name="householdType"
                      value="onlyMe"
                      onChange={handleHouseholdTypeChange}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="householdOnlyMe"
                      className="text-slate-200 cursor-pointer"
                    >
                      <div className="font-medium">Just me</div>
                      <div className="text-sm text-slate-400">
                        Create a personal household with an auto-generated name
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="householdJoin"
                      name="householdType"
                      value="join"
                      onChange={handleHouseholdTypeChange}
                      className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="householdJoin"
                      className="text-slate-200 cursor-pointer"
                    >
                      <div className="font-medium">Join existing household</div>
                      <div className="text-sm text-slate-400">
                        Use an invite code to join someone else's household
                      </div>
                    </label>
                  </div>
                </div>

                {/* Custom Household Name */}
                <div id="customHouseholdName" className="mt-4">
                  <FormField>
                    <FormLabel htmlFor="householdName" required>
                      Household Name
                    </FormLabel>
                    <FormInput
                      id="householdName"
                      name="householdName"
                      type="text"
                      defaultValue=""
                      placeholder="Enter your household name"
                      required={true}
                    />
                    {errors.householdName && (
                      <FormError>{errors.householdName}</FormError>
                    )}
                    <FormDescription>
                      Give your household a memorable name (required for custom
                      household)
                    </FormDescription>
                  </FormField>
                </div>

                {/* Invite Code Section */}
                <div id="inviteCodeSection" className="hidden mt-4">
                  <FormField>
                    <FormLabel htmlFor="inviteCode">Invite Code</FormLabel>
                    <FormInput
                      id="inviteCode"
                      name="inviteCode"
                      type="text"
                      defaultValue=""
                      placeholder="Enter household invite code"
                      className="font-mono"
                    />
                    {errors.inviteCode && (
                      <FormError>{errors.inviteCode}</FormError>
                    )}
                    <FormDescription>
                      Enter the invite code provided by a household member
                    </FormDescription>
                  </FormField>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={navigation.state === "submitting"}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {navigation.state === "submitting"
                    ? "Creating Account & Household..."
                    : "Create Account & Household"}
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
