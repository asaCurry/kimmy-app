/**
 * Unified Form Controls System
 *
 * This file provides a consolidated, reusable form control system that eliminates
 * code duplication and provides consistent behavior across the application.
 *
 * Key Features:
 * - Unified state management with validation
 * - Consistent styling and accessibility
 * - Mobile-optimized interactions
 * - Built-in error handling and loading states
 * - Keyboard navigation support
 */

// Core hooks for state management
export { useInputState, type InputValidation } from "~/hooks/use-input-state";
export { useDropdownState } from "~/hooks/use-dropdown-state";

// Styling utilities
export {
  getInputClasses,
  INPUT_STYLES,
  FOCUS_RING_STYLES,
  TRANSITION_STYLES,
} from "~/lib/ui/input-styles";

// Unified form components
export {
  UnifiedInput,
  UnifiedTextarea,
  type UnifiedInputProps,
  type UnifiedTextareaProps,
  type BaseFormFieldProps,
} from "./form-field-unified";

export {
  UnifiedSelect,
  type UnifiedSelectProps,
  type SelectOption,
} from "./select-unified";

export { CategoryTypeaheadUnified } from "./category-typeahead-unified";

// Legacy components (backwards compatibility)
export { Input, type InputProps } from "./input";
export { Textarea } from "./textarea";
export { DynamicField, FORM_FIELD_STYLES } from "./form-field";

// Re-export existing components that work well
export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "./select";

/**
 * Migration Guide:
 *
 * Old Pattern:
 * ```tsx
 * <input
 *   className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700/50..."
 *   onChange={handleChange}
 * />
 * ```
 *
 * New Pattern:
 * ```tsx
 * <UnifiedInput
 *   label="Field Label"
 *   placeholder="Enter value"
 *   onChange={handleChange}
 *   validation={{ required: true, minLength: 3 }}
 * />
 * ```
 *
 * For complex dropdowns:
 * ```tsx
 * <UnifiedSelect
 *   label="Choose Option"
 *   options={[{ label: "Option 1", value: "1" }]}
 *   searchable
 *   creatable
 *   onCreateOption={handleCreate}
 * />
 * ```
 */
