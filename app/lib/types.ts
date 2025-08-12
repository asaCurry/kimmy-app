/**
 * Core data model types for the Hey, Kimmy household management system
 */

// User account types
export interface User {
  id: string; // UUID
  email: string;
  firstName: string;
  lastName: string;
  hashedPassword: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

// Household types
export interface Household {
  id: string; // UUID
  name: string; // e.g., "The Johnson Family"
  inviteCode: string; // Unique code for joining
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Household member types
export type HouseholdRole = "ADMIN" | "MEMBER" | "CHILD";
export type RelationshipType =
  | "parent"
  | "child"
  | "spouse"
  | "sibling"
  | "grandparent"
  | "grandchild"
  | "other";

export interface HouseholdMember {
  id: string; // UUID
  householdId: string;
  userId?: string; // Null for children without accounts
  firstName: string;
  lastName: string;
  email?: string; // Null for children
  dateOfBirth?: Date;
  role: HouseholdRole;
  relationshipToAdmin: RelationshipType;
  hasAccount: boolean; // Whether they have a User account
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Extended member info with household and user details
export interface HouseholdMemberWithDetails extends HouseholdMember {
  household: Household;
  user?: UserProfile;
  fullName: string; // Computed: firstName + lastName
  age?: number; // Computed from dateOfBirth
  canManageRecords: boolean; // Computed: role !== 'CHILD'
}

// Invitation system
export interface Invitation {
  id: string; // UUID
  householdId: string;
  email: string;
  role: Exclude<HouseholdRole, "CHILD">; // Children don't get invitations
  invitedByUserId: string;
  token: string; // Unique invitation token
  expiresAt: Date;
  acceptedAt?: Date;
  isUsed: boolean;
  createdAt: Date;
}

// Record types (form templates)
export interface FormField {
  id: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "checkbox"
    | "file"
    | "email"
    | "phone";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    maxLength?: number;
    minLength?: number;
  };
  helpText?: string;
}

export interface RecordType {
  id: string; // UUID
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category: string;
  fields: FormField[];
  isSystemType: boolean; // Built-in vs household-custom
  householdId?: string; // Null for system types
  allowPrivate: boolean; // Whether this record type supports private records
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Actual records
export interface Record {
  id: string; // UUID
  householdMemberId: string;
  recordTypeId: string;
  title: string;
  data: Record<string, any>; // Form field values
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  isPrivate: boolean; // false = visible to household, true = visible only to creator
  tags: string[];
}

export interface RecordWithDetails extends Record {
  householdMember: HouseholdMemberWithDetails;
  recordType: RecordType;
  createdBy: UserProfile;
}

// Authentication & Authorization
export interface AuthSession {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  currentHouseholdId?: string;
  households: Array<{
    id: string;
    name: string;
    role: HouseholdRole;
  }>;
}

export interface HouseholdPermissions {
  canInviteMembers: boolean;
  canManageMembers: boolean;
  canCreateRecords: boolean;
  canViewAllRecords: boolean;
  canEditAllRecords: boolean;
  canDeleteRecords: boolean;
  canManageRecordTypes: boolean;
  canManageHousehold: boolean;
}

// API request/response types
export interface CreateHouseholdRequest {
  name: string;
  adminFirstName: string;
  adminLastName: string;
}

export interface CreateHouseholdResponse {
  household: Household;
  member: HouseholdMember;
  inviteCode: string;
}

export interface InviteMemberRequest {
  email: string;
  role: Exclude<HouseholdRole, "CHILD">;
  firstName?: string;
  lastName?: string;
}

export interface AddChildRequest {
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // ISO date string
  relationshipToAdmin: RelationshipType;
}

export interface JoinHouseholdRequest {
  inviteCode?: string;
  invitationToken?: string;
  firstName: string;
  lastName: string;
}

// Utility types
export type HouseholdMemberFilter = {
  role?: HouseholdRole;
  hasAccount?: boolean;
  isActive?: boolean;
  ageRange?: { min?: number; max?: number };
};

export type RecordFilter = {
  memberId?: string;
  recordTypeId?: string;
  category?: string;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  isPrivate?: boolean;
};

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export class HouseholdError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "HouseholdError";
  }
}

// Constants
export const HOUSEHOLD_ROLES = {
  ADMIN: "ADMIN" as const,
  MEMBER: "MEMBER" as const,
  CHILD: "CHILD" as const,
};

export const RELATIONSHIP_TYPES = {
  PARENT: "parent" as const,
  CHILD: "child" as const,
  SPOUSE: "spouse" as const,
  SIBLING: "sibling" as const,
  GRANDPARENT: "grandparent" as const,
  GRANDCHILD: "grandchild" as const,
  OTHER: "other" as const,
} as const;
