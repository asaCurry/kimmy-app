import * as React from "react";
import { cn } from "~/lib/utils";
import type { UseFormRegisterReturn } from "react-hook-form";
import { validateFieldValue } from "~/lib/utils/dynamic-fields/schema-generation";

// Interface for the field prop that's actually passed to this component
interface FormFieldProps {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: any[]; // Changed from string[] to any[] to handle both string and object options
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  register: UseFormRegisterReturn;
  error?: any;
  helpText?: string;
}

// Shared form field styling constants
const FORM_FIELD_STYLES = {
  base: "flex h-10 w-full rounded-md border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
  textarea: "min-h-[80px] resize-none",
  checkbox:
    "rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 transition-colors duration-200",
  error: "border-red-500 focus-visible:ring-red-500 bg-red-900/20",
  warning: "border-yellow-500 focus-visible:ring-yellow-500 bg-yellow-900/20",
  success: "border-green-500 focus-visible:ring-green-500 bg-green-900/20",
} as const;

interface DynamicFieldProps {
  field: FormFieldProps;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({ field }) => {
  const [value, setValue] = React.useState("");
  const [validationState, setValidationState] = React.useState<{
    isValid: boolean;
    error?: string;
    warning?: string;
  }>({ isValid: true });

  // Real-time validation
  React.useEffect(() => {
    if (value && field.validation) {
      // Create a minimal field object for validation
      const fieldForValidation = {
        id: field.id,
        name: field.label,
        label: field.label,
        type: field.type as any,
        required: field.required || false,
        validation: field.validation,
        order: 0,
        isActive: true,
      };

      const validation = validateFieldValue(fieldForValidation, value);
      setValidationState(validation);
    } else {
      setValidationState({ isValid: true });
    }
  }, [
    value,
    field.validation,
    field.id,
    field.label,
    field.type,
    field.required,
  ]);

  const handleValueChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setValue(e.target.value);
  };

  // Determine field state for styling
  const getFieldState = () => {
    if (field.error || validationState.error) return "error";
    if (validationState.warning) return "warning";
    if (value && validationState.isValid && !validationState.warning)
      return "success";
    return "default";
  };

  const fieldState = getFieldState();

  const baseClasses = cn(
    FORM_FIELD_STYLES.base,
    fieldState === "error" && FORM_FIELD_STYLES.error,
    fieldState === "warning" && FORM_FIELD_STYLES.warning,
    fieldState === "success" && FORM_FIELD_STYLES.success
  );

  // Helper function to render validation message
  const renderValidationMessage = () => {
    const message =
      field.error?.message || validationState.error || validationState.warning;
    const type = field.error || validationState.error ? "error" : "warning";

    if (!message) return null;

    return (
      <div
        className={cn(
          "mt-1 text-xs flex items-center gap-1",
          type === "error" ? "text-red-400" : "text-yellow-400"
        )}
      >
        <span className="text-sm">{type === "error" ? "⚠️" : "💡"}</span>
        {message}
      </div>
    );
  };

  // Helper function to render character count
  const renderCharacterCount = () => {
    if (
      !field.validation?.maxLength ||
      field.type === "checkbox" ||
      field.type === "select"
    )
      return null;

    const currentLength = value.length;
    const maxLength = field.validation.maxLength;
    const isNearLimit = currentLength > maxLength * 0.8;
    const isOverLimit = currentLength > maxLength;

    return (
      <div
        className={cn(
          "mt-1 text-xs text-right",
          isOverLimit
            ? "text-red-400"
            : isNearLimit
              ? "text-yellow-400"
              : "text-slate-400"
        )}
      >
        {currentLength}/{maxLength}
      </div>
    );
  };

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-1">
          <textarea
            {...field.register}
            onChange={e => {
              field.register.onChange(e);
              handleValueChange(e);
            }}
            className={cn(baseClasses, FORM_FIELD_STYLES.textarea)}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            rows={4}
            aria-describedby={`${field.id}-help ${field.id}-error`}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="text-xs text-slate-400">
              {field.helpText}
            </p>
          )}
          {renderValidationMessage()}
          {renderCharacterCount()}
        </div>
      );

    case "select":
      return (
        <div className="space-y-1">
          <select
            {...field.register}
            onChange={e => {
              field.register.onChange(e);
              handleValueChange(e);
            }}
            className={baseClasses}
            aria-describedby={`${field.id}-help ${field.id}-error`}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map((option: any) => {
              // Handle both string and object options
              if (typeof option === "string") {
                return (
                  <option
                    key={option}
                    value={option}
                    className="bg-slate-800 text-slate-100"
                  >
                    {option}
                  </option>
                );
              } else if (
                option &&
                typeof option === "object" &&
                option.value &&
                option.label
              ) {
                return (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-slate-800 text-slate-100"
                  >
                    {option.label}
                  </option>
                );
              }
              return null;
            })}
          </select>
          {field.helpText && (
            <p id={`${field.id}-help`} className="text-xs text-slate-400">
              {field.helpText}
            </p>
          )}
          {renderValidationMessage()}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...field.register}
              onChange={e => {
                field.register.onChange(e);
                setValue(e.target.checked ? "true" : "false");
              }}
              className={FORM_FIELD_STYLES.checkbox}
              aria-describedby={`${field.id}-help ${field.id}-error`}
            />
            <span className="text-sm text-slate-300">
              {field.placeholder || field.label}
            </span>
          </div>
          {field.helpText && (
            <p id={`${field.id}-help`} className="text-xs text-slate-400">
              {field.helpText}
            </p>
          )}
          {renderValidationMessage()}
        </div>
      );

    case "number":
      return (
        <div className="space-y-1">
          <input
            type="number"
            {...field.register}
            onChange={e => {
              field.register.onChange(e);
              handleValueChange(e);
            }}
            className={baseClasses}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            min={field.validation?.min}
            max={field.validation?.max}
            step={field.type === "number" ? "any" : undefined}
            aria-describedby={`${field.id}-help ${field.id}-error`}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="text-xs text-slate-400">
              {field.helpText}
            </p>
          )}
          {renderValidationMessage()}
          {field.validation?.min !== undefined &&
            field.validation?.max !== undefined && (
              <p className="text-xs text-slate-400">
                Range: {field.validation.min} - {field.validation.max}
              </p>
            )}
        </div>
      );

    case "date":
      return (
        <div className="space-y-1">
          <input
            type="date"
            {...field.register}
            onChange={e => {
              field.register.onChange(e);
              handleValueChange(e);
            }}
            className={baseClasses}
            placeholder={
              field.placeholder || `Select ${field.label.toLowerCase()}`
            }
            aria-describedby={`${field.id}-help ${field.id}-error`}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="text-xs text-slate-400">
              {field.helpText}
            </p>
          )}
          {renderValidationMessage()}
        </div>
      );

    case "file":
      return (
        <div className="space-y-1">
          <input
            type="file"
            {...field.register}
            className={cn(
              baseClasses,
              "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500"
            )}
            accept="image/*,.pdf,.doc,.docx,.txt"
            aria-describedby={`${field.id}-help ${field.id}-error`}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="text-xs text-slate-400">
              {field.helpText}
            </p>
          )}
          {renderValidationMessage()}
        </div>
      );

    default:
      return (
        <div className="space-y-1">
          <input
            type={field.type === "text" ? "text" : "text"}
            {...field.register}
            onChange={e => {
              field.register.onChange(e);
              handleValueChange(e);
            }}
            className={baseClasses}
            placeholder={
              field.placeholder || `Enter ${field.label.toLowerCase()}`
            }
            aria-describedby={`${field.id}-help ${field.id}-error`}
          />
          {field.helpText && (
            <p id={`${field.id}-help`} className="text-xs text-slate-400">
              {field.helpText}
            </p>
          )}
          {renderValidationMessage()}
          {renderCharacterCount()}
        </div>
      );
  }
};

export { FORM_FIELD_STYLES };
