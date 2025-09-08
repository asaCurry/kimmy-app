import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { X, Plus, Hash, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";

interface SmartTagInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  label?: string;
  error?: string;
  maxTags?: number;
  className?: string;
}

export const SmartTagInput: React.FC<SmartTagInputProps> = ({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add tags...",
  label,
  error,
  maxTags = 10,
  className,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse existing tags
  const existingTags = React.useMemo(() => {
    return value
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }, [value]);

  // Filter suggestions based on input and existing tags
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) return suggestions.slice(0, 8);

    const input = inputValue.toLowerCase().trim();
    return suggestions
      .filter(
        suggestion =>
          suggestion.toLowerCase().includes(input) &&
          !existingTags.some(
            tag => tag.toLowerCase() === suggestion.toLowerCase()
          )
      )
      .slice(0, 8);
  }, [inputValue, suggestions, existingTags]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const cleanTag = tag.trim();
    if (!cleanTag) return;

    // Check if tag already exists (case insensitive)
    const tagExists = existingTags.some(
      existingTag => existingTag.toLowerCase() === cleanTag.toLowerCase()
    );

    if (tagExists || existingTags.length >= maxTags) return;

    const newTags = [...existingTags, cleanTag];
    onChange(newTags.join(", "));
    setInputValue("");
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = existingTags.filter((_, index) => index !== indexToRemove);
    onChange(newTags.join(", "));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredSuggestions.length
        ) {
          addTag(filteredSuggestions[highlightedIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;
      case "Backspace":
        if (!inputValue && existingTags.length > 0) {
          removeTag(existingTags.length - 1);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
          setIsDropdownOpen(true);
          setHighlightedIndex(prev =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (filteredSuggestions.length > 0) {
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
        }
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
      case ",":
        e.preventDefault();
        if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsDropdownOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-200">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {/* Existing tags */}
        {existingTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingTags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-blue-500/20 text-blue-300 border-blue-500/30 flex items-center gap-1 pr-1"
              >
                <Hash className="w-3 h-3" />
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-red-500/20 hover:text-red-300 ml-1"
                  onClick={() => removeTag(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="relative">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              placeholder={
                existingTags.length >= maxTags
                  ? `Maximum ${maxTags} tags reached`
                  : placeholder
              }
              disabled={existingTags.length >= maxTags}
              className={cn(
                "transition-colors",
                isDropdownOpen &&
                  filteredSuggestions.length > 0 &&
                  "border-blue-500",
                error && "border-red-500"
              )}
            />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {inputValue.trim() && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-blue-500/20"
                  onClick={() => addTag(inputValue)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}

              {filteredSuggestions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-slate-700"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform",
                      isDropdownOpen && "rotate-180"
                    )}
                  />
                </Button>
              )}
            </div>
          </div>

          {/* Suggestions dropdown */}
          {isDropdownOpen && filteredSuggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
            >
              <div className="py-1">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-slate-700 flex items-center space-x-2",
                      index === highlightedIndex && "bg-slate-700"
                    )}
                    onClick={() => addTag(suggestion)}
                  >
                    <Hash className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-200">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Helper text */}
      <div className="text-xs text-slate-500">
        {existingTags.length < maxTags ? (
          <span>
            Press Enter or comma to add tags. {maxTags - existingTags.length}{" "}
            remaining.
          </span>
        ) : (
          <span className="text-amber-400">Maximum {maxTags} tags reached</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <X className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};
