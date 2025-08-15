import { z } from "zod";
import type { DynamicField } from "../../types/dynamic-fields";

export const createRecordSchema = (fields: DynamicField[] | any) => {
  const baseSchema = z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be less than 100 characters")
      .trim(),
    content: z
      .string()
      .max(1000, "Description must be less than 1000 characters")
      .optional(),
    tags: z
      .string()
      .max(200, "Tags must be less than 200 characters")
      .optional(),
    isPrivate: z.boolean().default(false),
    datetime: z
      .string()
      .refine(val => {
        if (!val) return true; // Optional field
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, "Please enter a valid date and time")
      .optional(),
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
      let textSchema = z.string().trim();

      if (field.validation?.minLength !== undefined) {
        textSchema = textSchema.min(
          field.validation.minLength,
          `${field.label} must be at least ${field.validation.minLength} characters`
        );
      }

      if (field.validation?.maxLength !== undefined) {
        textSchema = textSchema.max(
          field.validation.maxLength,
          `${field.label} must be less than ${field.validation.maxLength} characters`
        );
      } else {
        // Default max length for text fields
        textSchema = textSchema.max(
          255,
          `${field.label} must be less than 255 characters`
        );
      }

      return field.required
        ? textSchema.min(1, `${field.label} is required`)
        : textSchema.optional();

    case "textarea":
      let textareaSchema = z.string().trim();

      if (field.validation?.minLength !== undefined) {
        textareaSchema = textareaSchema.min(
          field.validation.minLength,
          `${field.label} must be at least ${field.validation.minLength} characters`
        );
      }

      if (field.validation?.maxLength !== undefined) {
        textareaSchema = textareaSchema.max(
          field.validation.maxLength,
          `${field.label} must be less than ${field.validation.maxLength} characters`
        );
      } else {
        // Default max length for textarea fields
        textareaSchema = textareaSchema.max(
          2000,
          `${field.label} must be less than 2000 characters`
        );
      }

      return field.required
        ? textareaSchema.min(1, `${field.label} is required`)
        : textareaSchema.optional();

    case "number":
      let numberSchema = z.coerce.number();

      if (field.validation?.min !== undefined) {
        numberSchema = numberSchema.min(
          field.validation.min,
          `${field.label} must be at least ${field.validation.min}`
        );
      }

      if (field.validation?.max !== undefined) {
        numberSchema = numberSchema.max(
          field.validation.max,
          `${field.label} must be at most ${field.validation.max}`
        );
      }

      // Validate that it's a finite number
      numberSchema = numberSchema.refine(
        val => Number.isFinite(val),
        `${field.label} must be a valid number`
      );

      return field.required ? numberSchema : numberSchema.optional();

    case "date":
      let dateSchema = z.string();

      // Validate date format
      dateSchema = dateSchema.refine(val => {
        if (!val) return true; // Optional field
        const date = new Date(val);
        return !isNaN(date.getTime());
      }, `${field.label} must be a valid date`);

      return field.required
        ? dateSchema.min(1, `${field.label} is required`)
        : dateSchema.optional();

    case "select":
      if (
        field.options &&
        Array.isArray(field.options) &&
        field.options.length > 0
      ) {
        const validValues = field.options.map(opt =>
          typeof opt === "string" ? opt : opt.value
        );

        const selectSchema = z.enum(validValues as [string, ...string[]], {
          errorMap: () => ({
            message: `${field.label} must be one of the available options`,
          }),
        });

        return field.required ? selectSchema : selectSchema.optional();
      }

      // Fallback if no options are defined
      return field.required
        ? z.string().min(1, `${field.label} is required`)
        : z.string().optional();

    case "checkbox":
      return z.boolean().default(false);

    case "email":
      let emailSchema = z
        .string()
        .trim()
        .email(`${field.label} must be a valid email address`);

      if (field.validation?.maxLength !== undefined) {
        emailSchema = emailSchema.max(
          field.validation.maxLength,
          `${field.label} must be less than ${field.validation.maxLength} characters`
        );
      }

      return field.required
        ? emailSchema.min(1, `${field.label} is required`)
        : emailSchema.optional();

    case "url":
      let urlSchema = z
        .string()
        .trim()
        .url(`${field.label} must be a valid URL`);

      if (field.validation?.maxLength !== undefined) {
        urlSchema = urlSchema.max(
          field.validation.maxLength,
          `${field.label} must be less than ${field.validation.maxLength} characters`
        );
      }

      return field.required
        ? urlSchema.min(1, `${field.label} is required`)
        : urlSchema.optional();

    case "phone":
      let phoneSchema = z.string().trim();

      if (field.validation?.pattern) {
        phoneSchema = phoneSchema.regex(
          new RegExp(field.validation.pattern),
          `${field.label} format is invalid`
        );
      } else {
        // Default phone validation - basic format check
        phoneSchema = phoneSchema.regex(
          /^[\+]?[1-9][\d]{0,15}$/,
          `${field.label} must be a valid phone number`
        );
      }

      if (field.validation?.maxLength !== undefined) {
        phoneSchema = phoneSchema.max(
          field.validation.maxLength,
          `${field.label} must be less than ${field.validation.maxLength} characters`
        );
      }

      return field.required
        ? phoneSchema.min(1, `${field.label} is required`)
        : phoneSchema.optional();

    case "file":
      return z.any().optional();

    default:
      return z.string().optional();
  }
};

export const createFieldValidationSchema = (
  field: DynamicField
): z.ZodTypeAny | null => {
  return createFieldSchema(field);
};

export const validateFieldAgainstSchema = (
  field: DynamicField,
  value: any
): { isValid: boolean; error?: string } => {
  try {
    // Special validation for select fields
    if (
      field.type === "select" &&
      field.options &&
      Array.isArray(field.options)
    ) {
      if (field.required && (!value || value.trim() === "")) {
        return { isValid: false, error: `${field.label} is required` };
      }

      if (value && value.trim() !== "") {
        const validValues = field.options.map(opt =>
          typeof opt === "string" ? opt : opt.value
        );

        if (!validValues.includes(value)) {
          return {
            isValid: false,
            error: `${field.label} must be one of the available options`,
          };
        }
      }

      return { isValid: true };
    }

    // Use schema validation for other field types
    const schema = createFieldSchema(field);
    if (!schema) return { isValid: true };

    schema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || "Invalid field",
      };
    }
    return { isValid: false, error: "Validation failed" };
  }
};

// Enhanced validation helper for real-time validation
export const validateFieldValue = (
  field: DynamicField,
  value: any
): { isValid: boolean; error?: string; warning?: string } => {
  const result = validateFieldAgainstSchema(field, value);

  if (!result.isValid) {
    return result;
  }

  // Add warnings for certain field types
  if (field.type === "text" || field.type === "textarea") {
    const length = String(value).length;
    const maxLength =
      field.validation?.maxLength || (field.type === "text" ? 255 : 2000);

    if (length > maxLength * 0.8) {
      return {
        isValid: true,
        warning: `${field.label} is getting long (${length}/${maxLength} characters)`,
      };
    }
  }

  if (field.type === "number" && field.validation) {
    const numValue = Number(value);
    if (
      field.validation.min !== undefined &&
      numValue < field.validation.min * 1.1
    ) {
      return {
        isValid: true,
        warning: `${field.label} is close to the minimum value (${field.validation.min})`,
      };
    }
    if (
      field.validation.max !== undefined &&
      numValue > field.validation.max * 0.9
    ) {
      return {
        isValid: true,
        warning: `${field.label} is close to the maximum value (${field.validation.max})`,
      };
    }
  }

  return { isValid: true };
};
