/**
 * Reusable loading components with consistent styling
 */

import * as React from "react";
import { cn } from "~/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-b-2 border-blue-500",
        sizeClasses[size],
        className
      )}
    />
  );
};

interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  size = "md",
  message = "Loading...",
  fullScreen = false,
  className,
}) => {
  const containerClasses = fullScreen
    ? "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"
    : "flex items-center justify-center min-h-[200px]";

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center">
        <LoadingSpinner size={size} className="mx-auto mb-4" />
        <p className="text-slate-300">{message}</p>
      </div>
    </div>
  );
};

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  isLoading,
  children,
  loadingText,
  className,
}) => {
  if (isLoading) {
    return (
      <span className={cn("flex items-center justify-center", className)}>
        <LoadingSpinner size="sm" className="mr-2" />
        {loadingText || children}
      </span>
    );
  }

  return <>{children}</>;
};

interface PageLoadingProps {
  message?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = "Loading...",
}) => {
  return <LoadingState fullScreen message={message} />;
};

interface InlineLoadingProps {
  message?: string;
  size?: "sm" | "md";
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  message = "Loading...",
  size = "sm",
}) => {
  return (
    <div className="flex items-center justify-center py-4">
      <LoadingSpinner size={size} className="mr-2" />
      <span className="text-slate-300 text-sm">{message}</span>
    </div>
  );
};
