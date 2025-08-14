import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Root route - dashboard (contextual based on auth status)
  index("routes/index.tsx"),

  // Welcome route (for unauthenticated users)
  route("welcome", "routes/welcome.tsx"),

  // Authentication routes
  route("login", "routes/login.tsx"),

  // Onboarding routes
  route("onboarding", "routes/onboarding.tsx"),
  route("onboarding/create-account", "routes/onboarding.create-account.tsx"),

  // Management routes
  route("manage", "routes/manage.tsx"),
  route("manage/add-member", "routes/manage.add-member.tsx"),
  route("manage/edit-member", "routes/manage.edit-member.tsx"),

  // API routes
  route(
    "api/invite-codes/regenerate",
    "routes/api.invite-codes.regenerate.tsx"
  ),

  // Member record routes
  route("member/:memberId", "routes/member.$memberId.tsx"),
  route(
    "member/:memberId/category/:category",
    "routes/member.$memberId.category.$category.tsx"
  ),
  route(
    "member/:memberId/manage-categories",
    "routes/member.$memberId.manage-categories.tsx"
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
] satisfies RouteConfig;
