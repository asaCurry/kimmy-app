import type { Route } from "./+types/manage.edit-member";
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
import { HouseholdmemberEdit } from "~/components/manage/household-member-edit";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Edit Household member - Kimmy" },
    {
      name: "description",
      content: "Edit a household member in your household",
    },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const env = (context as any)?.cloudflare?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const url = new URL(request.url);
    const memberId = url.searchParams.get("memberId");

    if (!memberId) {
      throw new Response("Member ID is required", { status: 400 });
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

    // Find the specific member
    const member = householdMembers.find(m => m.id.toString() === memberId);
    if (!member) {
      throw new Response("Member not found", { status: 404 });
    }

    return {
      householdId,
      householdMembers,
      member,
    };
  } catch (error) {
    console.error("Edit member loader error:", error);

    if (error instanceof Response) {
      throw error;
    }

    throw new Response("Failed to load household data", { status: 500 });
  }
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const env = (context as any)?.cloudflare?.env;

    if (!env?.DB) {
      throw new Response("Database not available", { status: 500 });
    }

    const formData = await request.formData();
    const memberId = formData.get("memberId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const memberType = formData.get("memberType") as "adult" | "child";
    const relationship = formData.get("relationship") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const currentHouseholdId = formData.get("currentHouseholdId") as string;

    // Validation
    if (!memberId || !firstName || !lastName || !relationship) {
      return { error: "Required fields are missing" };
    }

    if (memberType === "adult" && !email) {
      return { error: "Email is required for adult members" };
    }

    if (!currentHouseholdId) {
      return { error: "Household ID is required" };
    }

    // Database member update implementation needed
    return {
      success: true,
      member: {
        id: memberId,
        firstName,
        lastName,
        email,
        memberType,
        relationship,
        dateOfBirth,
      },
    };
  } catch (error) {
    console.error("Edit member action error:", error);

    if (error instanceof Response) {
      throw error;
    }

    return {
      error: error instanceof Error ? error.message : "Failed to update member",
    };
  }
}

const EditMember: React.FC<Route.ComponentProps> = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { householdId, householdMembers, member } =
    useLoaderData<typeof loader>();
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
    const redirectUrl = `/manage/edit-member?householdId=${encodeURIComponent(session.currentHouseholdId)}`;

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

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      navigate("/manage");
    }, 1500);
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
            title="Edit Household member"
            subtitle={`Edit ${member.name} in your household`}
          />

          <HouseholdmemberEdit
            householdId={householdId || ""}
            member={member}
            onCancel={handleCancel}
            onSuccess={handleSuccess}
          />

          {/* Success Message */}
          {isSuccess && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-slate-800 p-8 rounded-lg text-center max-w-md mx-4">
                <div className="text-green-400 text-6xl mb-4">✓</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Member Updated Successfully!
                </h3>
                <p className="text-slate-300 mb-4">
                  {member.name} has been updated in your household.
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

export default EditMember;
