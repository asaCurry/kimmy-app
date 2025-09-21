import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Badge } from "./badge";
import { Clock, Star, User, Zap, ChevronDown, X } from "lucide-react";
import { cn } from "~/lib/utils";
import type {
  AutoCompletionSuggestion,
  FieldSuggestions,
} from "~/lib/auto-completion-service";

interface SmartInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  suggestions?: FieldSuggestions;
  onSelectSuggestion?: (suggestion: AutoCompletionSuggestion) => void;
  showSuggestions?: boolean;
  label?: string;
  error?: string;
  isLoading?: boolean;
}

export const SmartInput = React.forwardRef<HTMLInputElement, SmartInputProps>(
  (
    {
      suggestions,
      onSelectSuggestion,
      showSuggestions = true,
      label,
      error,
      isLoading = false,
      className,
      onFocus,
      onBlur,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowDropdown(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get all suggestions in order
    const allSuggestions = React.useMemo(() => {
      if (!suggestions) return [];

      const currentValue = (value as string)?.toLowerCase().trim() || "";

      // Filter suggestions based on current input
      const filterSuggestions = (suggestionList: AutoCompletionSuggestion[]) =>
        suggestionList.filter(
          s =>
            currentValue === "" || s.value.toLowerCase().includes(currentValue)
        );

      const recent = filterSuggestions(suggestions.recent);
      const frequent = filterSuggestions(suggestions.frequent);
      const contextual = filterSuggestions(suggestions.contextual);

      return [...recent, ...frequent, ...contextual].slice(0, 8);
    }, [suggestions, value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (showSuggestions && allSuggestions.length > 0) {
        setShowDropdown(true);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Delay hiding dropdown to allow for clicks
      setTimeout(() => setShowDropdown(false), 150);

      // Ensure event has the expected structure for onBlur handlers
      if (onBlur) {
        try {
          onBlur(e);
        } catch (error) {
          console.warn("SmartInput onBlur error:", error);
        }
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      if (showSuggestions && allSuggestions.length > 0) {
        setShowDropdown(true);
        setHighlightedIndex(-1);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || allSuggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev < allSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : allSuggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < allSuggestions.length
          ) {
            selectSuggestion(allSuggestions[highlightedIndex]);
          }
          break;
        case "Escape":
          setShowDropdown(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    const selectSuggestion = (suggestion: AutoCompletionSuggestion) => {
      onSelectSuggestion?.(suggestion);
      setShowDropdown(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    };

    const getSuggestionIcon = (
      suggestion: AutoCompletionSuggestion,
      isFromRecent: boolean,
      isFromFrequent: boolean
    ) => {
      if (isFromRecent) return <Clock className="w-3 h-3 text-blue-400" />;
      if (isFromFrequent) return <Star className="w-3 h-3 text-yellow-400" />;
      if (suggestion.context?.memberId)
        return <User className="w-3 h-3 text-green-400" />;
      return <Zap className="w-3 h-3 text-purple-400" />;
    };

    const getSuggestionCategory = (
      suggestion: AutoCompletionSuggestion
    ): string => {
      if (suggestions?.recent.includes(suggestion)) return "Recent";
      if (suggestions?.frequent.includes(suggestion)) return "Frequent";
      return "Contextual";
    };

    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium text-slate-200 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          <Input
            ref={inputRef}
            className={cn(
              "transition-colors",
              showDropdown && allSuggestions.length > 0 && "border-blue-500",
              error && "border-red-500",
              className
            )}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            {...props}
          />

          {showSuggestions && allSuggestions.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-700"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform",
                  showDropdown && "rotate-180"
                )}
              />
            </Button>
          )}

          {isLoading && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showDropdown && allSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-64 overflow-y-auto"
          >
            <div className="py-1">
              {allSuggestions.map((suggestion, index) => {
                const isFromRecent =
                  suggestions?.recent.includes(suggestion) || false;
                const isFromFrequent =
                  suggestions?.frequent.includes(suggestion) || false;
                const category = getSuggestionCategory(suggestion);

                return (
                  <button
                    key={`${suggestion.value}-${index}`}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-slate-700 flex items-center justify-between group",
                      index === highlightedIndex && "bg-slate-700"
                    )}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      {getSuggestionIcon(
                        suggestion,
                        isFromRecent,
                        isFromFrequent
                      )}
                      <span className="text-slate-200 truncate">
                        {suggestion.value}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {suggestion.frequency > 1 && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-300"
                        >
                          {suggestion.frequency}x
                        </Badge>
                      )}

                      {suggestion.context?.memberName && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0.5 border-slate-600 text-slate-400"
                        >
                          {suggestion.context.memberName}
                        </Badge>
                      )}

                      <span className="text-xs text-slate-500 group-hover:text-slate-400">
                        {category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {allSuggestions.length === 0 && value && (
              <div className="px-3 py-2 text-sm text-slate-500 text-center">
                No suggestions found
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
            <X className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

SmartInput.displayName = "SmartInput";
