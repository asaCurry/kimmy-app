import * as React from "react";
import { cn } from "~/lib/utils";

// Shared form field styling constants
const FORM_FIELD_STYLES = {
  base: "flex h-10 w-full rounded-md border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50",
  textarea: "min-h-[80px] resize-none",
  checkbox: "rounded border-slate-600 bg-slate-700/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900",
} as const;

interface DynamicFieldProps {
  field: {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
  };
}

export const DynamicField: React.FC<DynamicFieldProps> = ({ field }) => {
  const baseClasses = FORM_FIELD_STYLES.base;
  
  switch (field.type) {
    case 'textarea':
      return (
        <textarea 
          className={cn(baseClasses, FORM_FIELD_STYLES.textarea)}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
        />
      );
    case 'select':
      return (
        <select className={baseClasses}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {field.options?.map((option: string) => (
            <option key={option} value={option} className="bg-slate-800 text-slate-100">{option}</option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <div className="flex items-center space-x-2">
          <input type="checkbox" className={FORM_FIELD_STYLES.checkbox} />
          <span className="text-sm text-slate-300">{field.placeholder || field.label}</span>
        </div>
      );
    default:
      return (
        <input 
          type={field.type} 
          className={baseClasses}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
        />
      );
  }
};

export { FORM_FIELD_STYLES };