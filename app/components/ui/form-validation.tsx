import * as React from "react";
import { cn } from "~/lib/utils";

interface ValidationMessageProps {
  type: "error" | "warning" | "success" | "info";
  message: string;
  className?: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type,
  message,
  className,
}) => {
  const getIcon = () => {
    switch (type) {
      case "error":
        return "⚠️";
      case "warning":
        return "💡";
      case "success":
        return "✅";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  };

  const getStyles = () => {
    switch (type) {
      case "error":
        return "bg-red-900/20 border-red-700 text-red-400";
      case "warning":
        return "bg-yellow-900/20 border-yellow-700 text-yellow-400";
      case "success":
        return "bg-green-900/20 border-green-700 text-green-400";
      case "info":
        return "bg-blue-900/20 border-blue-700 text-blue-400";
      default:
        return "bg-slate-900/20 border-slate-700 text-slate-400";
    }
  };

  return (
    <div
      className={cn(
        "p-3 border rounded-md flex items-start gap-2",
        getStyles(),
        className
      )}
    >
      <span className="text-sm mt-0.5">{getIcon()}</span>
      <span className="text-sm">{message}</span>
    </div>
  );
};

interface ValidationSummaryProps {
  errors: Record<string, any>;
  warnings?: Record<string, string>;
  fieldLabels?: Record<string, string>;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  warnings = {},
  fieldLabels = {},
  className,
}) => {
  const hasErrors = Object.keys(errors).length > 0;
  const hasWarnings = Object.keys(warnings).length > 0;

  if (!hasErrors && !hasWarnings) return null;

  const getFieldLabel = (fieldName: string) => {
    if (fieldLabels[fieldName]) return fieldLabels[fieldName];

    // Default field name formatting
    const formatted = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .replace(/field_/, "");

    return formatted;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {hasErrors && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-md">
          <h3 className="text-red-400 font-medium mb-2 flex items-center gap-2">
            <span>⚠️</span>
            Please fix the following errors:
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(errors).map(([fieldName, error]) => (
              <li key={fieldName} className="text-red-300 text-sm">
                <strong>{getFieldLabel(fieldName)}</strong>:{" "}
                {String(error?.message || "Invalid field")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasWarnings && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-md">
          <h3 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
            <span>💡</span>
            Please review the following warnings:
          </h3>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(warnings).map(([fieldName, warning]) => (
              <li key={fieldName} className="text-yellow-300 text-sm">
                <strong>{getFieldLabel(fieldName)}</strong>: {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

interface FormStatusProps {
  isValid: boolean;
  isDirty: boolean;
  errorCount: number;
  touchedFieldCount: number;
  className?: string;
}

export const FormStatus: React.FC<FormStatusProps> = ({
  isValid,
  isDirty,
  errorCount,
  touchedFieldCount,
  className,
}) => {
  const getStatusMessage = () => {
    if (errorCount > 0) {
      return `${errorCount} field(s) have errors`;
    }

    if (touchedFieldCount > 0 && isValid) {
      return "Form is valid and ready to submit";
    }

    return "Please fill in the required fields";
  };

  const getStatusColor = () => {
    if (errorCount > 0) return "text-red-400";
    if (touchedFieldCount > 0 && isValid) return "text-green-400";
    return "text-slate-400";
  };

  return (
    <div
      className={cn(
        "p-3 bg-slate-800/50 border border-slate-600 rounded-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium", getStatusColor())}>
          {getStatusMessage()}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {touchedFieldCount} field(s) filled
          </span>
          {errorCount > 0 && (
            <span className="text-xs text-red-400">{errorCount} error(s)</span>
          )}
        </div>
      </div>
    </div>
  );
};
