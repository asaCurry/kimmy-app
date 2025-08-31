import * as React from "react";
import { UnifiedSelect } from "./select-unified";
import { useCategories } from "~/contexts/categories-context";

interface CategoryTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  householdId: string;
  allowCreate?: boolean;
  maxSuggestions?: number;
  label?: string;
  description?: string;
  error?: string;
}

export const CategoryTypeaheadUnified: React.FC<CategoryTypeaheadProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = "Select or type a category...",
  className,
  disabled = false,
  required = false,
  householdId,
  allowCreate = true,
  maxSuggestions = 8,
  label,
  description,
  error,
}) => {
  const { categories, getCategorySuggestions, addCategory, loadCategories } =
    useCategories();

  // Load categories when component mounts
  React.useEffect(() => {
    if (householdId) {
      loadCategories(householdId);
    }
  }, [householdId, loadCategories]);

  // Convert categories to options format
  const options = React.useMemo(() => {
    const suggestions = getCategorySuggestions("", maxSuggestions);
    return suggestions.map(category => ({
      label: category.name,
      value: category.name,
    }));
  }, [getCategorySuggestions, maxSuggestions]);

  const handleCreateCategory = React.useCallback(async (categoryName: string) => {
    if (!allowCreate) return;
    
    try {
      await addCategory(householdId, categoryName);
      onChange(categoryName);
    } catch (error) {
      console.error("Failed to create category:", error);
      throw error; // Re-throw so the select component can handle it
    }
  }, [addCategory, householdId, onChange, allowCreate]);

  return (
    <UnifiedSelect
      label={label}
      description={description}
      error={error}
      required={required}
      disabled={disabled}
      className={className}
      options={options}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      searchable={true}
      creatable={allowCreate}
      onCreateOption={handleCreateCategory}
      createText={(query) => `Create "${query}"`}
      noOptionsText="No categories found"
    />
  );
};