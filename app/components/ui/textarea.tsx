import * as React from "react";
import { UnifiedTextarea } from "./form-field-unified";

// Legacy Textarea component - now uses UnifiedTextarea under the hood
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  }
>(({ className, onChange, ...props }, ref) => {
  const handleChange = React.useCallback(
    (value: string) => {
      onChange?.({
        target: { value },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    },
    [onChange]
  );

  return (
    <UnifiedTextarea
      ref={ref}
      className={className}
      onChange={handleChange}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

// Re-export unified components for new usage
export { UnifiedTextarea } from "./form-field-unified";
