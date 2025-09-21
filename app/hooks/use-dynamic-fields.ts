import { useState, useCallback, useMemo } from "react";
import type { DynamicField, FieldType } from "~/lib/types/dynamic-fields";
import {
  createDefaultField,
  reorderFields,
  sortFieldsByOrder,
  getActiveFields,
  toggleFieldActive,
  duplicateField,
  validateFieldValue,
  validateMultipleFields,
  serializeFields,
  deserializeFields,
} from "~/lib/utils/dynamic-fields";

interface UseDynamicFieldsOptions {
  initialFields?: DynamicField[];
  onFieldsChange?: (fields: DynamicField[]) => void;
}

export const useDynamicFields = (options: UseDynamicFieldsOptions = {}) => {
  const { initialFields = [], onFieldsChange } = options;

  const [fields, setFields] = useState<DynamicField[]>(initialFields);
  const [isLoading] = useState(false);

  // Memoized sorted and active fields
  const sortedFields = useMemo(() => sortFieldsByOrder(fields), [fields]);
  const activeFields = useMemo(() => getActiveFields(fields), [fields]);

  // Add a new field
  const addField = useCallback(
    (type: FieldType) => {
      const newField = createDefaultField(type, fields.length);
      const newFields = [...fields, newField];
      setFields(newFields);
      onFieldsChange?.(newFields);
    },
    [fields, onFieldsChange]
  );

  // Remove a field
  const removeField = useCallback(
    (fieldId: string) => {
      const newFields = fields.filter(field => field.id !== fieldId);
      setFields(newFields);
      onFieldsChange?.(newFields);
    },
    [fields, onFieldsChange]
  );

  // Update a field
  const updateField = useCallback(
    (fieldId: string, updates: Partial<DynamicField>) => {
      const newFields = fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      );
      setFields(newFields);
      onFieldsChange?.(newFields);
    },
    [fields, onFieldsChange]
  );

  // Reorder fields
  const reorderField = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newFields = reorderFields(fields, fromIndex, toIndex);
      setFields(newFields);
      onFieldsChange?.(newFields);
    },
    [fields, onFieldsChange]
  );

  // Toggle field active state
  const toggleField = useCallback(
    (fieldId: string) => {
      const newFields = toggleFieldActive(fields, fieldId);
      setFields(newFields);
      onFieldsChange?.(newFields);
    },
    [fields, onFieldsChange]
  );

  // Duplicate a field
  const duplicateFieldById = useCallback(
    (fieldId: string) => {
      const fieldToDuplicate = fields.find(f => f.id === fieldId);
      if (!fieldToDuplicate) return;

      const duplicatedField = duplicateField(fieldToDuplicate, fields.length);
      const newFields = [...fields, duplicatedField];
      setFields(newFields);
      onFieldsChange?.(newFields);
    },
    [fields, onFieldsChange]
  );

  // Validate a single field
  const validateField = useCallback(
    (fieldId: string, value: any) => {
      const field = fields.find(f => f.id === fieldId);
      if (!field) return { isValid: false, error: "Field not found" };

      return validateFieldValue(field, value);
    },
    [fields]
  );

  // Validate all fields
  const validateAllFields = useCallback(
    (values: Record<string, any>) => {
      return validateMultipleFields(fields, values);
    },
    [fields]
  );

  // Serialize fields
  const serialize = useCallback(() => {
    return serializeFields(fields);
  }, [fields]);

  // Deserialize fields
  const deserialize = useCallback(
    (fieldsJson: string) => {
      const deserializedFields = deserializeFields(fieldsJson);
      setFields(deserializedFields);
      onFieldsChange?.(deserializedFields);
      return deserializedFields;
    },
    [onFieldsChange]
  );

  // Reset to initial fields
  const reset = useCallback(() => {
    setFields(initialFields);
    onFieldsChange?.(initialFields);
  }, [initialFields, onFieldsChange]);

  // Clear all fields
  const clear = useCallback(() => {
    setFields([]);
    onFieldsChange?.([]);
  }, [onFieldsChange]);

  return {
    // State
    fields: sortedFields,
    activeFields,
    isLoading,

    // Actions
    addField,
    removeField,
    updateField,
    reorderField,
    toggleField,
    duplicateField: duplicateFieldById,

    // Validation
    validateField,
    validateAllFields,

    // Serialization
    serialize,
    deserialize,

    // Utility
    reset,
    clear,

    // Computed
    fieldCount: fields.length,
    activeFieldCount: activeFields.length,
    hasFields: fields.length > 0,
    hasActiveFields: activeFields.length > 0,
  };
};
