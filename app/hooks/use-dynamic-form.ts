import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DynamicField } from "~/lib/types/dynamic-fields";
import { createRecordSchema } from "~/lib/utils/dynamic-fields/schema-generation";
import {
  convertFieldsToFormData,
  convertFormDataToFields,
} from "~/lib/utils/dynamic-fields/field-serialization";

interface UseDynamicFormOptions {
  fields: DynamicField[];
  defaultValues?: Record<string, any>;
  onSubmit?: (data: any) => void | Promise<void>;
  onValidationError?: (errors: any) => void;
}

export const useDynamicForm = (options: UseDynamicFormOptions) => {
  const { fields, defaultValues = {}, onSubmit, onValidationError } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Create dynamic schema based on fields
  const schema = useMemo(() => {
    return createRecordSchema(fields);
  }, [fields]);

  // Create default values for dynamic fields
  const formDefaultValues = useMemo(() => {
    const baseDefaults: Record<string, any> = {
      title: "",
      content: "",
      tags: "",
      isPrivate: false,
      datetime: new Date().toISOString().slice(0, 16),
      ...defaultValues,
    };

    // Add dynamic field defaults
    fields.forEach(field => {
      const fieldKey = `field_${field.id}`;
      if (!(fieldKey in baseDefaults)) {
        baseDefaults[fieldKey] = field.type === "checkbox" ? false : "";
      }
    });

    return baseDefaults;
  }, [fields, defaultValues]);

  // Initialize react-hook-form
  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: formDefaultValues,
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = form;

  // Handle form submission
  const submitForm = useCallback(
    async (data: any) => {
      if (isSubmitting) return;

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Convert form data to the format expected by the API
        const processedData = {
          ...data,
          fields: convertFieldsToFormData(fields, data),
        };

        if (onSubmit) {
          await onSubmit(processedData);
        }

        // Reset form on successful submission
        reset(formDefaultValues);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Form submission failed";
        setSubmitError(errorMessage);
        onValidationError?.({ submitError: errorMessage });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      fields,
      onSubmit,
      onValidationError,
      isSubmitting,
      reset,
      formDefaultValues,
    ]
  );

  // Validate a single field
  const validateField = useCallback(
    (fieldId: string, value: any) => {
      const field = fields.find(f => f.id === fieldId);
      if (!field) return { isValid: false, error: "Field not found" };

      try {
        const fieldSchema = schema.shape[`field_${field.id}`];
        if (fieldSchema) {
          fieldSchema.parse(value);
          return { isValid: true };
        }
        return { isValid: true };
      } catch (error: any) {
        return {
          isValid: false,
          error: error.errors?.[0]?.message || "Invalid field",
        };
      }
    },
    [fields, schema]
  );

  // Set a field value
  const setFieldValue = useCallback(
    (fieldId: string, value: any) => {
      setValue(`field_${fieldId}` as any, value);
    },
    [setValue]
  );

  // Get a field value
  const getFieldValue = useCallback(
    (fieldId: string) => {
      return watch(`field_${fieldId}` as any);
    },
    [watch]
  );

  // Check if a field has an error
  const hasFieldError = useCallback(
    (fieldId: string) => {
      return !!errors[`field_${fieldId}` as keyof typeof errors];
    },
    [errors]
  );

  // Get field error message
  const getFieldError = useCallback(
    (fieldId: string) => {
      const error = errors[`field_${fieldId}` as keyof typeof errors];
      return error?.message || null;
    },
    [errors]
  );

  // Reset form to default values
  const resetForm = useCallback(() => {
    reset(formDefaultValues);
    setSubmitError(null);
  }, [reset, formDefaultValues]);

  // Clear form
  const clearForm = useCallback(() => {
    reset({});
    setSubmitError(null);
  }, [reset]);

  return {
    // Form state
    form,
    errors,
    isValid,
    isSubmitting,
    submitError,

    // Form actions
    handleSubmit: handleSubmit(submitForm),
    submitForm,
    resetForm,
    clearForm,

    // Field operations
    setFieldValue,
    getFieldValue,
    validateField,
    hasFieldError,
    getFieldError,

    // Utility
    schema,
    defaultValues: formDefaultValues,
  };
};
