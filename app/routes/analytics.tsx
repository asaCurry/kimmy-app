import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { extractSessionFromCookies } from "~/lib/utils";
import { AnalyticsDashboard } from "~/components/analytics-dashboard";
import { PageLayout, PageHeader } from "~/components/ui/layout";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = (context as any).cloudflare?.env;
  if (!env?.DB) {
    throw new Response("Database not available", { status: 500 });
  }

  // Extract session from cookies
  const session = extractSessionFromCookies(request.headers.get("cookie"));
  if (!session?.userId) {
    return redirect("/login");
  }

  // Check if user is admin
  const isAdmin = session.userId === 1; // Assuming admin user has ID 1

  if (!isAdmin) {
    throw new Response("Admin access required", { status: 403 });
  }

  return Response.json({
    user: session,
    isAdmin,
  });
}

export default function AnalyticsPage() {
  return (
    <PageLayout>
      <PageHeader
        title="System Analytics"
        subtitle="Monitor application performance and usage metrics powered by Cloudflare Analytics Engine"
      />
      <AnalyticsDashboard />
    </PageLayout>
  );
}
