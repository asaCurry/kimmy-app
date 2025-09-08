import * as React from "react";

export interface InputValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
}

export interface InputState {
  value: string;
  error?: string;
  warning?: string;
  isValid: boolean;
  isFocused: boolean;
  isInteracting: boolean;
}

export interface UseInputStateOptions {
  initialValue?: string;
  validation?: InputValidation;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useInputState(options: UseInputStateOptions = {}) {
  const {
    initialValue = "",
    validation,
    onChange,
    onBlur,
    onFocus,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  const [state, setState] = React.useState<InputState>({
    value: String(initialValue || ""),
    isValid: true,
    isFocused: false,
    isInteracting: false,
  });

  const validate = React.useCallback(
    (value: string): { isValid: boolean; error?: string; warning?: string } => {
      if (!validation) return { isValid: true };

      // Ensure value is a string
      const stringValue = String(value || "");

      // Required validation
      if (validation.required && !stringValue.trim()) {
        return { isValid: false, error: "This field is required" };
      }

      // Skip other validations if empty (unless required)
      if (!stringValue.trim()) return { isValid: true };

      // Length validations
      if (validation.minLength && stringValue.length < validation.minLength) {
        return {
          isValid: false,
          error: `Must be at least ${validation.minLength} characters`,
        };
      }

      if (validation.maxLength) {
        if (stringValue.length > validation.maxLength) {
          return {
            isValid: false,
            error: `Must be no more than ${validation.maxLength} characters`,
          };
        }
        // Warning when approaching limit
        if (stringValue.length > validation.maxLength * 0.8) {
          return {
            isValid: true,
            warning: `${validation.maxLength - stringValue.length} characters remaining`,
          };
        }
      }

      // Number validations
      if (
        (validation.min !== undefined || validation.max !== undefined) &&
        stringValue
      ) {
        const numValue = Number(stringValue);
        if (!isNaN(numValue)) {
          if (validation.min !== undefined && numValue < validation.min) {
            return {
              isValid: false,
              error: `Must be at least ${validation.min}`,
            };
          }
          if (validation.max !== undefined && numValue > validation.max) {
            return {
              isValid: false,
              error: `Must be no more than ${validation.max}`,
            };
          }
        }
      }

      // Pattern validation
      if (validation.pattern && stringValue) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(stringValue)) {
          return { isValid: false, error: "Invalid format" };
        }
      }

      return { isValid: true };
    },
    [validation]
  );

  const handleChange = React.useCallback(
    (value: string) => {
      const stringValue = String(value || "");
      const validationResult = validateOnChange
        ? validate(stringValue)
        : { isValid: true };

      setState(prev => ({
        ...prev,
        value: stringValue,
        ...validationResult,
      }));

      onChange?.(stringValue);
    },
    [validate, validateOnChange, onChange]
  );

  const handleFocus = React.useCallback(() => {
    setState(prev => ({ ...prev, isFocused: true }));
    onFocus?.();
  }, [onFocus]);

  const handleBlur = React.useCallback(() => {
    const validationResult = validateOnBlur
      ? validate(state.value)
      : { isValid: state.isValid };

    setState(prev => ({
      ...prev,
      isFocused: false,
      isInteracting: false,
      ...validationResult,
    }));

    onBlur?.();
  }, [validate, validateOnBlur, onBlur, state.value]);

  const setInteracting = React.useCallback((isInteracting: boolean) => {
    setState(prev => ({ ...prev, isInteracting }));
  }, []);

  const setValue = React.useCallback(
    (value: string) => {
      handleChange(value);
    },
    [handleChange]
  );

  const reset = React.useCallback(() => {
    setState({
      value: String(initialValue || ""),
      isValid: true,
      isFocused: false,
      isInteracting: false,
    });
  }, [initialValue]);

  return {
    ...state,
    handleChange,
    handleFocus,
    handleBlur,
    setInteracting,
    setValue,
    reset,
    validate: (value?: string) => validate(value ?? state.value),
  };
}
