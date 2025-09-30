import { useState, useCallback, useMemo } from 'react';
import { ZodSchema, ZodError } from 'zod';

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

interface FormActions<T> {
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => (event?: React.FormEvent) => Promise<void>;
  reset: (newValues?: Partial<T>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  validateField: (field: keyof T) => void;
  validateForm: () => boolean;
}

type UseFormReturn<T> = FormState<T> & FormActions<T>;

/**
 * Custom hook for form state management with validation
 * @param initialValues - Initial form values
 * @param validationSchema - Optional Zod schema for validation
 */
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: ZodSchema<T>
): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed properties
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  // Validate a single field
  const validateField = useCallback((field: keyof T) => {
    if (!validationSchema) return;

    try {
      // Create a partial schema for the single field
      const fieldValue = values[field];
      validationSchema.pick({ [field]: true } as any).parse({ [field]: fieldValue });
      
      // Clear error if validation passes
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.errors.find(err => err.path.includes(field as string));
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field]: fieldError.message,
          }));
        }
      }
    }
  }, [values, validationSchema]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof T;
          if (!newErrors[field]) {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [values, validationSchema]);

  // Handle field value change
  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));

    // Validate on change if field was previously touched
    if (touched[field]) {
      setTimeout(() => validateField(field), 0);
    }
  }, [touched, validateField]);

  // Handle field blur (mark as touched and validate)
  const handleBlur = useCallback((field: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
    validateField(field);
  }, [validateField]);

  // Handle form submission
  const handleSubmit = useCallback((onSubmit: (values: T) => void | Promise<void>) => {
    return async (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }

      setIsSubmitting(true);

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      }, {} as Partial<Record<keyof T, boolean>>);
      setTouched(allTouched);

      // Validate form
      const isFormValid = validateForm();
      
      if (isFormValid) {
        try {
          await onSubmit(values);
        } catch (error) {
          // Handle submission error
          console.error('Form submission error:', error);
        }
      }

      setIsSubmitting(false);
    };
  }, [values, validateForm]);

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues ? { ...initialValues, ...newValues } : initialValues;
    setValues(resetValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set individual field value
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    handleChange(field, value);
  }, [handleChange]);

  // Set individual field error
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  // Set multiple errors
  const setFormErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrors(newErrors);
  }, []);

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    
    // Actions
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
    setErrors: setFormErrors,
    validateField,
    validateForm,
  };
};

/**
 * Hook for creating a controlled input field
 * @param form - Form instance from useForm
 * @param field - Field name
 */
export const useFormField = <T extends Record<string, any>>(
  form: UseFormReturn<T>,
  field: keyof T
) => {
  const { values, errors, touched, handleChange, handleBlur } = form;

  return {
    value: values[field],
    error: touched[field] ? errors[field] : undefined,
    hasError: touched[field] && !!errors[field],
    onChange: (value: any) => handleChange(field, value),
    onBlur: () => handleBlur(field),
  };
};