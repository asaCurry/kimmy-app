import type { Route } from "./+types/manage.add-member";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useActionData,
  useNavigation,
  useLoaderData,
  redirect,
} from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { ArrowLeft } from "lucide-react";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { loadHouseholdData } from "~/lib/loader-helpers";
import { userDb } from "~/lib/db";
import { HouseholdmemberForm } from "~/components/manage/household-member-form";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Add Household member - Kimmy" },
    { name: "description", content: "Add a new member to your household" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const env = (context as any).cloudflare?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    // Load household data from URL params
    const { householdId, householdMembers } = await loadHouseholdData(
      request,
      env
    );

    // If no household data found, redirect to welcome
    if (!householdId) {
      console.log("❌ No household data found, redirecting to welcome");
      throw redirect("/welcome");
    }

    return {
      householdId,
      householdMembers,
    };
  } catch (error) {
    console.error("Add member loader error:", error);

    if (error instanceof Response) {
      throw error;
    }

    throw new Response("Failed to load household data", { status: 500 });
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

    // Use the database utilities

    // Create the member data
    const memberData = {
      name: `${firstName} ${lastName}`,
      email:
        memberType === "adult" ? email : `child-${Date.now()}@placeholder.com`, // Children need an email for the database schema
      householdId: currentHouseholdId,
      role: "member",
      relationshipToAdmin: relationship,
      age: dateOfBirth ? calculateAge(new Date(dateOfBirth)) : undefined,
    };

    try {
      // Actually save to database
      const newMember = await userDb.create(env, memberData);

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
  const { householdId, householdMembers } = useLoaderData<typeof loader>();
  const [isSuccess, setIsSuccess] = useState(false);

  // Handle action data changes
  useEffect(() => {
    if (actionData?.success) {
      setIsSuccess(true);
      // Navigate back to management page on success
      setTimeout(() => {
        navigate("/manage");
      }, 1500);
    }
  }, [actionData, navigate]);

  // If we have a household ID but no loader data, redirect to include the household ID in the URL
  if (session?.currentHouseholdId && !householdId) {
    const redirectUrl = `/manage/add-member?householdId=${encodeURIComponent(session.currentHouseholdId)}`;

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

  const handleCancel = () => {
    navigate("/manage");
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
            subtitle="Add a new household member to your household"
          />

          <HouseholdmemberForm
            householdId={householdId || ""}
            onSubmit={() => {}} // Form submission is handled by the Form component
            onCancel={handleCancel}
            isSubmitting={navigation.state === "submitting"}
          />

          {/* Success Message */}
          {isSuccess && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 p-8 rounded-lg text-center max-w-md mx-4">
                <div className="text-green-400 text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Member Added Successfully!
                </h3>
                <p className="text-slate-300 mb-4">
                  The new household member has been added to your household.
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
