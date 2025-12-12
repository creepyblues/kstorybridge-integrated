import { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ModalErrorBoundary Component
 *
 * A lightweight error boundary designed for use within modals and dialogs.
 * Shows error state inline rather than taking over the entire page.
 */
class ModalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ModalErrorBoundary] Error caught:', error);
    console.error('[ModalErrorBoundary] Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Icon icon="solar:danger-circle-bold-duotone" className="w-8 h-8 text-red-600" aria-hidden="true" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>

          <p className="text-sm text-gray-600 mb-4 max-w-sm">
            {this.props.fallbackMessage || 'An unexpected error occurred. Please try again or close and reopen this dialog.'}
          </p>

          {/* Error details in development */}
          {import.meta.env.DEV && this.state.error && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-left w-full max-w-md">
              <p className="text-xs font-mono text-red-600 break-words">
                <strong>Error:</strong> {this.state.error.message}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
            >
              <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 mr-2" aria-hidden="true" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModalErrorBoundary;
