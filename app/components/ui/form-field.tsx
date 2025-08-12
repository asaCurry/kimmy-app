import * as React from "react";
import { cn } from "~/lib/utils";
import type { UseFormRegisterReturn } from "react-hook-form";

// Shared form field styling constants
const FORM_FIELD_STYLES = {
  base: "flex h-10 w-full rounded-md border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50",
  textarea: "min-h-[80px] resize-none",
  checkbox:
    "rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900",
  error: "border-red-500 focus-visible:ring-red-500",
} as const;

interface DynamicFieldProps {
  field: {
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
    };
    register: UseFormRegisterReturn;
    error?: any;
  };
}

export const DynamicField: React.FC<DynamicFieldProps> = ({ field }) => {
  // Debug: Log what's being passed to DynamicField
  console.log("DynamicField - field:", field);
  console.log("DynamicField - field.type:", field.type);
  console.log("DynamicField - field.options:", field.options);
  
  const baseClasses = cn(
    FORM_FIELD_STYLES.base,
    field.error && FORM_FIELD_STYLES.error
  );

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          {...field.register}
          className={cn(baseClasses, FORM_FIELD_STYLES.textarea)}
          placeholder={
            field.placeholder || `Enter ${field.label.toLowerCase()}`
          }
          rows={4}
        />
      );

    case "select":
      return (
        <select {...field.register} className={baseClasses}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {field.options?.map((option: any) => {
            // Handle both string and object options
            if (typeof option === 'string') {
              return (
                <option
                  key={option}
                  value={option}
                  className="bg-slate-800 text-slate-100"
                >
                  {option}
                </option>
              );
            } else if (option && typeof option === 'object' && option.value && option.label) {
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
      );

    case "checkbox":
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...field.register}
            className={FORM_FIELD_STYLES.checkbox}
          />
          <span className="text-sm text-slate-300">
            {field.placeholder || field.label}
          </span>
        </div>
      );

    case "number":
      return (
        <input
          type="number"
          {...field.register}
          className={baseClasses}
          placeholder={
            field.placeholder || `Enter ${field.label.toLowerCase()}`
          }
          min={field.validation?.min}
          max={field.validation?.max}
          step={field.type === "number" ? "any" : undefined}
        />
      );

    case "date":
      return (
        <input
          type="date"
          {...field.register}
          className={baseClasses}
          placeholder={
            field.placeholder || `Select ${field.label.toLowerCase()}`
          }
        />
      );

    case "file":
      return (
        <input
          type="file"
          {...field.register}
          className={cn(
            baseClasses,
            "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500"
          )}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      );

    default:
      return (
        <input
          type={field.type === "text" ? "text" : "text"}
          {...field.register}
          className={baseClasses}
          placeholder={
            field.placeholder || `Enter ${field.label.toLowerCase()}`
          }
        />
      );
  }
};

export { FORM_FIELD_STYLES };
