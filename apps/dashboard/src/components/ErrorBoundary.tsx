import { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // TODO: Send error to error reporting service (e.g., Sentry)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Reload the page to reset the app state
    window.location.href = '/buyers/chat';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Icon icon="solar:danger-circle-bold-duotone" className="w-6 h-6 text-red-600" />
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-bold text-black mb-2">
                    Something went wrong
                  </h2>

                  <p className="text-sm text-gray-600 mb-4">
                    We're sorry for the inconvenience. An unexpected error occurred while rendering this page.
                  </p>

                  {/* Error details (only in development) */}
                  {import.meta.env.DEV && this.state.error && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs font-mono text-red-600 mb-2">
                        <strong>Error:</strong> {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <details className="text-xs font-mono text-gray-600">
                          <summary className="cursor-pointer text-gray-700 font-semibold mb-1">
                            Stack trace
                          </summary>
                          <pre className="whitespace-pre-wrap overflow-auto max-h-40 text-[10px]">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={this.handleReset}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      Go to Dashboard
                    </Button>

                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-100"
                    >
                      Reload Page
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Help text */}
            <p className="text-center text-xs text-gray-500 mt-4">
              If this error persists, please contact support at{' '}
              <a href="mailto:support@kstorybridge.com" className="text-black underline hover:no-underline">
                support@kstorybridge.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
