import * as React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { UnifiedInput, UnifiedTextarea } from "./form-field-unified";
import { UnifiedSelect } from "./select-unified";
import { getInputClasses } from "~/lib/ui/input-styles";
import type { InputValidation } from "~/hooks/use-input-state";

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
  value?: any;
}

// Legacy export for backwards compatibility
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
  // Convert validation format
  const validation: InputValidation = {
    min: field.validation?.min,
    max: field.validation?.max,
    minLength: field.validation?.minLength,
    maxLength: field.validation?.maxLength,
    pattern: field.validation?.pattern,
    required: field.required,
  };

  // Convert options to unified format
  const selectOptions =
    (field.options
      ?.map((option: any) => {
        if (typeof option === "string") {
          return { label: option, value: option };
        } else if (
          option &&
          typeof option === "object" &&
          option.value &&
          option.label
        ) {
          return { label: option.label, value: option.value };
        }
        return null;
      })
      .filter(Boolean) as { label: string; value: string }[]) || [];

  switch (field.type) {
    case "textarea":
      return (
        <UnifiedTextarea
          label={field.label}
          description={field.helpText}
          error={field.error?.message}
          required={field.required}
          validation={validation}
          placeholder={
            field.placeholder || `Enter ${field.label.toLowerCase()}`
          }
          {...field.register}
          onChange={value => {
            const syntheticEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            field.register.onChange(syntheticEvent);
          }}
        />
      );

    case "select":
      return (
        <UnifiedSelect
          label={field.label}
          description={field.helpText}
          error={field.error?.message}
          required={field.required}
          options={selectOptions}
          placeholder={`Select ${field.label.toLowerCase()}`}
          name={field.register.name}
          value={field.value || ""}
          onChange={(value: string) => {
            const syntheticEvent = {
              target: { value, name: field.register.name },
            } as React.ChangeEvent<HTMLSelectElement>;
            field.register.onChange(syntheticEvent);
          }}
          onBlur={field.register.onBlur}
        />
      );

    case "checkbox":
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...field.register}
              className={getInputClasses({ variant: "checkbox" })}
              aria-describedby={field.helpText ? `${field.id}-help` : undefined}
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
          {field.error?.message && (
            <div className="mt-1 text-xs flex items-center gap-1 text-red-400">
              <span className="text-sm">⚠️</span>
              {field.error.message}
            </div>
          )}
        </div>
      );

    case "number":
      return (
        <UnifiedInput
          type="number"
          label={field.label}
          description={field.helpText}
          error={field.error?.message}
          required={field.required}
          validation={validation}
          placeholder={
            field.placeholder || `Enter ${field.label.toLowerCase()}`
          }
          min={field.validation?.min}
          max={field.validation?.max}
          step="any"
          {...field.register}
          onChange={value => {
            const syntheticEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLInputElement>;
            field.register.onChange(syntheticEvent);
          }}
        />
      );

    case "date":
      return (
        <UnifiedInput
          type="date"
          label={field.label}
          description={field.helpText}
          error={field.error?.message}
          required={field.required}
          validation={validation}
          placeholder={
            field.placeholder || `Select ${field.label.toLowerCase()}`
          }
          {...field.register}
          onChange={value => {
            const syntheticEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLInputElement>;
            field.register.onChange(syntheticEvent);
          }}
        />
      );

    case "file":
      return (
        <UnifiedInput
          type="file"
          label={field.label}
          description={field.helpText}
          error={field.error?.message}
          required={field.required}
          accept="image/*,.pdf,.doc,.docx,.txt"
          {...field.register}
          onChange={value => {
            const syntheticEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLInputElement>;
            field.register.onChange(syntheticEvent);
          }}
        />
      );

    default:
      return (
        <UnifiedInput
          type={field.type === "text" ? "text" : field.type}
          label={field.label}
          description={field.helpText}
          error={field.error?.message}
          required={field.required}
          validation={validation}
          placeholder={
            field.placeholder || `Enter ${field.label.toLowerCase()}`
          }
          {...field.register}
          onChange={value => {
            const syntheticEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLInputElement>;
            field.register.onChange(syntheticEvent);
          }}
        />
      );
  }
};

export { FORM_FIELD_STYLES };
