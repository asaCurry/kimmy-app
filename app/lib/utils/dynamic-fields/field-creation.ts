import type {
  DynamicField,
  FieldType,
  FieldValidation,
} from "../../types/dynamic-fields";

export const createFieldId = (): string => {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createDefaultField = (
  type: FieldType,
  order: number
): DynamicField => {
  const config = getFieldTypeConfig(type);
  return {
    id: createFieldId(),
    name: `field_${order}`,
    label: `New ${config.label} Field`,
    type,
    required: false,
    placeholder: `Enter ${config.label.toLowerCase()}...`,
    helpText: "",
    defaultValue: getDefaultValueForType(type),
    validation: getDefaultValidationForType(type),
    options:
      type === "select"
        ? [
            { value: "option_1", label: "Option 1" },
            { value: "option_2", label: "Option 2" },
            { value: "option_3", label: "Option 3" },
          ]
        : undefined,
    order,
    isActive: true,
  };
};

export const getFieldTypeConfig = (type: FieldType) => {
  const configs = {
    text: { label: "Text", icon: "📝", hasOptions: false },
    textarea: { label: "Long Text", icon: "📄", hasOptions: false },
    number: { label: "Number", icon: "🔢", hasOptions: false },
    select: { label: "Dropdown", icon: "📋", hasOptions: true },
    checkbox: { label: "Checkbox", icon: "☑️", hasOptions: false },
    date: { label: "Date", icon: "📅", hasOptions: false },
    email: { label: "Email", icon: "📧", hasOptions: false },
    url: { label: "URL", icon: "🔗", hasOptions: false },
    phone: { label: "Phone", icon: "📞", hasOptions: false },
    file: { label: "File Upload", icon: "📎", hasOptions: false },
  };

  // Return default config if type is not found
  return configs[type] || { label: "Unknown", icon: "❓", hasOptions: false };
};

export const getDefaultValueForType = (type: FieldType): any => {
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

export const getDefaultValidationForType = (
  type: FieldType
): FieldValidation => {
  switch (type) {
    case "text":
      return { minLength: 1, maxLength: 255 };
    case "textarea":
      return { minLength: 1, maxLength: 1000 };
    case "number":
      return { min: -999999, max: 999999 };
    case "email":
      return { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" };
    case "url":
      return {
        pattern:
          "^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$",
      };
    case "phone":
      return { pattern: "^[+]?[\\d\\s\\-\\(\\)]+$" };
    case "file":
      return { maxLength: 10 * 1024 * 1024 }; // 10MB
    default:
      return {};
  }
};
