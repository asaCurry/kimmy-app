export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  householdId?: string;
  additionalData?: Record<string, any>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public context?: ErrorContext,
    public originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const logError = (
  error: Error | string,
  context?: ErrorContext,
  level: "error" | "warn" | "info" = "error"
) => {
  const errorMessage = typeof error === "string" ? error : error.message;
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message: errorMessage,
    context,
    stack: errorStack,
  };

  // In development, log to console
  if (import.meta.env?.DEV) {
    console.group(`🚨 ${level.toUpperCase()}: ${errorMessage}`);
    console.error("Context:", context);
    if (errorStack) {
      console.error("Stack:", errorStack);
    }
    console.groupEnd();
  }

  // In production, you could send to an error tracking service
  // e.g., Sentry, LogRocket, etc.
  if (import.meta.env?.PROD) {
    // TODO: Implement production error tracking
    console.error("Production error:", logData);
  }

  return logData;
};

export const logApiError = (
  error: Error | string,
  endpoint: string,
  context?: Omit<ErrorContext, "action">
) => {
  return logError(error, {
    ...context,
    action: `API: ${endpoint}`,
  });
};

export const logComponentError = (
  error: Error | string,
  componentName: string,
  context?: Omit<ErrorContext, "component">
) => {
  return logError(error, {
    ...context,
    component: componentName,
  });
};

export const logActionError = (
  error: Error | string,
  actionName: string,
  context?: Omit<ErrorContext, "action">
) => {
  return logError(error, {
    ...context,
    action: actionName,
  });
};

// Utility function to safely execute async operations with error logging
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  context?: ErrorContext,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await operation();
  } catch (error) {
    logError(error instanceof Error ? error : String(error), context);
    return fallback;
  }
};
