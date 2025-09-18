import * as React from "react";
import { cn } from "~/lib/utils";
import { useInputState, type InputValidation } from "~/hooks/use-input-state";
import { getInputClasses } from "~/lib/ui/input-styles";
import { Label } from "./label";

// Base props shared by all form field components
export interface BaseFormFieldProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
  validation?: InputValidation;
}

// Enhanced input component with all features
export interface UnifiedInputProps
  extends BaseFormFieldProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  clearable?: boolean;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
}

export const UnifiedInput = React.forwardRef<
  HTMLInputElement,
  UnifiedInputProps
>(
  (
    {
      label,
      description,
      error: externalError,
      required,
      disabled,
      className,
      size = "default",
      validation,
      icon,
      iconPosition = "left",
      clearable,
      type = "text",
      value: externalValue,
      defaultValue,
      onChange,
      onValidationChange,
      onFocus,
      onBlur,
      name,
      ...props
    },
    ref
  ) => {
    const {
      value,
      error: internalError,
      warning,
      isValid,
      isFocused,
      handleChange,
      handleFocus,
      handleBlur,
      setValue,
    } = useInputState({
      initialValue: (externalValue as string) || (defaultValue as string) || "",
      validation: { ...validation, required },
      onChange,
      onFocus: onFocus
        ? () => {
            const mockEvent = {
              target: { name: name || "", value: "" },
            } as React.FocusEvent<HTMLInputElement>;
            onFocus(mockEvent);
          }
        : undefined,
      onBlur: onBlur
        ? () => {
            const mockEvent = {
              target: { name: name || "", value: "" },
            } as React.FocusEvent<HTMLInputElement>;
            onBlur(mockEvent);
          }
        : undefined,
      validateOnChange: true,
      validateOnBlur: true,
    });

    // Use external error if provided, otherwise use internal error
    const displayError = externalError || internalError;
    const fieldState = displayError
      ? "error"
      : warning
        ? "warning"
        : value && isValid
          ? "success"
          : "default";

    const hasIcon = icon || clearable;
    const iconConfig = hasIcon
      ? clearable && value && !disabled
        ? "right"
        : iconPosition
      : false;

    // Notify parent of validation state changes
    React.useEffect(() => {
      onValidationChange?.(isValid, displayError);
    }, [isValid, displayError, onValidationChange]);

    // Sync with external value changes
    React.useEffect(() => {
      if (externalValue !== undefined && externalValue !== value) {
        setValue(externalValue as string);
      }
    }, [externalValue, value]);

    const generatedId = React.useId();
    const inputId = props.id || `input-${generatedId}`;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={inputId} className="text-slate-200">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Label>
        )}

        <div className="relative">
          {/* Left icon */}
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            value={value}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => handleFocus()}
            onBlur={() => handleBlur()}
            disabled={disabled}
            className={getInputClasses({
              size,
              state: fieldState,
              hasIcon: iconConfig,
              className: undefined,
            })}
            aria-invalid={!!displayError}
            aria-describedby={cn(
              description && `${inputId}-description`,
              (displayError || warning) && `${inputId}-message`
            )}
            {...props}
          />

          {/* Right icon */}
          {icon && iconPosition === "right" && !clearable && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Clear button */}
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-200 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Clear input"
              tabIndex={-1}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Description */}
        {description && (
          <p id={`${inputId}-description`} className="text-xs text-slate-400">
            {description}
          </p>
        )}

        {/* Error/Warning/Success message */}
        {(displayError || warning) && (
          <div
            id={`${inputId}-message`}
            className={cn(
              "mt-1 text-xs flex items-center gap-1",
              displayError ? "text-red-400" : "text-yellow-400"
            )}
          >
            <span className="text-sm">{displayError ? "⚠️" : "💡"}</span>
            {displayError || warning}
          </div>
        )}

        {/* Character count for text inputs */}
        {validation?.maxLength && type === "text" && (
          <div className="text-xs text-right">
            <span
              className={cn(
                "transition-colors",
                value.length > validation.maxLength
                  ? "text-red-400"
                  : value.length > validation.maxLength * 0.8
                    ? "text-yellow-400"
                    : "text-slate-400"
              )}
            >
              {value.length}/{validation.maxLength}
            </span>
          </div>
        )}
      </div>
    );
  }
);

UnifiedInput.displayName = "UnifiedInput";

// Enhanced textarea component
export interface UnifiedTextareaProps
  extends BaseFormFieldProps,
    Omit<
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
      "size" | "onChange"
    > {
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  resizable?: boolean;
}

export const UnifiedTextarea = React.forwardRef<
  HTMLTextAreaElement,
  UnifiedTextareaProps
>(
  (
    {
      label,
      description,
      error: externalError,
      required,
      disabled,
      className,
      size = "default",
      validation,
      value: externalValue,
      defaultValue,
      onChange,
      onValidationChange,
      onFocus,
      onBlur,
      name,
      resizable = false,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const {
      value,
      error: internalError,
      warning,
      isValid,
      handleChange,
      handleFocus,
      handleBlur,
      setValue,
    } = useInputState({
      initialValue: (externalValue as string) || (defaultValue as string) || "",
      validation: { ...validation, required },
      onChange,
      onFocus: onFocus
        ? () => {
            const mockEvent = {
              target: { name: name || "", value: "" },
            } as React.FocusEvent<HTMLTextAreaElement>;
            onFocus(mockEvent);
          }
        : undefined,
      onBlur: onBlur
        ? () => {
            const mockEvent = {
              target: { name: name || "", value: "" },
            } as React.FocusEvent<HTMLTextAreaElement>;
            onBlur(mockEvent);
          }
        : undefined,
      validateOnChange: true,
      validateOnBlur: true,
    });

    const displayError = externalError || internalError;
    const fieldState = displayError
      ? "error"
      : warning
        ? "warning"
        : value && isValid
          ? "success"
          : "default";

    React.useEffect(() => {
      onValidationChange?.(isValid, displayError);
    }, [isValid, displayError, onValidationChange]);

    React.useEffect(() => {
      if (externalValue !== undefined && externalValue !== value) {
        setValue(externalValue as string);
      }
    }, [externalValue, value]);

    const generatedId = React.useId();
    const inputId = props.id || `textarea-${generatedId}`;

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <Label htmlFor={inputId} className="text-slate-200">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => handleFocus()}
          onBlur={() => handleBlur()}
          disabled={disabled}
          rows={rows}
          className={getInputClasses({
            size,
            state: fieldState,
            variant: "textarea",
            className: resizable ? "resize-y" : undefined,
          })}
          aria-invalid={!!displayError}
          aria-describedby={cn(
            description && `${inputId}-description`,
            (displayError || warning) && `${inputId}-message`
          )}
          {...props}
        />

        {description && (
          <p id={`${inputId}-description`} className="text-xs text-slate-400">
            {description}
          </p>
        )}

        {(displayError || warning) && (
          <div
            id={`${inputId}-message`}
            className={cn(
              "mt-1 text-xs flex items-center gap-1",
              displayError ? "text-red-400" : "text-yellow-400"
            )}
          >
            <span className="text-sm">{displayError ? "⚠️" : "💡"}</span>
            {displayError || warning}
          </div>
        )}

        {validation?.maxLength && (
          <div className="text-xs text-right">
            <span
              className={cn(
                "transition-colors",
                value.length > validation.maxLength
                  ? "text-red-400"
                  : value.length > validation.maxLength * 0.8
                    ? "text-yellow-400"
                    : "text-slate-400"
              )}
            >
              {value.length}/{validation.maxLength}
            </span>
          </div>
        )}
      </div>
    );
  }
);

UnifiedTextarea.displayName = "UnifiedTextarea";

export { getInputClasses, INPUT_STYLES } from "~/lib/ui/input-styles";
