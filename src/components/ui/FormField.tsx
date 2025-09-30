import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { useFormField } from '../../hooks/useForm';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  prepend?: React.ReactNode;
  append?: React.ReactNode;
  className?: string;
  controlId?: string;
  size?: 'sm' | 'lg';
  as?: 'input' | 'textarea' | 'select';
  rows?: number;
  children?: React.ReactNode; // For select options
  form: any; // Form instance from useForm hook
}

/**
 * Reusable form field component with built-in validation and styling
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  helpText,
  required = false,
  disabled = false,
  readOnly = false,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  prepend,
  append,
  className,
  controlId,
  size,
  as = 'input',
  rows,
  children,
  form,
}) => {
  const field = useFormField(form, name);
  const fieldId = controlId || `form-field-${name}`;

  const renderControl = () => {
    const controlProps = {
      id: fieldId,
      type: as === 'input' ? type : undefined,
      placeholder,
      required,
      disabled,
      readOnly,
      autoComplete,
      maxLength,
      minLength,
      pattern,
      size,
      value: field.value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        field.onChange(e.target.value);
      },
      onBlur: field.onBlur,
      isInvalid: field.hasError,
      'aria-describedby': helpText || field.error ? `${fieldId}-help` : undefined,
    };

    if (as === 'textarea') {
      return (
        <Form.Control
          {...controlProps}
          as="textarea"
          rows={rows || 3}
        />
      );
    }

    if (as === 'select') {
      return (
        <Form.Select {...controlProps}>
          {children}
        </Form.Select>
      );
    }

    if (prepend || append) {
      return (
        <InputGroup hasValidation>
          {prepend && <InputGroup.Text>{prepend}</InputGroup.Text>}
          <Form.Control {...controlProps} />
          {append && <InputGroup.Text>{append}</InputGroup.Text>}
        </InputGroup>
      );
    }

    return <Form.Control {...controlProps} />;
  };

  return (
    <Form.Group className={className} controlId={fieldId}>
      <Form.Label>
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </Form.Label>
      
      {renderControl()}
      
      {field.hasError && (
        <Form.Control.Feedback type="invalid" id={`${fieldId}-error`}>
          {field.error}
        </Form.Control.Feedback>
      )}
      
      {helpText && !field.hasError && (
        <Form.Text id={`${fieldId}-help`} className="text-muted">
          {helpText}
        </Form.Text>
      )}
    </Form.Group>
  );
};

/**
 * Specialized form field for jersey numbers
 */
export const JerseyNumberField: React.FC<Omit<FormFieldProps, 'type' | 'pattern' | 'maxLength'> & {
  usedNumbers?: string[];
}> = ({ usedNumbers = [], ...props }) => {
  return (
    <FormField
      {...props}
      type="text"
      pattern="[0-9]{1,3}"
      maxLength={3}
      placeholder="0-99"
      helpText={
        usedNumbers.length > 0 
          ? `Used numbers: ${usedNumbers.join(', ')}`
          : 'Enter jersey number (0-99)'
      }
    />
  );
};

/**
 * Specialized form field for player names
 */
export const PlayerNameField: React.FC<Omit<FormFieldProps, 'type' | 'pattern' | 'maxLength'>> = (props) => {
  return (
    <FormField
      {...props}
      type="text"
      pattern="[a-zA-Z\s'-.]+"
      maxLength={50}
      placeholder="Enter player name"
      helpText="Letters, spaces, hyphens, apostrophes, and periods only"
    />
  );
};

/**
 * Specialized form field for team names
 */
export const TeamNameField: React.FC<Omit<FormFieldProps, 'type' | 'maxLength'>> = (props) => {
  return (
    <FormField
      {...props}
      type="text"
      maxLength={100}
      placeholder="Enter team name"
      helpText="Team name (max 100 characters)"
    />
  );
};