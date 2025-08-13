import * as React from "react";
import { DateDisplay } from "./date-display";

interface RecordContentDisplayProps {
  content: string | null;
  recordType?: {
    fields?: Array<{
      id: string;
      type: string;
      label: string;
      required: boolean;
    }>;
  };
  className?: string;
  maxFields?: number;
}

export const RecordContentDisplay: React.FC<RecordContentDisplayProps> = ({
  content,
  recordType,
  className = "",
  maxFields = 3,
}) => {
  // If no content at all, show a clean fallback
  if (!content) {
    return (
      <div className={`text-slate-500 italic ${className}`}>
        No additional information
      </div>
    );
  }

  let parsedContent: Record<string, any> | null = null;

  try {
    parsedContent = JSON.parse(content);
  } catch {
    // If it's not JSON, treat it as plain text
    return <div className={`text-slate-300 ${className}`}>{content}</div>;
  }

  if (!parsedContent || typeof parsedContent !== "object") {
    return <div className={`text-slate-300 ${className}`}>{content}</div>;
  }

  // Handle the actual record content structure
  // Content has: { description: "...", fields: { field_1: "value1", field_2: "value2" } }
  const { description, fields: contentFields } = parsedContent;

  // Check if this is the default empty structure
  const isDefaultEmptyStructure = 
    description === "No description provided" && 
    (!contentFields || Object.keys(contentFields).length === 0);

  if (isDefaultEmptyStructure) {
    return (
      <div className={`text-slate-500 italic ${className}`}>
        No additional information recorded
      </div>
    );
  }

  // If we have record type fields, use them to display the content properly
  if (recordType?.fields && recordType.fields.length > 0) {
    const fieldValues = recordType.fields
      .filter(field => {
        const value = contentFields?.[`field_${field.id}`];
        return value !== undefined && value !== null && value !== "";
      })
      .slice(0, maxFields);

    if (fieldValues.length === 0) {
      // Fall back to description if no field values
      if (description && description !== "No description provided") {
        return (
          <div className={`text-slate-300 ${className}`}>{description}</div>
        );
      }
      return (
        <div className={`text-slate-500 italic ${className}`}>
          No field values set
        </div>
      );
    }

    return (
      <div className={`space-y-2 ${className}`}>
        {fieldValues.map(field => {
          const value = contentFields[`field_${field.id}`];
          return (
            <div key={field.id} className="flex items-start space-x-2">
              <span className="text-slate-400 text-xs font-medium min-w-0 flex-shrink-0">
                {field.label}:
              </span>
              <span className="text-slate-300 text-xs flex-1 min-w-0">
                {renderFieldValue(value, field.type)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // No record type fields defined - show a clean view of available data
  const availableData: Array<{ key: string; value: any; label: string }> = [];

  // Add description if available and meaningful
  if (description && description !== "No description provided") {
    availableData.push({ key: "description", value: description, label: "Description" });
  }

  // Add field values if available - this is where the actual field data is
  if (contentFields && typeof contentFields === "object") {
    Object.entries(contentFields)
      .filter(([key, value]) => {
        // Skip internal fields and empty values
        const shouldInclude = (
          !key.startsWith("_") &&
          value !== undefined &&
          value !== null &&
          value !== "" &&
          key !== "description"
        );
        return shouldInclude;
      })
      .forEach(([key, value]) => {
        availableData.push({ key, value, label: formatKey(key) });
      });
  }
  
  // Show available data in a clean format
  if (availableData.length === 0) {
    // If we have a description but it's the default, show a simple message
    if (description === "No description provided") {
      return (
        <div className={`text-slate-500 italic ${className}`}>
          Basic record created
        </div>
      );
    }
    
    return (
      <div className={`text-slate-500 italic ${className}`}>
        No additional information available
      </div>
    );
  }

  const displayData = availableData.slice(0, maxFields);

  return (
    <div className={`space-y-2 ${className}`}>
      {displayData.map(({ key, value, label }) => (
        <div key={key} className="flex items-start space-x-2">
          <span className="text-slate-400 text-xs font-medium min-w-0 flex-shrink-0">
            {label}:
          </span>
          <span className="text-slate-300 text-xs flex-1 min-w-0">
            {renderValue(value)}
          </span>
        </div>
      ))}

      {availableData.length > maxFields && (
        <div className="text-slate-500 text-xs">
          +{availableData.length - maxFields} more items
        </div>
      )}
    </div>
  );
};

const renderFieldValue = (value: any, fieldType: string): React.ReactNode => {
  switch (fieldType) {
    case "date":
      return <DateDisplay date={value} format="short" />;
    case "datetime":
      return <DateDisplay date={value} format="short" showTime />;
    case "number":
      return typeof value === "number" ? value.toLocaleString() : value;
    case "checkbox":
      return value === "true" || value === true ? "✓ Yes" : "✗ No";
    case "select":
      // Handle select field values - they might be stored as values but we want to show labels
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(", ") : "Not selected";
      }
      return value || "Not selected";
    case "textarea":
      if (!value || value.length === 0) return "No text entered";
      return value.length > 100 ? `${value.substring(0, 100)}...` : value;
    case "text":
    case "email":
    case "url":
    case "phone":
      if (!value || value.length === 0) return "Not provided";
      return value.length > 100 ? `${value.substring(0, 100)}...` : value;
    case "file":
      if (!value || value.length === 0) return "No file uploaded";
      return "File uploaded";
    default:
      return renderValue(value);
  }
};

const renderValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-slate-500 italic">Not set</span>;
  }

  if (typeof value === "boolean") {
    return value ? "✓ Yes" : "✗ No";
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  if (typeof value === "string") {
    // Check if it's a date string (ISO format)
    if (value.includes("-") && value.includes("T")) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return <DateDisplay date={value} format="short" />;
      }
    }

    // Check if it's a checkbox value
    if (value === "true" || value === "false") {
      return value === "true" ? "✓ Yes" : "✗ No";
    }

    // Check if it's the default "No description provided" text
    if (value === "No description provided") {
      return <span className="text-slate-500 italic">No description</span>;
    }

    // Truncate long strings
    if (value.length > 100) {
      return `${value.substring(0, 100)}...`;
    }

    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-slate-500 italic">Empty</span>;
    }
    return (
      value.slice(0, 3).join(", ") +
      (value.length > 3 ? ` +${value.length - 3} more` : "")
    );
  }

  if (typeof value === "object") {
    // If it's an empty object, show a clean message
    if (Object.keys(value).length === 0) {
      return <span className="text-slate-500 italic">No data</span>;
    }
    
    // If it has meaningful content, try to extract it
    const entries = Object.entries(value).filter(([k, v]) => 
      v !== undefined && v !== null && v !== "" && !k.startsWith("_")
    );
    
    if (entries.length === 0) {
      return <span className="text-slate-500 italic">No data</span>;
    }
    
    // Show first few meaningful entries
    const displayEntries = entries.slice(0, 2);
    return (
      <span className="text-slate-400">
        {displayEntries.map(([k, v], i) => (
          <span key={k}>
            {i > 0 ? ", " : ""}
            {formatKey(k)}: {renderValue(v)}
          </span>
        ))}
        {entries.length > 2 && ` +${entries.length - 2} more`}
      </span>
    );
  }

  return String(value);
};

const formatKey = (key: string): string => {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
};
