import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormField, PlayerNameField, JerseyNumberField, TeamNameField } from '../../../components/ui/FormField';
import { useForm } from '../../../hooks/useForm';

// Mock the useForm hook
jest.mock('../../../hooks/useForm');
const mockUseForm = useForm as jest.MockedFunction<typeof useForm>;

// Create a test wrapper component that uses useForm
const FormFieldTestWrapper: React.FC<{
  formData?: any;
  fieldName?: string;
  children: (form: any) => React.ReactNode;
}> = ({ formData = {}, fieldName = 'testField', children }) => {
  const mockFormInstance = {
    values: formData,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
    handleChange: jest.fn(),
    handleBlur: jest.fn(),
    handleSubmit: jest.fn(),
    reset: jest.fn(),
    setFieldValue: jest.fn(),
    setFieldError: jest.fn(),
    setErrors: jest.fn(),
    validateField: jest.fn(),
    validateForm: jest.fn(),
  };

  return <>{children(mockFormInstance)}</>;
};

// Mock useFormField to return predictable values
const mockUseFormField = (form: any, field: string) => ({
  value: form.values[field] || '',
  error: form.errors[field],
  hasError: !!form.errors[field] && !!form.touched[field],
  onChange: jest.fn(),
  onBlur: jest.fn(),
});

jest.mock('../../../hooks/useForm', () => ({
  useForm: jest.fn(),
  useFormField: jest.fn().mockImplementation(mockUseFormField),
}));

describe('FormField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render basic form field correctly', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Test Field"
            form={form}
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should show required asterisk when required', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Required Field"
            form={form}
            required
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('required');
  });

  it('should show help text when provided', () => {
    const helpText = 'This is helpful information';
    
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Test Field"
            form={form}
            helpText={helpText}
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByText(helpText)).toBeInTheDocument();
  });

  it('should render as textarea when as="textarea"', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Text Area Field"
            form={form}
            as="textarea"
            rows={5}
          />
        )}
      </FormFieldTestWrapper>
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should render as select when as="select"', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Select Field"
            form={form}
            as="select"
          >
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </FormField>
        )}
      </FormFieldTestWrapper>
    );

    const select = screen.getByRole('combobox');
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should render input group with prepend and append', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Input Group Field"
            form={form}
            prepend="$"
            append=".00"
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText('.00')).toBeInTheDocument();
  });

  it('should apply size attribute correctly', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Small Field"
            form={form}
            size="sm"
          />
        )}
      </FormFieldTestWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('form-control-sm');
  });

  it('should handle disabled state', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Disabled Field"
            form={form}
            disabled
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should handle readonly state', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <FormField
            name="testField"
            label="Readonly Field"
            form={form}
            readOnly
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
});

describe('PlayerNameField', () => {
  it('should render with player-specific validation attributes', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <PlayerNameField
            name="playerName"
            label="Player Name"
            form={form}
          />
        )}
      </FormFieldTestWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[a-zA-Z\\s\'-\\.]+');
    expect(input).toHaveAttribute('maxlength', '50');
    expect(input).toHaveAttribute('placeholder', 'Enter player name');
  });

  it('should show player-specific help text', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <PlayerNameField
            name="playerName"
            label="Player Name"
            form={form}
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByText('Letters, spaces, hyphens, apostrophes, and periods only')).toBeInTheDocument();
  });
});

describe('JerseyNumberField', () => {
  it('should render with jersey number validation attributes', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <JerseyNumberField
            name="jerseyNumber"
            label="Jersey Number"
            form={form}
          />
        )}
      </FormFieldTestWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('pattern', '[0-9]{1,3}');
    expect(input).toHaveAttribute('maxlength', '3');
    expect(input).toHaveAttribute('placeholder', '0-99');
  });

  it('should show used numbers in help text', () => {
    const usedNumbers = ['1', '2', '3'];
    
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <JerseyNumberField
            name="jerseyNumber"
            label="Jersey Number"
            form={form}
            usedNumbers={usedNumbers}
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByText('Used numbers: 1, 2, 3')).toBeInTheDocument();
  });

  it('should show default help text when no used numbers', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <JerseyNumberField
            name="jerseyNumber"
            label="Jersey Number"
            form={form}
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByText('Enter jersey number (0-99)')).toBeInTheDocument();
  });
});

describe('TeamNameField', () => {
  it('should render with team name validation attributes', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <TeamNameField
            name="teamName"
            label="Team Name"
            form={form}
          />
        )}
      </FormFieldTestWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxlength', '100');
    expect(input).toHaveAttribute('placeholder', 'Enter team name');
  });

  it('should show team-specific help text', () => {
    render(
      <FormFieldTestWrapper>
        {(form) => (
          <TeamNameField
            name="teamName"
            label="Team Name"
            form={form}
          />
        )}
      </FormFieldTestWrapper>
    );

    expect(screen.getByText('Team name (max 100 characters)')).toBeInTheDocument();
  });
});