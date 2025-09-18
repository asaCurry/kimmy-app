import type { LoaderFunctionArgs } from "react-router";
import { Gallery } from "~/components/gallery";
import { getValidatedEnv } from "~/lib/env.server";
import { PageLayout, PageHeader } from "~/components/ui/layout";

const demoSlides = [
  {
    id: 1,
    title: "Welcome to Kimmy App",
    content: `# Welcome to Kimmy App

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Key Features
- Track household activities
- Manage family members
- Generate insights
- Create custom records`,
    image: null,
  },
  {
    id: 2,
    title: "Household Management",
    content: `# Household Management

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

- Add and manage family members
- Set permissions and roles
- Track member activities
- Generate household reports`,
    image: "/images/demo-household.png",
  },
  {
    id: 3,
    title: "Custom Tracking",
    content: `# Custom Tracking System

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

### Features:
1. **Dynamic Record Types** - Create custom forms
2. **Categories** - Organize your data
3. **Timeline Views** - See progress over time
4. **Export Options** - Download your data`,
    image: null,
  },
  {
    id: 4,
    title: "Insights & Analytics",
    content: `# Insights & Analytics

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## What you can track:
- Behavioral patterns
- Progress metrics
- Usage statistics
- Custom KPIs

> Get actionable insights from your household data`,
    image: "/images/demo-analytics.png",
  },
];

export async function loader({ context }: LoaderFunctionArgs) {
  const env = getValidatedEnv(context);

  // Only allow demo route in development environment
  if (env.ENVIRONMENT !== "development") {
    throw new Response("Not Found", { status: 404 });
  }

  return null;
}

export default function Demo() {
  return (
    <PageLayout>
      <PageHeader
        title="Kimmy App Demo"
        subtitle="Discover what makes our household management platform unique"
      />

      <div className="space-y-6">
        <Gallery slides={demoSlides} />
      </div>
    </PageLayout>
  );
}
