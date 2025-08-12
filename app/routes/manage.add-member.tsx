import type { Route } from "./+types/manage.add-member";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useActionData,
  useNavigation,
  Form,
  useLoaderData,
  redirect,
} from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormError,
  FormDescription,
} from "~/components/ui/form";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import { RELATIONSHIP_TYPES } from "~/lib/types";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { loadFamilyData } from "~/lib/loader-helpers";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Add Family Member - Kimmy" },
    { name: "description", content: "Add a new member to your household" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const env = (context as any).cloudflare?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    // Load family data from URL params
    const { familyId, familyMembers } = await loadFamilyData(request, env);

    // If no family data found, redirect to welcome
    if (!familyId) {
      console.log("❌ No family data found, redirecting to welcome");
      throw redirect("/welcome");
    }

    return {
      familyId,
      familyMembers,
    };
  } catch (error) {
    console.error("Add member loader error:", error);

    if (error instanceof Response) {
      throw error;
    }

    throw new Response("Failed to load family data", { status: 500 });
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const env = (context as any).cloudflare?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const formData = await request.formData();
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const memberType = formData.get("memberType") as "adult" | "child";
    const relationship = formData.get("relationship") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const currentHouseholdId = formData.get("currentHouseholdId") as string;

    // Validation
    if (!firstName || !lastName || !relationship) {
      return { error: "Required fields are missing" };
    }

    if (memberType === "adult" && !email) {
      return { error: "Email is required for adult members" };
    }

    if (!currentHouseholdId) {
      return { error: "Household ID is required" };
    }

    if (!currentHouseholdId.trim()) {
      return { error: "Household ID cannot be empty" };
    }

    // Import the database utilities
    const { userDb } = await import("~/lib/db");

    // Create the member data
    const memberData = {
      name: `${firstName} ${lastName}`,
      email:
        memberType === "adult" ? email : `child-${Date.now()}@placeholder.com`, // Children need an email for the database schema
      familyId: currentHouseholdId,
      role: "member",
      relationshipToAdmin: relationship,
      age: dateOfBirth ? calculateAge(new Date(dateOfBirth)) : undefined,
    };

    try {
      // Actually save to database
      const newMember = await userDb.create(env, memberData);
      console.log("Successfully created member:", newMember);

      return {
        success: true,
        member: {
          firstName,
          lastName,
          email,
          memberType,
          relationship,
          dateOfBirth,
        },
        newMemberId: newMember.id,
      };
    } catch (dbError) {
      console.error("Database error creating member:", dbError);
      return { error: "Failed to save member to database" };
    }
  } catch (error) {
    console.error("Add member action error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return {
      error: error instanceof Error ? error.message : "Failed to add member",
    };
  }
}

// Helper function to calculate age
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    return age - 1;
  }

  return age;
}

const AddMember: React.FC<Route.ComponentProps> = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { familyId, familyMembers } = useLoaderData<typeof loader>();
  const [memberType, setMemberType] = useState<"adult" | "child">("adult");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    relationship: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Handle action data changes (for backward compatibility)
  useEffect(() => {
    if (actionData?.success) {
      setIsSuccess(true);
      setErrors({});

      // Navigate back to management page on success
      setTimeout(() => {
        navigate("/manage");
      }, 1500);
    } else if (actionData?.error) {
      setErrors({ submit: actionData.error });
    }
  }, [actionData, navigate]);

  // If we have a family ID but no loader data, redirect to include the family ID in the URL
  if (session?.currentHouseholdId && !familyId) {
    const redirectUrl = `/manage/add-member?familyId=${encodeURIComponent(session.currentHouseholdId)}`;
    console.log(
      "🔄 Add member route redirecting to include family ID:",
      redirectUrl
    );
    window.location.href = redirectUrl;
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Redirecting...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleMemberTypeChange = (type: "adult" | "child") => {
    setMemberType(type);
    // Reset form when switching types
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      relationship: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (memberType === "adult") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required for adult members";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (memberType === "child" && !formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is helpful for children";
    }

    if (!formData.relationship) {
      newErrors.relationship = "Please specify the relationship";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRelationshipOptions = () => {
    if (memberType === "child") {
      return [
        { value: RELATIONSHIP_TYPES.CHILD, label: "Child" },
        { value: RELATIONSHIP_TYPES.GRANDCHILD, label: "Grandchild" },
      ];
    } else {
      return [
        { value: RELATIONSHIP_TYPES.SPOUSE, label: "Spouse/Partner" },
        { value: RELATIONSHIP_TYPES.SIBLING, label: "Sibling" },
        { value: RELATIONSHIP_TYPES.PARENT, label: "Parent" },
        { value: RELATIONSHIP_TYPES.GRANDPARENT, label: "Grandparent" },
        { value: RELATIONSHIP_TYPES.OTHER, label: "Other" },
      ];
    }
  };

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout maxWidth="2xl">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              to="/manage"
              className="inline-flex items-center text-slate-400 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Management
            </Link>
          </div>

          <PageHeader
            title="Add Household Member"
            subtitle="Add a new family member to your household"
          />

          {/* Member Type Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={memberType === "adult" ? "default" : "outline"}
                onClick={() => handleMemberTypeChange("adult")}
                className={
                  memberType === "adult"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600"
                    : "border-slate-600 text-slate-300 hover:bg-slate-800"
                }
              >
                <Users className="mr-2 h-4 w-4" />
                Adult Member
              </Button>
              <Button
                type="button"
                variant={memberType === "child" ? "default" : "outline"}
                onClick={() => handleMemberTypeChange("child")}
                className={
                  memberType === "child"
                    ? "bg-gradient-to-r from-purple-500 to-pink-600"
                    : "border-slate-600 text-slate-300 hover:bg-slate-800"
                }
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Child
              </Button>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader className="text-center">
              <div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  memberType === "adult"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600"
                    : "bg-gradient-to-r from-purple-500 to-pink-600"
                }`}
              >
                {memberType === "adult" ? (
                  <Users className="h-8 w-8 text-white" />
                ) : (
                  <UserPlus className="h-8 w-8 text-white" />
                )}
              </div>
              <CardTitle className="text-xl text-slate-100">
                {memberType === "adult" ? "Add Adult Member" : "Add Child"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form method="post">
                {/* Hidden fields for form data */}
                <input type="hidden" name="memberType" value={memberType} />
                <input
                  type="hidden"
                  name="currentHouseholdId"
                  value={familyId || ""}
                />

                {errors.submit && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{errors.submit}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField>
                    <FormLabel htmlFor="firstName" required>
                      First Name
                    </FormLabel>
                    <FormInput
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={e =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter first name"
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
                      value={formData.lastName}
                      onChange={e =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <FormError>{errors.lastName}</FormError>
                    )}
                  </FormField>
                </div>

                {memberType === "adult" && (
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
                      placeholder="Enter email address"
                    />
                    {errors.email && <FormError>{errors.email}</FormError>}
                    <FormDescription>
                      Email is required for adult members to access the system
                    </FormDescription>
                  </FormField>
                )}

                {memberType === "child" && (
                  <FormField>
                    <FormLabel htmlFor="dateOfBirth">Date of Birth</FormLabel>
                    <FormInput
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={e =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                    />
                    {errors.dateOfBirth && (
                      <FormError>{errors.dateOfBirth}</FormError>
                    )}
                    <FormDescription>
                      Date of birth helps with age-appropriate features and
                      records
                    </FormDescription>
                  </FormField>
                )}

                <FormField>
                  <FormLabel htmlFor="relationship" required>
                    Relationship
                  </FormLabel>
                  <FormSelect
                    id="relationship"
                    name="relationship"
                    value={formData.relationship}
                    onChange={e =>
                      handleInputChange("relationship", e.target.value)
                    }
                  >
                    <option value="">Select relationship</option>
                    {getRelationshipOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </FormSelect>
                  {errors.relationship && (
                    <FormError>{errors.relationship}</FormError>
                  )}
                </FormField>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={navigation.state === "submitting"}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {navigation.state === "submitting"
                      ? "Adding Member..."
                      : "Add Member"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/manage")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>

          {/* Success Message */}
          {isSuccess && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 p-8 rounded-lg text-center max-w-md mx-4">
                <div className="text-green-400 text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Member Added Successfully!
                </h3>
                <p className="text-slate-300 mb-4">
                  {formData.firstName} {formData.lastName} has been added to
                  your household.
                </p>
                <p className="text-slate-400 text-sm">
                  Redirecting to management page...
                </p>
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    </RequireAuth>
  );
};

export default AddMember;
