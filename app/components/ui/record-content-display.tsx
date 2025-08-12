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
  if (!content) {
    return (
      <div className={`text-slate-500 italic ${className}`}>
        No content available
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

        {recordType.fields.length > maxFields && (
          <div className="text-slate-500 text-xs">
            +{recordType.fields.length - maxFields} more fields
          </div>
        )}
      </div>
    );
  }

  // No record type fields defined - prioritize showing description
  if (description && description !== "No description provided") {
    return <div className={`text-slate-300 ${className}`}>{description}</div>;
  }

  // Show content fields if available
  if (
    contentFields &&
    typeof contentFields === "object" &&
    Object.keys(contentFields).length > 0
  ) {
    const entries = Object.entries(contentFields)
      .filter(([key, value]) => {
        // Skip internal fields and empty values
        return (
          !key.startsWith("_") &&
          value !== undefined &&
          value !== null &&
          value !== "" &&
          key !== "description"
        );
      })
      .slice(0, maxFields);

    if (entries.length === 0) {
      return (
        <div className={`text-slate-500 italic ${className}`}>
          No data available
        </div>
      );
    }

    return (
      <div className={`space-y-2 ${className}`}>
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start space-x-2">
            <span className="text-slate-400 text-xs font-medium min-w-0 flex-shrink-0">
              {formatKey(key)}:
            </span>
            <span className="text-slate-300 text-xs flex-1 min-w-0">
              {renderValue(value)}
            </span>
          </div>
        ))}

        {Object.keys(contentFields).length > maxFields && (
          <div className="text-slate-500 text-xs">
            +{Object.keys(contentFields).length - maxFields} more fields
          </div>
        )}
      </div>
    );
  }

  // Last resort: show the raw content
  return <div className={`text-slate-300 ${className}`}>{content}</div>;
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
      return Array.isArray(value) ? value.join(", ") : value;
    case "textarea":
      return value.length > 100 ? `${value.substring(0, 100)}...` : value;
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
    return <span className="text-slate-500 italic">Complex data</span>;
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
