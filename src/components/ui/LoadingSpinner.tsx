import React from 'react';
import { Spinner, Card, Alert } from 'react-bootstrap';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  text?: string;
  centered?: boolean;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

/**
 * Consistent loading spinner component with multiple display options
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text = 'Loading...',
  centered = true,
  fullScreen = false,
  overlay = false,
  className = '',
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'spinner-border-sm';
      case 'lg':
        return 'spinner-border-lg';
      default:
        return '';
    }
  };

  const spinnerElement = (
    <div className={`d-flex align-items-center ${className}`}>
      <Spinner
        animation="border"
        variant={variant}
        className={`${getSpinnerSize()} me-2`}
        role="status"
        aria-hidden="true"
      />
      {text && <span>{text}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75"
        style={{ zIndex: 9999 }}
      >
        <Card className="text-center p-4 shadow">
          <Card.Body>
            {spinnerElement}
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (overlay) {
    return (
      <div 
        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75"
        style={{ zIndex: 1000 }}
      >
        {spinnerElement}
      </div>
    );
  }

  if (centered) {
    return (
      <div className="text-center py-4">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

/**
 * Loading card component for content areas
 */
export const LoadingCard: React.FC<{
  title?: string;
  text?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}> = ({
  title = 'Loading',
  text = 'Please wait while we load your data...',
  variant = 'primary',
  className = '',
}) => (
  <Card className={`text-center ${className}`}>
    <Card.Body className="py-5">
      <LoadingSpinner variant={variant} size="lg" text="" />
      <h5 className="mt-3 mb-2">{title}</h5>
      <p className="text-muted mb-0">{text}</p>
    </Card.Body>
  </Card>
);

/**
 * Skeleton loading component for list items
 */
export const SkeletonLoader: React.FC<{
  rows?: number;
  height?: string;
  className?: string;
}> = ({ rows = 3, height = '20px', className = '' }) => (
  <div className={className}>
    {Array.from({ length: rows }, (_, index) => (
      <div
        key={index}
        className="bg-light rounded mb-2 animate-pulse"
        style={{ height }}
        aria-hidden="true"
      />
    ))}
  </div>
);

/**
 * Loading state for tables
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`table-responsive ${className}`}>
    <table className="table">
      <thead>
        <tr>
          {Array.from({ length: columns }, (_, index) => (
            <th key={index}>
              <div className="bg-light rounded" style={{ height: '20px' }} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <td key={colIndex}>
                <div className="bg-light rounded" style={{ height: '16px' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/**
 * Loading overlay for existing content
 */
export const LoadingOverlay: React.FC<{
  show: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ show, text = 'Loading...', children, className = '' }) => (
  <div className={`position-relative ${className}`}>
    {children}
    {show && (
      <div 
        className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75"
        style={{ zIndex: 10 }}
      >
        <LoadingSpinner text={text} />
      </div>
    )}
  </div>
);

/**
 * Button with loading state
 */
export const LoadingButton: React.FC<{
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: string;
  size?: 'sm' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}> = ({
  loading,
  loadingText = 'Loading...',
  children,
  variant = 'primary',
  size,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) => (
  <button
    type={type}
    className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`}
    disabled={loading || disabled}
    onClick={onClick}
  >
    {loading && (
      <Spinner
        animation="border"
        size="sm"
        className="me-2"
        role="status"
        aria-hidden="true"
      />
    )}
    {loading ? loadingText : children}
  </button>
);

/**
 * Inline loading indicator
 */
export const InlineLoader: React.FC<{
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ text = 'Loading...', size = 'sm', className = '' }) => (
  <span className={`d-inline-flex align-items-center ${className}`}>
    <Spinner
      animation="border"
      size="sm"
      className="me-2"
      style={{ width: size === 'sm' ? '1rem' : '1.5rem', height: size === 'sm' ? '1rem' : '1.5rem' }}
    />
    {text}
  </span>
);

/**
 * CSS for pulse animation (add to global styles)
 */
export const pulseAnimation = `
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;