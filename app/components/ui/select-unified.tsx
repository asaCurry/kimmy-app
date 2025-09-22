import * as React from "react";
import { cn } from "~/lib/utils";
import { useDropdownState } from "~/hooks/use-dropdown-state";
import { getInputClasses } from "~/lib/ui/input-styles";
import type { BaseFormFieldProps } from "./form-field-unified";
import { Label } from "./label";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface UnifiedSelectProps extends BaseFormFieldProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void;
  name?: string;
  _onValidationChange?: (isValid: boolean, error?: string) => void;
  searchable?: boolean;
  creatable?: boolean;
  onCreateOption?: (label: string) => Promise<void> | void;
  loading?: boolean;
  loadingText?: string;
  noOptionsText?: string;
  createText?: (query: string) => string;
}

export const UnifiedSelect = React.forwardRef<
  HTMLDivElement,
  UnifiedSelectProps
>(
  (
    {
      label,
      description,
      error,
      required,
      disabled,
      className,
      size = "default",
      options,
      value,
      defaultValue,
      placeholder = "Select an option...",
      onChange,
      onBlur,
      name,
      _onValidationChange,
      searchable = false,
      creatable = false,
      onCreateOption,
      loading = false,
      loadingText = "Loading...",
      noOptionsText = "No options found",
      createText = query => `Create "${query}"`,
      ..._props
    },
    _ref
  ) => {
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedValue, setSelectedValue] = React.useState(
      value || defaultValue || ""
    );
    const [isCreating, setIsCreating] = React.useState(false);

    const inputRef = React.useRef<HTMLInputElement>(null);

    const {
      isOpen,
      focusedIndex,
      containerRef,
      open,
      close,
      toggle,
      handleBlur,
      startInteracting,
      stopInteracting,
      handleKeyDown,
      setFocusedIndex,
    } = useDropdownState({
      closeOnBlur: true,
      blurDelay: 150,
      mobileBlurDelay: 300,
    });

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchQuery.trim()) return options;

      return options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [options, searchQuery, searchable]);

    // Show create option
    const showCreateOption =
      creatable &&
      searchQuery.trim() &&
      !filteredOptions.some(
        option => option.label.toLowerCase() === searchQuery.toLowerCase()
      ) &&
      onCreateOption;

    const totalItems = filteredOptions.length + (showCreateOption ? 1 : 0);

    // Get selected option for display
    const selectedOption = options.find(opt => opt.value === selectedValue);

    // Handle value changes
    React.useEffect(() => {
      if (value !== undefined && value !== selectedValue) {
        setSelectedValue(value);
      }
    }, [value, selectedValue]);

    // Handle option selection
    const selectOption = React.useCallback(
      (option: SelectOption) => {
        setSelectedValue(option.value);
        setSearchQuery("");
        onChange?.(option.value);
        close();
        inputRef.current?.blur();
      },
      [onChange, close]
    );

    // Handle creating new option
    const createOption = React.useCallback(async () => {
      if (!onCreateOption || !searchQuery.trim()) return;

      setIsCreating(true);
      try {
        await onCreateOption(searchQuery.trim());
        setSearchQuery("");
        close();
      } catch (error) {
        console.error("Failed to create option:", error);
      } finally {
        setIsCreating(false);
      }
    }, [onCreateOption, searchQuery, close]);

    // Handle keyboard navigation
    const onKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        const handled = handleKeyDown(e, totalItems, index => {
          if (index < filteredOptions.length) {
            selectOption(filteredOptions[index]);
          } else if (showCreateOption) {
            createOption();
          }
        });

        if (!handled && searchable && isOpen) {
          // Let search input handle typing
          return;
        }
      },
      [
        handleKeyDown,
        totalItems,
        filteredOptions,
        selectOption,
        showCreateOption,
        createOption,
        searchable,
        isOpen,
      ]
    );

    const inputId = `select-${React.useId()}`;
    const fieldState = error ? "error" : "default";

    return (
      <div className={cn("space-y-2", className)} ref={containerRef}>
        {label && (
          <Label htmlFor={inputId} className="text-slate-200">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </Label>
        )}

        <div className="relative">
          <div
            className={getInputClasses({
              size,
              state: fieldState,
              hasIcon: "right",
              className: cn(
                "cursor-pointer justify-between",
                !searchable && "select-none"
              ),
            })}
            onClick={searchable ? open : toggle}
            onKeyDown={onKeyDown}
            tabIndex={disabled ? -1 : 0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-describedby={cn(
              description && `${inputId}-description`,
              error && `${inputId}-error`
            )}
          >
            {searchable && isOpen ? (
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onBlur={handleBlur}
                placeholder={
                  selectedOption ? selectedOption.label : placeholder
                }
                className="flex-1 bg-transparent outline-none"
                disabled={disabled}
              />
            ) : (
              <span className="block truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggle}
            onMouseDown={startInteracting}
            onMouseUp={stopInteracting}
            onTouchStart={startInteracting}
            onTouchEnd={stopInteracting}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            disabled={disabled}
            aria-label={isOpen ? "Close options" : "Open options"}
            tabIndex={-1}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div
              className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto"
              role="listbox"
              aria-label="Options"
              onMouseDown={startInteracting}
              onMouseUp={stopInteracting}
              onTouchStart={startInteracting}
              onTouchEnd={stopInteracting}
            >
              {loading ? (
                <div className="px-3 py-2 text-sm text-slate-400 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  {loadingText}
                </div>
              ) : filteredOptions.length === 0 && !showCreateOption ? (
                <div className="px-3 py-2 text-sm text-slate-400">
                  {noOptionsText}
                </div>
              ) : (
                <div className="py-1">
                  {filteredOptions.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => selectOption(option)}
                      onMouseDown={startInteracting}
                      onMouseUp={stopInteracting}
                      onTouchStart={startInteracting}
                      onTouchEnd={stopInteracting}
                      onMouseEnter={() => setFocusedIndex(index)}
                      disabled={option.disabled}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        selectedValue === option.value &&
                          "bg-blue-600 text-white hover:bg-blue-700",
                        focusedIndex === index &&
                          !option.disabled &&
                          "bg-slate-700"
                      )}
                      role="option"
                      aria-selected={selectedValue === option.value}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{option.label}</span>
                        {selectedValue === option.value && (
                          <Check className="h-4 w-4 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}

                  {showCreateOption && (
                    <button
                      type="button"
                      onClick={createOption}
                      onMouseDown={startInteracting}
                      onMouseUp={stopInteracting}
                      onTouchStart={startInteracting}
                      onTouchEnd={stopInteracting}
                      onMouseEnter={() =>
                        setFocusedIndex(filteredOptions.length)
                      }
                      disabled={isCreating}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none transition-colors border-t border-slate-600 disabled:opacity-50",
                        focusedIndex === filteredOptions.length &&
                          "bg-slate-700"
                      )}
                      role="option"
                      aria-selected={false}
                    >
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        {isCreating ? "Creating..." : createText(searchQuery)}
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {description && (
          <p id={`${inputId}-description`} className="text-xs text-slate-400">
            {description}
          </p>
        )}

        {error && (
          <div
            id={`${inputId}-error`}
            className="mt-1 text-xs flex items-center gap-1 text-red-400"
          >
            <span className="text-sm">⚠️</span>
            {error}
          </div>
        )}
      </div>
    );
  }
);

UnifiedSelect.displayName = "UnifiedSelect";
