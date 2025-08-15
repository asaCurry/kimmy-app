import type { DynamicField } from "../../types/dynamic-fields";
import { validateFieldValue } from "./schema-generation";

// Re-export the enhanced validateFieldValue from schema-generation
export { validateFieldValue } from "./schema-generation";

export const validateMultipleFields = (
  fields: DynamicField[],
  values: Record<string, any>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  fields.forEach(field => {
    const fieldKey = `field_${field.id}`;
    const value = values[fieldKey];
    const validation = validateFieldValue(field, value);

    if (!validation.isValid) {
      errors[fieldKey] = validation.error || "Invalid field";
      isValid = false;
    }
  });

  return { isValid, errors };
};
