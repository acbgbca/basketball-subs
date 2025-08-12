import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state with optional reset functionality
 * @param initialState - Initial state for the modal (default: false)
 * @param resetFn - Optional function to call when modal is closed
 * @returns Object with show state, open, close, and toggle functions
 */
export function useModalState(initialState = false, resetFn?: () => void) {
  const [show, setShow] = useState(initialState);

  const open = useCallback(() => {
    setShow(true);
  }, []);

  const close = useCallback(() => {
    setShow(false);
    if (resetFn) {
      resetFn();
    }
  }, [resetFn]);

  const toggle = useCallback(() => {
    setShow(prev => {
      const newState = !prev;
      if (!newState && resetFn) {
        resetFn();
      }
      return newState;
    });
  }, [resetFn]);

  return {
    show,
    open,
    close,
    toggle,
    setShow
  };
}

/**
 * Custom hook for managing modal state with associated data
 * @param resetFn - Optional function to call when modal is closed
 * @returns Object with show state, data, open, close functions
 */
export function useModalWithData<T>(resetFn?: () => void) {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData: T) => {
    setData(modalData);
    setShow(true);
  }, []);

  const close = useCallback(() => {
    setShow(false);
    setData(null);
    if (resetFn) {
      resetFn();
    }
  }, [resetFn]);

  return {
    show,
    data,
    open,
    close,
    setShow,
    setData
  };
}