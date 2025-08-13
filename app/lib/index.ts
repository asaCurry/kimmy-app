// Database
export { getDatabase } from "./db-utils";
export { db } from "./db";
export { authDb } from "./auth-db";

// Loaders and Helpers
export { loadHouseholdDataWithMember } from "./loader-helpers";

// Validation
export { validateRecordType, validateRecord } from "./validation";

// Utilities
export { cn, formatDate, formatRelativeTime } from "./utils";
export { generateSlug, sanitizeInput } from "./utils";

// Error Handling
export { handleError, createErrorResponse } from "./error-utils";

// Permissions
export { checkPermission, Permission } from "./permissions";

// Types
export type { 
  DynamicField, 
  DynamicFieldType, 
  DynamicFieldValidation,
  DynamicFieldOption 
} from "./types";
export type { 
  DynamicFieldConfig,
  DynamicFieldValue 
} from "./types/dynamic-fields";

// Dynamic Fields
export { 
  getFieldValue, 
  setFieldValue, 
  validateFieldValue 
} from "./utils/dynamic-fields";
