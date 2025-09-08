import * as React from "react";
import { useCategories } from "~/contexts/categories-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Label } from "./label";

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  householdId: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  householdId,
  placeholder = "Select a category...",
  className,
  disabled = false,
  required = false,
  label,
}) => {
  const { categories, loadCategories, isLoading } = useCategories();

  // Load categories when component mounts
  React.useEffect(() => {
    if (householdId) {
      loadCategories(householdId);
    }
  }, [householdId, loadCategories]);

  // Sort categories: default categories first, then custom ones alphabetically
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) => {
      // Default categories come first
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      // Within same type (default or custom), sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-slate-200">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </Label>
      )}

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={className}>
          <SelectValue
            placeholder={isLoading ? "Loading categories..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {sortedCategories.length > 0 ? (
            sortedCategories.map(category => (
              <SelectItem key={category.name} value={category.name}>
                <div className="flex items-center justify-between w-full">
                  <span>{category.name}</span>
                  {category.isDefault && (
                    <span className="text-xs text-slate-400 ml-2">Default</span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>
              No categories available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
