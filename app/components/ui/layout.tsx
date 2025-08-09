import * as React from "react";
import { cn } from "~/lib/utils";

// Shared layout wrapper component
const PageLayout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    maxWidth?: "2xl" | "4xl";
  }
>(({ className, maxWidth = "4xl", children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-4",
      className
    )}
    {...props}
  >
    <div className={cn("mx-auto", maxWidth === "2xl" ? "max-w-2xl" : "max-w-4xl")}>
      {children}
    </div>
  </div>
));
PageLayout.displayName = "PageLayout";

// Shared page header component
const PageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title: string;
    subtitle?: string;
  }
>(({ className, title, subtitle, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4 sm:mb-6", className)} {...props}>
    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
      {title}
    </h1>
    {subtitle && (
      <p className="text-slate-300 text-sm sm:text-base">{subtitle}</p>
    )}
  </div>
));
PageHeader.displayName = "PageHeader";

export { PageLayout, PageHeader };