/**
 * Permission and access control utilities for household management
 */

import type {
  HouseholdRole,
  HouseholdPermissions,
  HouseholdMember,
} from "./types";

/**
 * Get permissions for a user's role within a household
 */
export function getHouseholdPermissions(
  role: HouseholdRole
): HouseholdPermissions {
  switch (role) {
    case "ADMIN":
      return {
        canInviteMembers: true,
        canManageMembers: true,
        canCreateRecords: true,
        canViewAllRecords: true,
        canEditAllRecords: true,
        canDeleteRecords: true,
        canManageRecordTypes: true,
        canManageHousehold: true,
      };

    case "MEMBER":
      return {
        canInviteMembers: false,
        canManageMembers: false,
        canCreateRecords: true,
        canViewAllRecords: true,
        canEditAllRecords: false, // Can edit their own records + children's records
        canDeleteRecords: false, // Can delete their own records + children's records
        canManageRecordTypes: false,
        canManageHousehold: false,
      };

    case "CHILD":
      return {
        canInviteMembers: false,
        canManageMembers: false,
        canCreateRecords: false,
        canViewAllRecords: false,
        canEditAllRecords: false,
        canDeleteRecords: false,
        canManageRecordTypes: false,
        canManageHousehold: false,
      };

    default:
      // No permissions for unknown roles
      return {
        canInviteMembers: false,
        canManageMembers: false,
        canCreateRecords: false,
        canViewAllRecords: false,
        canEditAllRecords: false,
        canDeleteRecords: false,
        canManageRecordTypes: false,
        canManageHousehold: false,
      };
  }
}

/**
 * Check if a user can perform a specific action in a household
 */
export function canUserPerformAction(
  userRole: HouseholdRole,
  action: keyof HouseholdPermissions
): boolean {
  const permissions = getHouseholdPermissions(userRole);
  return permissions[action];
}

/**
 * Check if a user can view/edit records for a specific household member
 * Takes into account private records (visible only to creator)
 */
export function canAccessMemberRecords(
  viewerRole: HouseholdRole,
  viewerUserId: string,
  targetMember: HouseholdMember,
  action: "view" | "edit" | "delete"
): boolean {
  // Children can't access any records (they don't have accounts)
  if (viewerRole === "CHILD") {
    return false;
  }

  // All members (including admins) can view all non-private records in the household
  // For private records, only the creator can access them
  if (action === "view") {
    return true; // This function doesn't check private status - that's handled by canViewRecord
  }

  // Admins can edit/delete any record (including private ones)
  if (viewerRole === "ADMIN") {
    return true;
  }

  // Members can edit/delete records they created or records for children
  if (viewerRole === "MEMBER") {
    // Can edit their own records
    if (targetMember.userId === viewerUserId) {
      return true;
    }

    // Can edit records for children (who don't have user accounts)
    if (targetMember.role === "CHILD") {
      return true;
    }

    return false;
  }

  return false;
}

/**
 * Check if a user can view a specific record (considering privacy settings)
 */
export function canViewRecord(
  viewerRole: HouseholdRole,
  viewerUserId: string,
  record: { isPrivate: boolean; createdByUserId: string },
  _targetMember: HouseholdMember
): boolean {
  // Children can't view any records
  if (viewerRole === "CHILD") {
    return false;
  }

  // If record is not private, all household members can view it
  if (!record.isPrivate) {
    return true;
  }

  // For private records, only creator and admins can view
  if (viewerRole === "ADMIN" || record.createdByUserId === viewerUserId) {
    return true;
  }

  return false;
}

/**
 * Check if a user can manage (add/edit/remove) a specific household member
 */
export function canManageHouseholdMember(
  managerRole: HouseholdRole,
  _targetMemberRole: HouseholdRole
): boolean {
  // Only admins can manage members
  if (managerRole !== "ADMIN") {
    return false;
  }

  // Admins can manage all member types
  return true;
}

/**
 * Get the current user's role in a specific household
 */
export function getUserRoleInHousehold(
  session: any, // Using any for now since we have mismatched session types
  householdId: string
): HouseholdRole | null {
  // Handle the actual session structure from auth-db.ts
  if (session.currentHouseholdId === householdId && session.role) {
    // Convert the simple role to HouseholdRole format
    return session.role === "admin" ? "ADMIN" : "MEMBER";
  }

  // Handle the types.ts session structure if it exists
  if (session.households) {
    const household = session.households.find((h: any) => h.id === householdId);
    return household?.role || null;
  }

  return null;
}

/**
 * Check if a user is a member of a specific household
 */
export function isUserInHousehold(
  session: any, // Using any for now since we have mismatched session types
  householdId: string
): boolean {
  // Handle the actual session structure from auth-db.ts
  if (session.currentHouseholdId === householdId) {
    return true;
  }

  // Handle the types.ts session structure if it exists
  if (session.households) {
    return session.households.some((h: any) => h.id === householdId);
  }

  return false;
}

/**
 * Get all households where user has admin privileges
 */
export function getAdminHouseholds(session: any) {
  // Handle the actual session structure from auth-db.ts
  if (session.currentHouseholdId && session.role === "admin") {
    return [{ id: session.currentHouseholdId, role: "ADMIN" }];
  }

  // Handle the types.ts session structure if it exists
  if (session.households) {
    return session.households.filter((h: any) => h.role === "ADMIN");
  }

  return [];
}

/**
 * Validate if a user can create a new household
 * (could add limits here like max households per user)
 */
export function canCreateHousehold(_session: any): boolean {
  // For now, any authenticated user can create a household
  // Could add limits like: max 3 households per user
  return true;
}

/**
 * Validate if an email can be invited to a household
 */
export function canInviteEmail(
  email: string,
  currentMembers: HouseholdMember[]
): { canInvite: boolean; reason?: string } {
  // Check if email is already a member
  const existingMember = currentMembers.find(
    m => m.email?.toLowerCase() === email.toLowerCase() && m.isActive
  );

  if (existingMember) {
    return {
      canInvite: false,
      reason: "This email is already a member of the household",
    };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      canInvite: false,
      reason: "Invalid email address",
    };
  }

  return { canInvite: true };
}

/**
 * Get display name for role
 */
export function getRoleDisplayName(role: HouseholdRole): string {
  switch (role) {
    case "ADMIN":
      return "Administrator";
    case "MEMBER":
      return "Member";
    case "CHILD":
      return "Child";
    default:
      return "Unknown";
  }
}

/**
 * Check if a member type can have an account
 */
export function canHaveAccount(role: HouseholdRole): boolean {
  return role !== "CHILD";
}

/**
 * Validate relationship type based on roles
 */
export function isValidRelationship(
  adminRole: HouseholdRole,
  memberRole: HouseholdRole,
  relationship: string
): boolean {
  // Admin should be 'parent' role conceptually
  if (adminRole !== "ADMIN") return false;

  // Children should have child-appropriate relationships
  if (memberRole === "CHILD") {
    return ["child", "grandchild"].includes(relationship);
  }

  // Adults can have various relationships
  return ["spouse", "sibling", "parent", "grandparent", "other"].includes(
    relationship
  );
}

/**
 * Analytics and Premium Feature Permissions
 */

/**
 * Check if a household has access to analytics features (paid feature)
 */
export function hasAnalyticsAccess(household: {
  hasAnalyticsAccess?: number | null;
}): boolean {
  // Default to true for development/testing while building UI
  // In production, this will check the actual subscription status
  if (
    household.hasAnalyticsAccess === null ||
    household.hasAnalyticsAccess === undefined
  ) {
    return true; // Fallback to true while building UI
  }

  return Boolean(household.hasAnalyticsAccess);
}

/**
 * Check if a user can access analytics for a specific household
 * Combines household subscription status with user role permissions
 */
export function canAccessAnalytics(
  household: { hasAnalyticsAccess?: number | null },
  userRole: HouseholdRole
): { canAccess: boolean; reason?: string } {
  // First check if user role has permission to view analytics
  if (userRole === "CHILD") {
    return {
      canAccess: false,
      reason: "Children cannot access analytics features",
    };
  }

  // Check if household has analytics access (subscription)
  const hasAccess = hasAnalyticsAccess(household);
  if (!hasAccess) {
    return {
      canAccess: false,
      reason:
        "Analytics is a premium feature. Upgrade your plan to access insights and patterns.",
    };
  }

  return { canAccess: true };
}

/**
 * Get premium features available to household
 */
export interface PremiumFeatures {
  analytics: boolean;
  // Add other premium features here in the future
  // aiRecommendations: boolean;
  // exportData: boolean;
  // customReports: boolean;
}

export function getPremiumFeatures(household: {
  hasAnalyticsAccess?: number | null;
}): PremiumFeatures {
  const analyticsAccess = hasAnalyticsAccess(household);

  return {
    analytics: analyticsAccess,
    // Future premium features can be added here
  };
}

/**
 * Check if any premium features require upgrade
 */
export function needsUpgradeForFeatures(household: {
  hasAnalyticsAccess?: number | null;
}): boolean {
  const features = getPremiumFeatures(household);

  // If any premium feature is disabled, user might benefit from upgrade
  return !features.analytics;
}
