import * as React from "react";
import { cn } from "~/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { ChevronRight } from "lucide-react";

// Shared interactive card styling constants
const INTERACTIVE_CARD_STYLES = {
  base: "cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.02] sm:hover:scale-105 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:scale-[1.02] active:scale-[0.98]",
  dashed:
    "cursor-pointer border-dashed border-2 border-slate-600 transition-all duration-200 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/25 bg-slate-800/50 hover:scale-[1.02] sm:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:scale-[1.02] active:scale-[0.98]",
  header: "pb-3 sm:pb-4 p-4 sm:p-6",
  content: "p-4 sm:p-6 pt-0",
} as const;

// Base interactive card component
const InteractiveCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "dashed";
    onClick?: () => void;
  }
>(({ className, variant = "default", onClick, children, onKeyDown, ...props }, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
    onKeyDown?.(e);
  };

  return (
    <Card
      ref={ref}
      className={cn(
        variant === "dashed"
          ? INTERACTIVE_CARD_STYLES.dashed
          : INTERACTIVE_CARD_STYLES.base,
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      {...props}
    >
      {children}
    </Card>
  );
});
InteractiveCard.displayName = "InteractiveCard";

// Reusable card with icon, title, description and optional chevron
const IconCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    icon: React.ReactNode;
    title: string;
    description?: string;
    showChevron?: boolean;
    variant?: "default" | "dashed";
    onClick?: () => void;
  }
>(
  (
    {
      className,
      icon,
      title,
      description,
      showChevron = true,
      variant = "default",
      onClick,
      ...props
    },
    ref
  ) => (
    <InteractiveCard
      ref={ref}
      className={className}
      variant={variant}
      onClick={onClick}
      {...props}
    >
      <CardHeader className={INTERACTIVE_CARD_STYLES.header}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="flex-shrink-0">{icon}</div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl text-slate-100 truncate">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="text-slate-400 text-sm line-clamp-2">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          {showChevron && (
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
    </InteractiveCard>
  )
);
IconCard.displayName = "IconCard";

// Add card component (for dashed border "add" cards)
const AddCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string;
    description?: string;
    onClick?: () => void;
  }
>(({ className, title, description, onClick, ...props }, ref) => (
  <InteractiveCard
    ref={ref}
    className={className}
    variant="dashed"
    onClick={onClick}
    {...props}
  >
    <CardHeader className={INTERACTIVE_CARD_STYLES.header}>
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 text-slate-400">
        <div className="text-2xl sm:text-3xl bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          ➕
        </div>
        <div className="text-center sm:text-left">
          <CardTitle className="text-lg sm:text-xl text-slate-300">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-slate-500 text-sm">
              {description}
            </CardDescription>
          )}
        </div>
      </div>
    </CardHeader>
  </InteractiveCard>
));
AddCard.displayName = "AddCard";

export { InteractiveCard, IconCard, AddCard, INTERACTIVE_CARD_STYLES };
