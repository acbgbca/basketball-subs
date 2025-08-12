import { useState, useEffect } from 'react';
import { formatTimeNullable, parseTime } from '../utils/timeUtils';

/**
 * Custom hook for managing time input with validation and formatting
 * @param initialTime - Initial time in seconds (null for no initial value)
 * @param onTimeChange - Callback when valid time changes
 * @returns Object with input value, handlers, and validation state
 */
export function useTimeInput(
  initialTime: number | null = null,
  onTimeChange?: (newTime: number) => void
) {
  const [timeInSeconds, setTimeInSeconds] = useState<number | null>(initialTime);
  const [rawInput, setRawInput] = useState<string>(
    initialTime != null ? formatTimeNullable(initialTime) : ''
  );
  const [isValid, setIsValid] = useState<boolean>(true);

  // Update state when initialTime changes
  useEffect(() => {
    setTimeInSeconds(initialTime);
    setRawInput(initialTime != null ? formatTimeNullable(initialTime) : '');
    setIsValid(true);
  }, [initialTime]);

  // Handle input change: update raw value, validate and update seconds if valid
  const handleChange = (value: string) => {
    setRawInput(value);
    
    if (value === '') {
      setTimeInSeconds(null);
      setIsValid(true);
      if (onTimeChange) onTimeChange(0);
      return;
    }

    // Validate mm:ss format
    const isValidFormat = /^\d{1,2}:\d{2}$/.test(value);
    setIsValid(isValidFormat);

    if (isValidFormat) {
      const seconds = parseTime(value);
      const isValidTime = !isNaN(seconds);
      setIsValid(isValidTime);
      
      if (isValidTime) {
        setTimeInSeconds(seconds);
        if (onTimeChange) onTimeChange(seconds);
      }
    }
  };

  // Handle blur: reformat if valid, restore previous value if invalid
  const handleBlur = () => {
    if (isValid && timeInSeconds != null) {
      // Reformat to ensure consistent display
      setRawInput(formatTimeNullable(timeInSeconds));
    } else if (!isValid && timeInSeconds != null) {
      // Restore previous valid value
      setRawInput(formatTimeNullable(timeInSeconds));
      setIsValid(true);
    } else if (rawInput === '') {
      // Empty is valid
      setIsValid(true);
    }
  };

  // Validate time is within bounds
  const validateBounds = (maxSeconds?: number, minSeconds: number = 0): boolean => {
    if (timeInSeconds == null) return true;
    if (timeInSeconds < minSeconds) return false;
    if (maxSeconds != null && timeInSeconds > maxSeconds) return false;
    return true;
  };

  return {
    // Current state
    value: rawInput,
    timeInSeconds,
    isValid,
    
    // Event handlers
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
    handleBlur,
    
    // Utilities
    validateBounds,
    reset: () => {
      setTimeInSeconds(null);
      setRawInput('');
      setIsValid(true);
    },
    
    // Set specific time
    setTime: (seconds: number | null) => {
      setTimeInSeconds(seconds);
      setRawInput(seconds != null ? formatTimeNullable(seconds) : '');
      setIsValid(true);
    }
  };
}