import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@kstorybridge/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary
 *
 * Catches unhandled errors in React component tree and displays
 * a user-friendly error page instead of white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for development
    if (import.meta.env.DEV) {
      console.error('❌ Error Boundary caught error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // TODO: Send error to error tracking service (Sentry, etc.)
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Reload page to reset app state
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error page
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something Went Wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>

            {/* Error details (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  Error Details (Development Only)
                </h2>
                <p className="text-xs text-red-600 font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer font-medium mb-1">
                      Component Stack
                    </summary>
                    <pre className="whitespace-pre-wrap bg-white p-2 rounded border border-gray-200 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                Refresh Page
              </Button>
              <Button
                onClick={this.handleReset}
                className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
              >
                Return to Home
              </Button>
            </div>

            {/* Support link */}
            <div className="mt-6 text-center text-sm text-gray-500">
              If this problem persists, please{' '}
              <a
                href="/contact"
                className="text-hanok-teal hover:underline font-medium"
              >
                contact support
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
