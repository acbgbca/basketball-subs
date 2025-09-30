import React, { useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface BaseModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'lg' | 'xl';
  centered?: boolean;
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  scrollable?: boolean;
  fullscreen?: boolean | 'sm-down' | 'md-down' | 'lg-down' | 'xl-down' | 'xxl-down';
  animation?: boolean;
  enforceFocus?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
  className?: string;
  dialogClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  
  // Footer configuration
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  primaryButton?: {
    text: string;
    onClick: () => void;
    variant?: string;
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit';
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
    variant?: string;
    disabled?: boolean;
  };
  
  // Header configuration
  showCloseButton?: boolean;
  closeButtonText?: string;
  
  // Accessibility
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: string;
}

/**
 * Base modal component with consistent behavior, styling, and accessibility
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  show,
  onHide,
  title,
  children,
  size,
  centered = true,
  backdrop = true,
  keyboard = true,
  scrollable = false,
  fullscreen,
  animation = true,
  enforceFocus = true,
  autoFocus = true,
  restoreFocus = true,
  className,
  dialogClassName,
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  
  showFooter = true,
  footerContent,
  primaryButton,
  secondaryButton,
  
  showCloseButton = true,
  closeButtonText = 'Close',
  
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  role = 'dialog',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${Date.now()}`;
  const bodyId = `modal-body-${Date.now()}`;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (keyboard && event.key === 'Escape' && show) {
        onHide();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [show, keyboard, onHide]);

  // Focus management
  useEffect(() => {
    if (show && autoFocus && modalRef.current) {
      // Focus the first focusable element in the modal
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [show, autoFocus]);

  // Render footer based on configuration
  const renderFooter = () => {
    if (!showFooter) return null;

    if (footerContent) {
      return (
        <Modal.Footer className={footerClassName}>
          {footerContent}
        </Modal.Footer>
      );
    }

    const hasButtons = primaryButton || secondaryButton || showCloseButton;
    if (!hasButtons) return null;

    return (
      <Modal.Footer className={footerClassName}>
        <div className="d-flex justify-content-end gap-2">
          {secondaryButton && (
            <Button
              variant={secondaryButton.variant || 'secondary'}
              onClick={secondaryButton.onClick}
              disabled={secondaryButton.disabled}
            >
              {secondaryButton.text}
            </Button>
          )}
          
          {showCloseButton && !primaryButton && !secondaryButton && (
            <Button variant="secondary" onClick={onHide}>
              {closeButtonText}
            </Button>
          )}
          
          {primaryButton && (
            <Button
              variant={primaryButton.variant || 'primary'}
              onClick={primaryButton.onClick}
              disabled={primaryButton.disabled || primaryButton.loading}
              type={primaryButton.type || 'button'}
            >
              {primaryButton.loading && (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              )}
              {primaryButton.text}
            </Button>
          )}
        </div>
      </Modal.Footer>
    );
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      scrollable={scrollable}
      fullscreen={fullscreen}
      animation={animation}
      enforceFocus={enforceFocus}
      autoFocus={autoFocus}
      restoreFocus={restoreFocus}
      className={className}
      dialogClassName={dialogClassName}
      contentClassName={contentClassName}
      aria-labelledby={ariaLabelledBy || titleId}
      aria-describedby={ariaDescribedBy || bodyId}
      role={role}
      ref={modalRef}
    >
      <Modal.Header closeButton className={headerClassName}>
        <Modal.Title id={titleId}>
          {title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body id={bodyId} className={bodyClassName}>
        {children}
      </Modal.Body>
      
      {renderFooter()}
    </Modal>
  );
};

/**
 * Confirmation modal for destructive actions
 */
export const ConfirmationModal: React.FC<{
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}> = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <BaseModal
      show={show}
      onHide={onHide}
      title={title}
      size="sm"
      primaryButton={{
        text: confirmText,
        onClick: onConfirm,
        variant,
        loading,
      }}
      secondaryButton={{
        text: cancelText,
        onClick: onHide,
      }}
    >
      <div className="text-center">
        <div className="mb-3">
          {variant === 'danger' && (
            <i className="fas fa-exclamation-triangle text-danger fa-3x" />
          )}
          {variant === 'warning' && (
            <i className="fas fa-exclamation-circle text-warning fa-3x" />
          )}
          {variant === 'info' && (
            <i className="fas fa-info-circle text-info fa-3x" />
          )}
        </div>
        <p className="mb-0">{message}</p>
      </div>
    </BaseModal>
  );
};

/**
 * Loading modal for async operations
 */
export const LoadingModal: React.FC<{
  show: boolean;
  title?: string;
  message?: string;
}> = ({
  show,
  title = 'Loading',
  message = 'Please wait...',
}) => {
  return (
    <BaseModal
      show={show}
      onHide={() => {}} // Cannot be closed
      title={title}
      size="sm"
      backdrop="static"
      keyboard={false}
      showFooter={false}
    >
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mb-0">{message}</p>
      </div>
    </BaseModal>
  );
};