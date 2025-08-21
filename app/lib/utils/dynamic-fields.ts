// Re-export all utilities from the modular structure
export * from "./dynamic-fields/index";

// Legacy exports for backward compatibility
// These will be removed in future versions
import {
  createFieldId,
  createDefaultField,
  getFieldTypeConfig,
  getDefaultValueForType,
  getDefaultValidationForType,
  validateFieldValue,
  parseSelectOptions,
  formatSelectOptions,
  reorderFields,
  serializeFields,
  deserializeFields,
} from "./dynamic-fields/index";

export {
  createFieldId,
  createDefaultField,
  getFieldTypeConfig,
  getDefaultValueForType,
  getDefaultValidationForType,
  validateFieldValue,
  parseSelectOptions,
  formatSelectOptions,
  reorderFields,
  serializeFields,
  deserializeFields,
};
