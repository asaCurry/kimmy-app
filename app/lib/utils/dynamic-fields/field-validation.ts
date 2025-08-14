import type { DynamicField } from "../../types/dynamic-fields";

export const validateFieldValue = (field: DynamicField, value: any): { isValid: boolean; error?: string } => {
  if (field.required && (value === null || value === undefined || value === "")) {
    return { isValid: false, error: `${field.label} is required` };
  }

  if (!field.validation || value === null || value === undefined || value === "") {
    return { isValid: true };
  }

  const { validation } = field;

  // Validate number fields
  if (field.type === "number") {
    return validateNumberField(field, value, validation);
  }

  // Validate text-based fields
  if (field.type === "text" || field.type === "textarea" || field.type === "email" || field.type === "url" || field.type === "phone") {
    return validateTextField(field, value, validation);
  }

  return { isValid: true };
};

const validateNumberField = (field: DynamicField, value: any, validation: any): { isValid: boolean; error?: string } => {
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: `${field.label} must be a valid number` };
  }
  
  if (validation.min !== undefined && numValue < validation.min) {
    return { isValid: false, error: `${field.label} must be at least ${validation.min}` };
  }
  
  if (validation.max !== undefined && numValue > validation.max) {
    return { isValid: false, error: `${field.label} must be at most ${validation.max}` };
  }
  
  return { isValid: true };
};

const validateTextField = (field: DynamicField, value: any, validation: any): { isValid: boolean; error?: string } => {
  const strValue = String(value);
  
  if (validation.minLength !== undefined && strValue.length < validation.minLength) {
    return { isValid: false, error: `${field.label} must be at least ${validation.minLength} characters` };
  }
  
  if (validation.maxLength !== undefined && strValue.length > validation.maxLength) {
    return { isValid: false, error: `${field.label} must be at most ${validation.maxLength} characters` };
  }
  
  if (validation.pattern && !new RegExp(validation.pattern).test(strValue)) {
    return { isValid: false, error: `${field.label} format is invalid` };
  }
  
  return { isValid: true };
};

export const validateMultipleFields = (fields: DynamicField[], values: Record<string, any>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  fields.forEach(field => {
    const fieldKey = `field_${field.id}`;
    const value = values[fieldKey];
    const validation = validateFieldValue(field, value);
    
    if (!validation.isValid) {
      errors[fieldKey] = validation.error || "Invalid field";
      isValid = false;
    }
  });

  return { isValid, errors };
};
