/**
 * Error boundary and error display components
 */

import * as React from "react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console and call onError callback
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay 
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorDisplayProps {
  error?: Error;
  title?: string;
  message?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  actions?: ReactNode;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = "Something went wrong",
  message,
  onRetry,
  showDetails = false,
  actions
}) => {
  const [showFullError, setShowFullError] = React.useState(false);

  const defaultMessage = error?.message || "An unexpected error occurred. Please try again.";
  const displayMessage = message || defaultMessage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <CardTitle className="text-xl text-slate-100">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-center">{displayMessage}</p>
          
          {error && (
            <div className="space-y-2">
              <button
                onClick={() => setShowFullError(!showFullError)}
                className="text-sm text-slate-400 hover:text-slate-300 underline"
              >
                {showFullError ? 'Hide' : 'Show'} technical details
              </button>
              {showFullError && (
                <div className="p-3 bg-slate-900/50 rounded border border-slate-700">
                  <pre className="text-xs text-slate-400 whitespace-pre-wrap break-words">
                    {error.stack || error.message}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {onRetry && (
              <Button 
                onClick={onRetry}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {actions && (
            <div className="pt-2 border-t border-slate-700">
              {actions}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
  message?: string;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry, message }) => {
  return (
    <ErrorDisplay
      title="Connection Problem"
      message={message || "Unable to connect to the server. Please check your internet connection and try again."}
      onRetry={onRetry}
    />
  );
};

interface NotFoundErrorProps {
  resource?: string;
  onGoHome?: () => void;
}

export const NotFoundError: React.FC<NotFoundErrorProps> = ({ resource = "page", onGoHome }) => {
  return (
    <ErrorDisplay
      title="Not Found"
      message={`The ${resource} you're looking for doesn't exist or has been moved.`}
      actions={
        <Button 
          onClick={onGoHome || (() => window.location.href = '/')}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Home className="mr-2 h-4 w-4" />
          Go Home
        </Button>
      }
    />
  );
};

interface AuthErrorProps {
  onSignIn?: () => void;
  message?: string;
}

export const AuthError: React.FC<AuthErrorProps> = ({ onSignIn, message }) => {
  return (
    <ErrorDisplay
      title="Authentication Required"
      message={message || "You need to sign in to access this content."}
      actions={
        <Button 
          onClick={onSignIn || (() => window.location.href = '/login')}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          Sign In
        </Button>
      }
    />
  );
};