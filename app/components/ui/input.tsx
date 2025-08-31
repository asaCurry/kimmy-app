import * as React from "react";
import { cn } from "~/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-500",
            icon && "pl-10",
            error 
              ? "border-red-500 focus:ring-red-500 bg-red-900/10" 
              : success
                ? "border-green-500 focus:ring-green-500 bg-green-900/10"
                : "border-slate-600 focus:ring-blue-500",
            className
          )}
          ref={ref}
          aria-invalid={error}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
