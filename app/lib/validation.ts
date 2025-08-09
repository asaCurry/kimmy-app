/**
 * Reusable form validation utilities
 */

import * as React from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
  match?: string; // For password confirmation
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  name: /^[a-zA-Z\s'-]+$/,
  inviteCode: /^[A-Z0-9]{6,12}$/,
} as const;

/**
 * Common validation rules
 */
export const COMMON_RULES = {
  email: {
    required: true,
    pattern: VALIDATION_PATTERNS.email,
  },
  firstName: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: VALIDATION_PATTERNS.name,
  },
  lastName: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: VALIDATION_PATTERNS.name,
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 128,
  },
  householdName: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
} as const;

/**
 * Validate a single field
 */
export function validateField(value: string, rule: ValidationRule, allValues?: Record<string, string>): string | null {
  // Required check
  if (rule.required && !value.trim()) {
    return "This field is required";
  }

  // Skip other validations if field is empty and not required
  if (!value.trim() && !rule.required) {
    return null;
  }

  // Length validations
  if (rule.minLength && value.length < rule.minLength) {
    return `Must be at least ${rule.minLength} character${rule.minLength !== 1 ? 's' : ''}`;
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    return `Must be no more than ${rule.maxLength} character${rule.maxLength !== 1 ? 's' : ''}`;
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    if (rule.pattern === VALIDATION_PATTERNS.email) {
      return "Please enter a valid email address";
    }
    if (rule.pattern === VALIDATION_PATTERNS.name) {
      return "Please enter a valid name (letters, spaces, hyphens, and apostrophes only)";
    }
    return "Invalid format";
  }

  // Match validation (for password confirmation)
  if (rule.match && allValues && value !== allValues[rule.match]) {
    return "Passwords do not match";
  }

  // Custom validation
  if (rule.custom) {
    return rule.custom(value);
  }

  return null;
}

/**
 * Validate an entire form
 */
export function validateForm(values: Record<string, string>, rules: ValidationRules): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const error = validateField(values[field] || '', rule, values);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Hook for form validation
 */
export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateSingleField = (field: string, value: string, allValues: Record<string, string>) => {
    const rule = rules[field];
    if (!rule) return null;

    return validateField(value, rule, allValues);
  };

  const validateAllFields = (values: Record<string, string>) => {
    const result = validateForm(values, rules);
    setErrors(result.errors);
    return result.isValid;
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validateSingleField,
    validateAllFields,
    clearError,
    clearAllErrors,
    hasErrors: Object.keys(errors).length > 0,
  };
}

/**
 * Predefined validation rule sets
 */
export const VALIDATION_RULE_SETS = {
  login: {
    email: COMMON_RULES.email,
    password: { required: true }, // Don't validate length on login
  },
  
  createAccount: {
    firstName: COMMON_RULES.firstName,
    lastName: COMMON_RULES.lastName,
    email: COMMON_RULES.email,
    password: COMMON_RULES.password,
    confirmPassword: {
      required: true,
      match: 'password',
    },
  },
  
  createHousehold: {
    householdName: COMMON_RULES.householdName,
    adminFirstName: COMMON_RULES.firstName,
    adminLastName: COMMON_RULES.lastName,
  },
  
  addMember: {
    firstName: COMMON_RULES.firstName,
    lastName: COMMON_RULES.lastName,
    email: {
      ...COMMON_RULES.email,
      required: false, // Optional for children
    },
    relationship: {
      required: true,
    },
  },
} as const;