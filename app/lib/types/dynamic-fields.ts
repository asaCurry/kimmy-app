export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "email"
  | "url"
  | "phone"
  | "file";

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface DynamicField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  validation?: FieldValidation;
  options?: SelectOption[];
  order: number;
  isActive: boolean;
}

export interface DynamicFieldConfig {
  fields: DynamicField[];
  version: string;
  lastModified: string;
}

export interface FieldValue {
  fieldId: string;
  value: any;
  type: FieldType;
}

export interface RecordData {
  title: string;
  content?: string;
  fields: FieldValue[];
  tags?: string[];
  isPrivate?: boolean;
  datetime?: string;
}

export const FIELD_TYPE_CONFIGS = {
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
