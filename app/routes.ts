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
  route("onboarding/create-household", "routes/onboarding.create-household.tsx"),
  
  // Management routes
  route("manage", "routes/manage.tsx"),
  route("manage/add-member", "routes/manage.add-member.tsx"),
  
  // Member record routes
  route("member/:memberId", "routes/member.$memberId.tsx"),
  route("member/:memberId/category/:category", "routes/member.$memberId.category.$category.tsx"),
  route("member/:memberId/category/:category/record/:recordTypeId", "routes/member.$memberId.category.$category.record.$recordTypeId.tsx"),
  
  // API routes
  route("api/family/:familyId/members", "routes/api.family.$familyId.members.tsx"),
] satisfies RouteConfig;
