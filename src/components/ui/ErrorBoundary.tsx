import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container, Card } from 'react-bootstrap';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component to catch and handle React errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error reporting service (e.g., Sentry)
      console.error('Production error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container className="mt-4">
          <Card border="danger">
            <Card.Header className="bg-danger text-white">
              <h4 className="mb-0">
                <i className="fas fa-exclamation-triangle me-2" />
                Something went wrong
              </h4>
            </Card.Header>
            <Card.Body>
              <Alert variant="danger" className="mb-3">
                <Alert.Heading>Application Error</Alert.Heading>
                <p>
                  An unexpected error occurred while running the application. 
                  Please try refreshing the page or contact support if the problem persists.
                </p>
                
                {this.props.showDetails && this.state.error && (
                  <details className="mt-3">
                    <summary className="mb-2">
                      <strong>Error Details (for developers)</strong>
                    </summary>
                    <pre className="bg-light p-2 rounded small text-muted">
                      <strong>Error:</strong> {this.state.error.message}
                      {'\n\n'}
                      <strong>Stack:</strong> {this.state.error.stack}
                      {this.state.errorInfo && (
                        <>
                          {'\n\n'}
                          <strong>Component Stack:</strong> {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  </details>
                )}
              </Alert>

              <div className="d-flex gap-2">
                <Button variant="primary" onClick={this.handleRetry}>
                  <i className="fas fa-redo me-2" />
                  Try Again
                </Button>
                <Button variant="outline-secondary" onClick={this.handleReload}>
                  <i className="fas fa-refresh me-2" />
                  Reload Page
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

/**
 * Hook for manually triggering error boundary
 */
export const useErrorHandler = () => {
  return (error: Error) => {
    throw error;
  };
};