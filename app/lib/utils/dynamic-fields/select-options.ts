import type { SelectOption, DynamicField } from "../../types/dynamic-fields";

/**
 * Validates if a value is a valid option for a select field
 */
export const isValidSelectOption = (field: DynamicField, value: any): boolean => {
  if (!field.options || !Array.isArray(field.options)) {
    return false;
  }
  
  const validValues = field.options.map(opt => 
    typeof opt === 'string' ? opt : opt.value
  );
  
  return validValues.includes(value);
};

/**
 * Gets the display label for a select option value
 */
export const getSelectOptionLabel = (field: DynamicField, value: any): string | undefined => {
  if (!field.options || !Array.isArray(field.options)) {
    return undefined;
  }
  
  const option = field.options.find(opt => 
    (typeof opt === 'string' ? opt : opt.value) === value
  );
  
  if (typeof option === 'string') {
    return option;
  }
  
  return option?.label;
};

/**
 * Creates a new option with auto-generated value from label
 */
export const createSelectOption = (label: string): SelectOption => {
  const value = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  
  return { value, label: label.trim() };
};

/**
 * Validates and cleans select options
 */
export const validateSelectOptions = (options: SelectOption[]): SelectOption[] => {
  return options
    .filter(opt => opt && typeof opt === 'object' && opt.label && opt.value)
    .map(opt => ({
      value: opt.value.trim(),
      label: opt.label.trim()
    }))
    .filter((opt, index, arr) => 
      arr.findIndex(o => o.value === opt.value) === index // Remove duplicates
    );
};

/**
 * Sorts select options by label
 */
export const sortSelectOptions = (options: SelectOption[]): SelectOption[] => {
  return [...options].sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Checks if a select field has valid options
 */
export const hasValidSelectOptions = (field: DynamicField): boolean => {
  return field.type === "select" && 
         field.options && 
         Array.isArray(field.options) && 
         field.options.length > 0 &&
         field.options.every(opt => 
           typeof opt === 'object' && opt.value && opt.label
         ) || false;
};
