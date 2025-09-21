import type {
  DynamicField,
  FieldType,
  FieldValidation,
  SelectOption,
} from "../dynamic-fields";

// Legacy FormField type from utils.ts
export interface LegacyFormField {
  id: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "checkbox"
    | "file";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Extended FormField type from types.ts
export interface ExtendedFormField {
  id: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "select"
    | "checkbox"
    | "file"
    | "email"
    | "phone";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    maxLength?: number;
    minLength?: number;
  };
  helpText?: string;
}

// Convert LegacyFormField to DynamicField
export const legacyFormFieldToDynamicField = (
  field: LegacyFormField,
  order: number = 0
): DynamicField => {
  const typeMap: Record<string, FieldType> = {
    text: "text",
    textarea: "textarea",
    number: "number",
    date: "date",
    select: "select",
    checkbox: "checkbox",
    file: "file",
  };

  const validation: FieldValidation = {};
  if (field.validation) {
    if (field.validation.min !== undefined)
      validation.min = field.validation.min;
    if (field.validation.max !== undefined)
      validation.max = field.validation.max;
    if (field.validation.pattern) validation.pattern = field.validation.pattern;
  }

  const options: SelectOption[] | undefined = field.options?.map(
    (opt, _index) => ({
      value: opt.toLowerCase().replace(/\s+/g, "_"),
      label: opt,
    })
  );

  return {
    id: field.id,
    name: field.id,
    label: field.label,
    type: typeMap[field.type] || "text",
    required: field.required,
    placeholder: field.placeholder,
    helpText: "",
    defaultValue: getDefaultValueForType(typeMap[field.type] || "text"),
    validation,
    options,
    order,
    isActive: true,
  };
};

// Convert ExtendedFormField to DynamicField
export const extendedFormFieldToDynamicField = (
  field: ExtendedFormField,
  order: number = 0
): DynamicField => {
  const typeMap: Record<string, FieldType> = {
    text: "text",
    textarea: "textarea",
    number: "number",
    date: "date",
    select: "select",
    checkbox: "checkbox",
    file: "file",
    email: "email",
    phone: "phone",
  };

  const validation: FieldValidation = {};
  if (field.validation) {
    if (field.validation.min !== undefined)
      validation.min = field.validation.min;
    if (field.validation.max !== undefined)
      validation.max = field.validation.max;
    if (field.validation.pattern) validation.pattern = field.validation.pattern;
    if (field.validation.minLength !== undefined)
      validation.minLength = field.validation.minLength;
    if (field.validation.maxLength !== undefined)
      validation.maxLength = field.validation.maxLength;
  }

  const options: SelectOption[] | undefined = field.options?.map(
    (opt, _index) => ({
      value: opt.toLowerCase().replace(/\s+/g, "_"),
      label: opt,
    })
  );

  return {
    id: field.id,
    name: field.id,
    label: field.label,
    type: typeMap[field.type] || "text",
    required: field.required,
    placeholder: field.placeholder,
    helpText: field.helpText || "",
    defaultValue: getDefaultValueForType(typeMap[field.type] || "text"),
    validation,
    options,
    order,
    isActive: true,
  };
};

// Convert DynamicField to LegacyFormField
export const dynamicFieldToLegacyFormField = (
  field: DynamicField
): LegacyFormField => {
  const typeMap: Record<FieldType, LegacyFormField["type"]> = {
    text: "text",
    textarea: "textarea",
    number: "number",
    date: "date",
    select: "select",
    checkbox: "checkbox",
    file: "file",
    email: "text", // Map email to text for legacy compatibility
    url: "text", // Map url to text for legacy compatibility
    phone: "text", // Map phone to text for legacy compatibility
  };

  const validation: LegacyFormField["validation"] = {};
  if (field.validation) {
    if (field.validation.min !== undefined)
      validation.min = field.validation.min;
    if (field.validation.max !== undefined)
      validation.max = field.validation.max;
    if (field.validation.pattern) validation.pattern = field.validation.pattern;
  }

  const options: string[] | undefined = field.options?.map(opt => opt.label);

  return {
    id: field.id,
    type: typeMap[field.type],
    label: field.label,
    required: field.required,
    placeholder: field.placeholder,
    options,
    validation,
  };
};

// Convert DynamicField to ExtendedFormField
export const dynamicFieldToExtendedFormField = (
  field: DynamicField
): ExtendedFormField => {
  const typeMap: Record<FieldType, ExtendedFormField["type"]> = {
    text: "text",
    textarea: "textarea",
    number: "number",
    date: "date",
    select: "select",
    checkbox: "checkbox",
    file: "file",
    email: "email",
    url: "text", // Map url to text for extended compatibility
    phone: "phone",
  };

  const validation: ExtendedFormField["validation"] = {};
  if (field.validation) {
    if (field.validation.min !== undefined)
      validation.min = field.validation.min;
    if (field.validation.max !== undefined)
      validation.max = field.validation.max;
    if (field.validation.pattern) validation.pattern = field.validation.pattern;
    if (field.validation.minLength !== undefined)
      validation.minLength = field.validation.minLength;
    if (field.validation.maxLength !== undefined)
      validation.maxLength = field.validation.maxLength;
  }

  const options: string[] | undefined = field.options?.map(opt => opt.label);

  return {
    id: field.id,
    type: typeMap[field.type],
    label: field.label,
    required: field.required,
    placeholder: field.placeholder,
    options,
    validation,
    helpText: field.helpText,
  };
};

// Helper function to get default value for field type
const getDefaultValueForType = (type: FieldType): any => {
  switch (type) {
    case "checkbox":
      return false;
    case "number":
      return 0;
    case "select":
      return "";
    case "date":
      return new Date().toISOString().split("T")[0];
    default:
      return "";
  }
};

// Type guard functions
export const isLegacyFormField = (field: any): field is LegacyFormField => {
  return (
    field &&
    typeof field.id === "string" &&
    typeof field.type === "string" &&
    typeof field.label === "string"
  );
};

export const isExtendedFormField = (field: any): field is ExtendedFormField => {
  return (
    field &&
    typeof field.id === "string" &&
    typeof field.type === "string" &&
    typeof field.label === "string"
  );
};

export const isDynamicField = (field: any): field is DynamicField => {
  return (
    field &&
    typeof field.id === "string" &&
    typeof field.type === "string" &&
    typeof field.label === "string" &&
    typeof field.order === "number"
  );
};
