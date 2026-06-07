import React from 'react';

interface TextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  helper?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  helper,
  required = false,
  rows = 4,
  placeholder,
  disabled = false,
}) => {
  const textareaClasses = `block w-full rounded-md border shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm transition-colors ${
    error
      ? 'border-danger focus:border-danger focus:ring-danger'
      : 'border-gray-300 focus:border-primary-500'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <textarea
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={textareaClasses}
      />
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
};

export default Textarea;