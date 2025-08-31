import { cn } from "~/lib/utils";

// Shared input styling constants
export const INPUT_STYLES = {
  // Base styles for all inputs
  base: "flex w-full rounded-md border bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-500",
  
  // Size variants
  sizes: {
    sm: "h-8 text-xs px-2 py-1",
    default: "h-10 text-sm px-3 py-2",
    lg: "h-12 text-base px-4 py-3",
  },

  // State variants
  states: {
    default: "border-slate-600 focus:ring-blue-500",
    error: "border-red-500 focus:ring-red-500 bg-red-900/10",
    warning: "border-yellow-500 focus:ring-yellow-500 bg-yellow-900/10",
    success: "border-green-500 focus:ring-green-500 bg-green-900/10",
  },

  // Special variants for different input types
  variants: {
    textarea: "min-h-[80px] resize-none",
    search: "pl-10", // Space for search icon
    file: "file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500",
    checkbox: "w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer",
  },

  // Icon positioning
  withIcon: {
    left: "pl-10",
    right: "pr-10",
    both: "px-10",
  },
} as const;

// Helper function to build input classes
export function getInputClasses(options: {
  size?: keyof typeof INPUT_STYLES.sizes;
  state?: keyof typeof INPUT_STYLES.states;
  variant?: keyof typeof INPUT_STYLES.variants;
  hasIcon?: 'left' | 'right' | 'both' | false;
  className?: string;
}) {
  const { size = 'default', state = 'default', variant, hasIcon, className } = options;
  
  return cn(
    INPUT_STYLES.base,
    INPUT_STYLES.sizes[size],
    INPUT_STYLES.states[state],
    variant && INPUT_STYLES.variants[variant],
    hasIcon && INPUT_STYLES.withIcon[hasIcon],
    className
  );
}

// Shared focus ring styles for interactive elements
export const FOCUS_RING_STYLES = {
  default: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
  destructive: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
  success: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
} as const;

// Animation constants
export const TRANSITION_STYLES = {
  default: "transition-all duration-200",
  fast: "transition-all duration-150",
  slow: "transition-all duration-300",
} as const;