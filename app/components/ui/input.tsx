import * as React from "react";
import { UnifiedInput } from "./form-field-unified";

// Legacy Input component - now uses UnifiedInput under the hood
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  size?: "default" | "sm" | "lg";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, success, icon, onChange, ...props }, ref) => {
    const handleChange = React.useCallback(
      (value: string) => {
        onChange?.({
          target: { value },
        } as React.ChangeEvent<HTMLInputElement>);
      },
      [onChange]
    );

    const _state = error ? "error" : success ? "success" : "default";

    return (
      <UnifiedInput
        ref={ref}
        className={className}
        icon={icon}
        error={error ? "This field has an error" : undefined}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

// Re-export unified components for new usage
export { UnifiedInput, UnifiedTextarea } from "./form-field-unified";
export type { UnifiedInputProps } from "./form-field-unified";
