import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing focus within a component
 */
export const useFocusManagement = () => {
  const focusableElementsSelector = 
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(focusableElementsSelector);
    const firstFocusableElement = focusableElements[0] as HTMLElement;
    const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = useCallback((previousActiveElement: Element | null) => {
    if (previousActiveElement && 'focus' in previousActiveElement) {
      (previousActiveElement as HTMLElement).focus();
    }
  }, []);

  return { trapFocus, restoreFocus };
};

/**
 * Hook for announcing messages to screen readers
 */
export const useScreenReaderAnnouncer = () => {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create live region for announcements
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-10000px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';
    document.body.appendChild(announcer);
    announcerRef.current = announcer;

    return () => {
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;
    }
  }, []);

  return { announce };
};

/**
 * Component for skip links navigation
 */
export const SkipLinks: React.FC<{
  links: Array<{ href: string; label: string }>;
}> = ({ links }) => (
  <div className="skip-links">
    {links.map((link, index) => (
      <a
        key={index}
        href={link.href}
        className="skip-link visually-hidden-focusable btn btn-primary position-absolute top-0 start-0"
        style={{ zIndex: 9999 }}
      >
        {link.label}
      </a>
    ))}
  </div>
);

/**
 * Component for focus indicator
 */
export const FocusIndicator: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`focus-indicator ${className}`}>
    {children}
  </div>
);

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void,
  onEnter?: () => void,
  onEscape?: () => void
) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        onArrowUp?.();
        e.preventDefault();
        break;
      case 'ArrowDown':
        onArrowDown?.();
        e.preventDefault();
        break;
      case 'ArrowLeft':
        onArrowLeft?.();
        e.preventDefault();
        break;
      case 'ArrowRight':
        onArrowRight?.();
        e.preventDefault();
        break;
      case 'Enter':
        onEnter?.();
        e.preventDefault();
        break;
      case 'Escape':
        onEscape?.();
        e.preventDefault();
        break;
    }
  }, [onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape]);

  return { handleKeyDown };
};

/**
 * Component for accessible button with enhanced keyboard support
 */
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  variant?: string;
  size?: string;
  type?: 'button' | 'submit' | 'reset';
}> = ({
  children,
  onClick,
  onKeyDown,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  variant = 'primary',
  size,
  type = 'button',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
    onKeyDown?.(e);
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      {children}
    </button>
  );
};

/**
 * Component for accessible form group with proper labeling
 */
export const AccessibleFormGroup: React.FC<{
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}> = ({ label, children, required = false, error, helpText, className = '' }) => {
  const id = `form-group-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className={`form-group ${className}`}>
      <label htmlFor={id} className="form-label">
        {label}
        {required && <span className="text-danger ms-1" aria-label="required">*</span>}
      </label>
      
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-describedby': [
          error ? errorId : null,
          helpText ? helpId : null,
        ].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
      })}
      
      {error && (
        <div id={errorId} className="invalid-feedback d-block" role="alert">
          <i className="fas fa-exclamation-circle me-1" aria-hidden="true" />
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div id={helpId} className="form-text">
          {helpText}
        </div>
      )}
    </div>
  );
};

/**
 * Component for accessible progress indicator
 */
export const AccessibleProgress: React.FC<{
  value: number;
  max?: number;
  label?: string;
  className?: string;
}> = ({ value, max = 100, label, className = '' }) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className={className}>
      {label && (
        <div className="d-flex justify-content-between mb-1">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${percentage}%`}
      >
        <div
          className="progress-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Component for accessible tooltip
 */
export const AccessibleTooltip: React.FC<{
  children: React.ReactNode;
  tooltip: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}> = ({ children, tooltip, placement = 'top', className = '' }) => {
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`position-relative ${className}`}>
      {React.cloneElement(children as React.ReactElement, {
        'aria-describedby': tooltipId,
      })}
      <div
        id={tooltipId}
        className={`tooltip bs-tooltip-${placement}`}
        role="tooltip"
        style={{ position: 'absolute', display: 'none' }}
      >
        <div className="tooltip-inner">
          {tooltip}
        </div>
      </div>
    </div>
  );
};

/**
 * CSS for accessibility improvements
 */
export const accessibilityStyles = `
  /* Focus indicators */
  .focus-indicator:focus-within {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
  }

  /* Skip links */
  .skip-link {
    position: absolute !important;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 9999;
  }

  .skip-link:focus {
    top: 6px;
  }

  /* High contrast support */
  @media (prefers-contrast: high) {
    .btn {
      border-width: 2px;
    }
    
    .table-striped tbody tr:nth-of-type(odd) td {
      background-color: rgba(0, 0, 0, 0.1);
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* Screen reader only text */
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
`;