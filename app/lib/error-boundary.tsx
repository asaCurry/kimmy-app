/**
 * Production-safe error boundary components
 * Prevents sensitive information disclosure while providing useful feedback
 */

import * as React from "react";
import { logger } from "./logger";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  errorId: string;
  errorType: string;
  isDevelopment: boolean;
}

export class ProductionErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{
      error: Error;
      errorInfo: ErrorInfo;
      retry: () => void;
    }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }>,
  ErrorBoundaryState
> {
  private retryTimeoutId: number | null = null;

  constructor(props: any) {
    super(props);
    
    this.state = {
      hasError: false,
      errorId: '',
      errorType: 'Unknown Error',
      isDevelopment: this.checkIsDevelopment()
    };
  }

  private checkIsDevelopment(): boolean {
    try {
      return (
        typeof globalThis !== 'undefined' && 
        import.meta.env?.DEV === true
      ) || (
        typeof location !== 'undefined' && 
        (location.hostname === 'localhost' || location.hostname.includes('.dev'))
      );
    } catch {
      return false;
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate a unique error ID for tracking
    const errorId = Math.random().toString(36).substring(2, 15);
    
    return {
      hasError: true,
      errorId,
      errorType: error.name || 'Runtime Error'
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error securely
    logger.error('React component error caught by boundary', {
      errorType: error.name,
      errorId: this.state.errorId,
      // Only include stack trace in development
      ...(this.state.isDevelopment && {
        message: error.message,
        stack: error.stack?.slice(0, 1000) // Limit stack trace length
      })
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry after 5 seconds in development
    if (this.state.isDevelopment) {
      this.retryTimeoutId = window.setTimeout(() => {
        this.handleRetry();
      }, 5000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.setState({
      hasError: false,
      errorId: '',
      errorType: 'Unknown Error'
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={new Error(this.state.errorType)}
            errorInfo={{ componentStack: '' }}
            retry={this.handleRetry}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-red-900 dark:text-red-100">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              {this.state.isDevelopment && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-3">
                  <p className="text-sm text-red-800 dark:text-red-300 font-mono">
                    Error ID: {this.state.errorId}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    Type: {this.state.errorType}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleRetry} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
              
              {this.state.isDevelopment && this.retryTimeoutId && (
                <p className="text-xs text-slate-500">
                  Auto-retry in 5 seconds...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * API Error boundary for handling API-specific errors
 */
export class ApiErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    onError?: (error: Error, context: string) => void;
  }>,
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMessage: 'Failed to load data. Please try again later.'
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('API component error', {
      errorType: error.name,
      component: 'ApiErrorBoundary'
    });

    if (this.props.onError) {
      this.props.onError(error, 'API_ERROR_BOUNDARY');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Unable to Load Data
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {this.state.errorMessage}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{
    error: Error;
    errorInfo: ErrorInfo;
    retry: () => void;
  }>
) {
  return function WrappedComponent(props: P) {
    return (
      <ProductionErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ProductionErrorBoundary>
    );
  };
}

/**
 * Hook for handling async errors in components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    logger.error('Async error handled by hook', {
      errorType: errorObj.name,
      errorMessage: errorObj.message
    });
    
    setError(errorObj);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw the error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, clearError };
}

/**
 * Safe async function wrapper
 */
export function withAsyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  onError?: (error: Error) => void
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      logger.error('Async function error', {
        errorType: errorObj.name,
        errorMessage: errorObj.message
      });
      
      if (onError) {
        onError(errorObj);
      }
      
      return null;
    }
  };
}