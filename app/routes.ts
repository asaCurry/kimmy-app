import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Root route - dashboard (contextual based on auth status)
  index("routes/index.tsx"),

  // Welcome route (for unauthenticated users)
  route("welcome", "routes/welcome.tsx"),

  // Authentication routes
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),

  // User settings
  route("settings", "routes/settings.tsx"),

  // Onboarding routes
  route("onboarding", "routes/onboarding.tsx"),
  route("onboarding/create-account", "routes/onboarding.create-account.tsx"),

  // Management routes
  route("manage", "routes/manage.tsx"),
  route("manage/add-member", "routes/manage.add-member.tsx"),
  route("manage/edit-member", "routes/manage.edit-member.tsx"),

  // Trackers route (general household view)
  route("trackers", "routes/trackers.tsx"),

  // Insights route (analytics and patterns)
  route("insights", "routes/insights.tsx"),

  // Analytics dashboard (admin only)
  route("analytics", "routes/analytics.tsx"),

  // Demo presentation
  route("demo", "routes/demo.tsx"),

  // Household records management
  route("household-records", "routes/household-records.tsx"),

  // API routes
  route(
    "api/invite-codes/regenerate",
    "routes/api.invite-codes.regenerate.tsx"
  ),
  route("api/tracker-entries", "routes/api.tracker-entries.tsx"),
  route("api/password-reset", "routes/api.password-reset.tsx"),
  route("api/auto-completion", "routes/api.auto-completion.tsx"),
  route("api/cloudflare-analytics", "routes/api.cloudflare-analytics.tsx"),
  route("api/performance-metrics", "routes/api.performance-metrics.tsx"),
  route(
    "api/admin/password-reset-rate-limit",
    "routes/api.admin.password-reset-rate-limit.tsx"
  ),

  // Member record routes
  route("member/:memberId", "routes/member.$memberId.tsx"),
  route("member/:memberId/records", "routes/member.$memberId.records.tsx"),
  route(
    "member/:memberId/category/:category",
    "routes/member.$memberId.category.$category.tsx"
  ),
  route(
    "member/:memberId/manage-categories",
    "routes/member.$memberId.manage-categories.tsx"
  ),
  route("member/:memberId/trackers", "routes/member.$memberId.trackers.tsx"),
  route(
    "member/:memberId/tracker/:trackerId",
    "routes/member.$memberId.tracker.$trackerId.tsx"
  ),

  route(
    "member/:memberId/category/:category/record/:recordTypeId",
    "routes/member.$memberId.category.$category.record.$recordTypeId.tsx"
  ),
  route(
    "member/:memberId/category/:category/record/:recordTypeId/view/:recordId",
    "routes/member.$memberId.category.$category.record.$recordTypeId.view.$recordId.tsx"
  ),
  route(
    "member/:memberId/category/:category/record/:recordTypeId/edit/:recordId",
    "routes/member.$memberId.category.$category.record.$recordTypeId.edit.$recordId.tsx"
  ),
  route(
    "member/:memberId/category/:category/create-record-type",
    "routes/member.$memberId.category.$category.create-record-type.tsx"
  ),
  route(
    "member/:memberId/category/:category/edit-record-type/:recordTypeId",
    "routes/member.$memberId.category.$category.edit-record-type.$recordTypeId.tsx"
  ),
] satisfies RouteConfig;
