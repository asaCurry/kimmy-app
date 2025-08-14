// Database
export { getDatabase } from "./db-utils";
export { userDb, householdDb, inviteCodeDb } from "./db";
export { authApi } from "./auth-db";

// Loaders and Helpers
export { loadHouseholdDataWithMember } from "./loader-helpers";

// Validation
export { validateField, validateForm, VALIDATION_PATTERNS, COMMON_RULES } from "./validation";

// Utilities
export { cn, parseCookies, extractEnv, isDatabaseAvailable, extractSessionFromCookies } from "./utils";

// Error Handling
export { logError, logApiError, logComponentError, logActionError, safeAsync } from "./error-utils";

// Permissions
export { getHouseholdPermissions, canUserPerformAction, canAccessMemberRecords } from "./permissions";

// Types
export type { 
  User,
  UserProfile,
  Household,
  HouseholdMember,
  HouseholdMemberWithDetails,
  HouseholdRole,
  RelationshipType,
  Invitation,
  FormField,
  Record,
  RecordType
} from "./types";

export type { 
  DynamicField,
  DynamicFieldConfig,
  FieldType,
  FieldValidation,
  SelectOption,
  FieldValue,
  RecordData
} from "./types/dynamic-fields";

// Dynamic Fields
export { 
  createFieldId,
  createDefaultField,
  getFieldTypeConfig,
  getDefaultValueForType,
  getDefaultValidationForType,
  reorderFields,
  sortFieldsByOrder,
  getActiveFields,
  getFieldsByType,
  duplicateField,
  toggleFieldActive,
  validateFieldValue,
  validateMultipleFields,
  serializeFields,
  deserializeFields,
  serializeFieldConfig,
  deserializeFieldConfig,
  createRecordSchema,
  createFieldValidationSchema,
  validateFieldAgainstSchema
} from "./utils/dynamic-fields";
