import type { DynamicField } from "../../../types/dynamic-fields";

export const reorderFields = (fields: DynamicField[], fromIndex: number, toIndex: number): DynamicField[] => {
  const result = [...fields];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  // Update order property
  return result.map((field, index) => ({
    ...field,
    order: index
  }));
};

export const sortFieldsByOrder = (fields: DynamicField[]): DynamicField[] => {
  return [...fields].sort((a, b) => a.order - b.order);
};

export const getActiveFields = (fields: DynamicField[]): DynamicField[] => {
  return fields.filter(field => field.isActive);
};

export const getFieldsByType = (fields: DynamicField[], type: string): DynamicField[] => {
  return fields.filter(field => field.type === type);
};

export const duplicateField = (field: DynamicField, newOrder: number): DynamicField => {
  return {
    ...field,
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${field.name}_copy`,
    label: `${field.label} (Copy)`,
    order: newOrder
  };
};

export const toggleFieldActive = (fields: DynamicField[], fieldId: string): DynamicField[] => {
  return fields.map(field => 
    field.id === fieldId 
      ? { ...field, isActive: !field.isActive }
      : field
  );
};
