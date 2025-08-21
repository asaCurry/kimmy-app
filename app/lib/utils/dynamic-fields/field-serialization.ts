import type {
  DynamicField,
  DynamicFieldConfig,
} from "../../types/dynamic-fields";

export const serializeFields = (fields: DynamicField[]): string => {
  return JSON.stringify({
    fields,
    version: "1.0",
    lastModified: new Date().toISOString(),
  });
};

export const deserializeFields = (
  fieldsJson: string | null
): DynamicField[] => {
  if (!fieldsJson) return [];

  try {
    const parsed = JSON.parse(fieldsJson);
    return parsed.fields || [];
  } catch {
    return [];
  }
};

export const serializeFieldConfig = (config: DynamicFieldConfig): string => {
  return JSON.stringify(config);
};

export const deserializeFieldConfig = (
  configJson: string | null
): DynamicFieldConfig | null => {
  if (!configJson) return null;

  try {
    return JSON.parse(configJson);
  } catch {
    return null;
  }
};

export const parseSelectOptions = (
  optionsString: string
): { value: string; label: string }[] => {
  if (!optionsString) return [];

  return optionsString.split(",").map((option, index) => {
    const trimmed = option.trim();
    return {
      value: trimmed.toLowerCase().replace(/\s+/g, "_"),
      label: trimmed,
    };
  });
};

export const formatSelectOptions = (
  options: { value: string; label: string }[]
): string => {
  return options.map(opt => opt.label).join(", ");
};

export const convertFieldsToFormData = (
  fields: DynamicField[],
  values: Record<string, any>
): Record<string, any> => {
  const formData: Record<string, any> = {};

  fields.forEach(field => {
    const fieldKey = `field_${field.id}`;
    const value = values[fieldKey];

    if (value !== undefined && value !== null && value !== "") {
      if (field.type === "checkbox") {
        formData[fieldKey] = value ? "true" : "false";
      } else {
        formData[fieldKey] = String(value);
      }
    }
  });

  return formData;
};

export const convertFormDataToFields = (
  fields: DynamicField[],
  formData: FormData
): Record<string, any> => {
  const fieldValues: Record<string, any> = {};

  fields.forEach(field => {
    const fieldKey = `field_${field.id}`;
    const fieldValue = formData.get(fieldKey);

    if (fieldValue !== null) {
      switch (field.type) {
        case "number":
          fieldValues[fieldKey] = fieldValue
            ? parseFloat(fieldValue.toString())
            : null;
          break;
        case "checkbox":
          fieldValues[fieldKey] = fieldValue === "true";
          break;
        default:
          fieldValues[fieldKey] = fieldValue;
      }
    }
  });

  return fieldValues;
};
