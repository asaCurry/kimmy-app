/**
 * Permission and access control utilities for household management
 */

import type { 
  HouseholdRole, 
  HouseholdPermissions, 
  HouseholdMember, 
  AuthSession 
} from './types';

/**
 * Get permissions for a user's role within a household
 */
export function getHouseholdPermissions(role: HouseholdRole): HouseholdPermissions {
  switch (role) {
    case 'ADMIN':
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
    
    case 'MEMBER':
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
    
    case 'CHILD':
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
  action: 'view' | 'edit' | 'delete'
): boolean {
  // Children can't access any records (they don't have accounts)
  if (viewerRole === 'CHILD') {
    return false;
  }
  
  // All members (including admins) can view all non-private records in the household
  // For private records, only the creator can access them
  if (action === 'view') {
    return true; // This function doesn't check private status - that's handled by canViewRecord
  }
  
  // Admins can edit/delete any record (including private ones)
  if (viewerRole === 'ADMIN') {
    return true;
  }
  
  // Members can edit/delete records they created or records for children
  if (viewerRole === 'MEMBER') {
    // Can edit their own records
    if (targetMember.userId === viewerUserId) {
      return true;
    }
    
    // Can edit records for children (who don't have user accounts)
    if (targetMember.role === 'CHILD') {
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
  targetMember: HouseholdMember
): boolean {
  // Children can't view any records
  if (viewerRole === 'CHILD') {
    return false;
  }
  
  // If record is not private, all household members can view it
  if (!record.isPrivate) {
    return true;
  }
  
  // For private records, only creator and admins can view
  if (viewerRole === 'ADMIN' || record.createdByUserId === viewerUserId) {
    return true;
  }
  
  return false;
}

/**
 * Check if a user can manage (add/edit/remove) a specific household member
 */
export function canManageHouseholdMember(
  managerRole: HouseholdRole,
  targetMemberRole: HouseholdRole
): boolean {
  // Only admins can manage members
  if (managerRole !== 'ADMIN') {
    return false;
  }
  
  // Admins can manage all member types
  return true;
}

/**
 * Get the current user's role in a specific household
 */
export function getUserRoleInHousehold(
  session: AuthSession,
  householdId: string
): HouseholdRole | null {
  const household = session.households.find(h => h.id === householdId);
  return household?.role || null;
}

/**
 * Check if a user is a member of a specific household
 */
export function isUserInHousehold(
  session: AuthSession,
  householdId: string
): boolean {
  return session.households.some(h => h.id === householdId);
}

/**
 * Get all households where user has admin privileges
 */
export function getAdminHouseholds(session: AuthSession) {
  return session.households.filter(h => h.role === 'ADMIN');
}

/**
 * Validate if a user can create a new household
 * (could add limits here like max households per user)
 */
export function canCreateHousehold(session: AuthSession): boolean {
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
      reason: 'This email is already a member of the household'
    };
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      canInvite: false,
      reason: 'Invalid email address'
    };
  }
  
  return { canInvite: true };
}

/**
 * Get display name for role
 */
export function getRoleDisplayName(role: HouseholdRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'MEMBER':
      return 'Member';
    case 'CHILD':
      return 'Child';
    default:
      return 'Unknown';
  }
}

/**
 * Check if a member type can have an account
 */
export function canHaveAccount(role: HouseholdRole): boolean {
  return role !== 'CHILD';
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
  if (adminRole !== 'ADMIN') return false;
  
  // Children should have child-appropriate relationships
  if (memberRole === 'CHILD') {
    return ['child', 'grandchild'].includes(relationship);
  }
  
  // Adults can have various relationships
  return ['spouse', 'sibling', 'parent', 'grandparent', 'other'].includes(relationship);
}