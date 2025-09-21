import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "~/lib/utils";
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
}

export const CategoryTypeahead: React.FC<CategoryTypeaheadProps> = ({
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
}) => {
  const { getCategorySuggestions, addCategory, loadCategories } =
    useCategories();
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [inputValue, setInputValue] = React.useState(value);
  const [isCreating, setIsCreating] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const [isInteracting, setIsInteracting] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const blurTimeoutRef = React.useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  // Load categories when component mounts
  React.useEffect(() => {
    if (householdId) {
      loadCategories(householdId);
    }
  }, [householdId, loadCategories]);

  // Update input value when prop value changes
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchQuery(newValue);

    if (newValue.trim()) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (inputValue.trim()) {
      setSearchQuery(inputValue);
      setIsOpen(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // On mobile, give more time for interactions
    const isMobile = window.innerWidth < 768;
    const delay = isMobile ? 300 : 200;

    blurTimeoutRef.current = setTimeout(() => {
      // Don't close if user is still interacting with the component
      if (!isInteracting) {
        setIsOpen(false);
        setSearchQuery("");
        setFocusedIndex(-1);
        onBlur?.();
      }
    }, delay);
  };

  const handleSelectCategory = React.useCallback(
    (categoryName: string) => {
      setInputValue(categoryName);
      onChange(categoryName);
      setIsOpen(false);
      setSearchQuery("");
      setFocusedIndex(-1);
      setIsInteracting(false);
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleCreateCategory = React.useCallback(async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || !allowCreate) return;

    setIsCreating(true);
    setIsInteracting(false);
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    try {
      await addCategory(householdId, trimmedQuery);
      handleSelectCategory(trimmedQuery);
    } catch (error) {
      console.error("Failed to create category:", error);
    } finally {
      setIsCreating(false);
    }
  }, [
    addCategory,
    householdId,
    handleSelectCategory,
    searchQuery,
    allowCreate,
  ]);

  const handleClear = () => {
    setInputValue("");
    onChange("");
    setSearchQuery("");
    setIsOpen(false);
    setIsInteracting(false);
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    inputRef.current?.focus();
  };

  const suggestions = React.useMemo(() => {
    return getCategorySuggestions(searchQuery, maxSuggestions);
  }, [searchQuery, getCategorySuggestions, maxSuggestions]);

  const showCreateOption =
    allowCreate &&
    searchQuery.trim() &&
    !suggestions.some(
      cat => cat.name.toLowerCase() === searchQuery.toLowerCase()
    ) &&
    searchQuery.trim().length > 0;

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          setIsOpen(false);
          setSearchQuery("");
          setFocusedIndex(-1);
          inputRef.current?.blur();
          break;
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex(prev => {
            const maxIndex =
              suggestions.length + (showCreateOption ? 1 : 0) - 1;
            return prev < maxIndex ? prev + 1 : 0;
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex(prev => {
            const maxIndex =
              suggestions.length + (showCreateOption ? 1 : 0) - 1;
            return prev > 0 ? prev - 1 : maxIndex;
          });
          break;
        case "Enter":
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
            handleSelectCategory(suggestions[focusedIndex].name);
          } else if (focusedIndex === suggestions.length && showCreateOption) {
            handleCreateCategory();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    focusedIndex,
    suggestions,
    showCreateOption,
    handleCreateCategory,
    handleSelectCategory,
  ]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-describedby={`category-typeahead-help`}
          className={cn(
            "flex h-10 w-full rounded-md border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 pr-20 transition-all duration-200 hover:border-slate-500",
            className
          )}
        />

        {/* Clear button */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            onMouseDown={e => {
              e.preventDefault(); // Prevent blur
              setIsInteracting(true);
            }}
            onMouseUp={() => setIsInteracting(false)}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            disabled={disabled}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={e => {
            e.preventDefault();
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          onMouseDown={e => {
            e.preventDefault(); // Prevent blur
            setIsInteracting(true);
          }}
          onMouseUp={() => setIsInteracting(false)}
          onTouchStart={() => setIsInteracting(true)}
          onTouchEnd={() => setIsInteracting(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          disabled={disabled}
          aria-label={isOpen ? "Close options" : "Open options"}
          aria-expanded={isOpen}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
          aria-label="Category options"
          onMouseDown={() => setIsInteracting(true)}
          onMouseUp={() => setIsInteracting(false)}
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          onTouchStart={() => setIsInteracting(true)}
          onTouchEnd={() => setIsInteracting(false)}
        >
          {/* Search input in dropdown */}
          <div className="sticky top-0 bg-slate-800 p-2 border-b border-slate-600">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Suggestions list */}
          <div className="py-1">
            {suggestions.length === 0 && searchQuery.trim() ? (
              <div className="px-3 py-2 text-sm text-slate-400">
                No categories found
              </div>
            ) : (
              <>
                {suggestions.map((category, index) => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => handleSelectCategory(category.name)}
                    onMouseDown={e => {
                      e.preventDefault(); // Prevent blur
                      setIsInteracting(true);
                    }}
                    onMouseUp={() => setIsInteracting(false)}
                    onTouchStart={() => setIsInteracting(true)}
                    onTouchEnd={() => setIsInteracting(false)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none transition-colors",
                      category.name === value &&
                        "bg-blue-600 text-white hover:bg-blue-700",
                      focusedIndex === index && "bg-slate-700"
                    )}
                    role="option"
                    aria-selected={category.name === value}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{category.name}</span>
                      {category.name === value && (
                        <Check className="h-4 w-4 flex-shrink-0" />
                      )}
                    </div>
                    {category.isDefault && (
                      <div className="text-xs text-slate-400 mt-1">
                        Default category
                      </div>
                    )}
                  </button>
                ))}

                {/* Create new category option */}
                {showCreateOption && (
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    onMouseDown={e => {
                      e.preventDefault(); // Prevent blur
                      setIsInteracting(true);
                    }}
                    onMouseUp={() => setIsInteracting(false)}
                    onTouchStart={() => setIsInteracting(true)}
                    onTouchEnd={() => setIsInteracting(false)}
                    onMouseEnter={() => setFocusedIndex(suggestions.length)}
                    disabled={isCreating}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm text-blue-400 hover:bg-slate-700 focus:bg-slate-700 focus:outline-none transition-colors border-t border-slate-600",
                      focusedIndex === suggestions.length && "bg-slate-700"
                    )}
                    role="option"
                    aria-selected={false}
                  >
                    <div className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      {isCreating
                        ? "Creating..."
                        : `Create "${searchQuery.trim()}"`}
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Screen reader help text */}
      <div id="category-typeahead-help" className="sr-only">
        Use arrow keys to navigate options. Press Enter to select. Press Escape
        to close.
      </div>
    </div>
  );
};

// Plus icon component (since it's not imported)
const Plus: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
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
);
