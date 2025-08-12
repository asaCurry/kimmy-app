import { z } from "zod";
import type { DynamicField } from "../../types/dynamic-fields";

export const createRecordSchema = (fields: DynamicField[] | any) => {
  const baseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(),
    tags: z.string().optional(),
    isPrivate: z.boolean().default(false),
    datetime: z.string().optional(),
  });

  // Add dynamic fields to the schema
  const dynamicFields: Record<string, any> = {};

  // Ensure fields is an array and handle potential null/undefined values
  if (Array.isArray(fields)) {
    fields.forEach(field => {
      const fieldSchema = createFieldSchema(field);
      if (fieldSchema) {
        dynamicFields[`field_${field.id}`] = fieldSchema;
      }
    });
  }

  return baseSchema.extend(dynamicFields);
};

const createFieldSchema = (field: DynamicField): z.ZodTypeAny | null => {
  switch (field.type) {
    case "text":
    case "textarea":
      return field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();

    case "number":
      let numberSchema = z.number();
      
      if (field.validation?.min !== undefined) {
        numberSchema = numberSchema.min(field.validation.min, `${field.label} must be at least ${field.validation.min}`);
      }
      
      if (field.validation?.max !== undefined) {
        numberSchema = numberSchema.max(field.validation.max, `${field.label} must be at most ${field.validation.max}`);
      }
      
      return field.required ? numberSchema : numberSchema.optional();

    case "date":
      return field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();

    case "select":
      return field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();

    case "checkbox":
      return z.boolean().default(false);

    case "email":
      let emailSchema = z.string().email(`${field.label} must be a valid email`);
      if (field.required) {
        emailSchema = emailSchema.min(1, `${field.label} is required`);
      }
      return field.required ? emailSchema : emailSchema.optional();

    case "url":
      let urlSchema = z.string().url(`${field.label} must be a valid URL`);
      if (field.required) {
        urlSchema = urlSchema.min(1, `${field.label} is required`);
      }
      return field.required ? urlSchema : urlSchema.optional();

    case "phone":
      let phoneSchema = z.string();
      if (field.validation?.pattern) {
        phoneSchema = phoneSchema.regex(new RegExp(field.validation.pattern), `${field.label} format is invalid`);
      }
      if (field.required) {
        phoneSchema = phoneSchema.min(1, `${field.label} is required`);
      }
      return field.required ? phoneSchema : phoneSchema.optional();

    case "file":
      return z.any().optional();

    default:
      return z.string().optional();
  }
};

export const createFieldValidationSchema = (field: DynamicField): z.ZodTypeAny | null => {
  return createFieldSchema(field);
};

export const validateFieldAgainstSchema = (field: DynamicField, value: any): { isValid: boolean; error?: string } => {
  try {
    const schema = createFieldSchema(field);
    if (!schema) return { isValid: true };
    
    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || "Invalid field" };
    }
    return { isValid: false, error: "Validation failed" };
  }
};
