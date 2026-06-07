import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  className = '',
  required = false,
  disabled = false,
  ...rest
}) => {
  const inputClasses = `block w-full px-3 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm transition-colors ${
    error
      ? 'border-danger focus:border-danger focus:ring-danger'
      : 'border-gray-300 focus:border-primary-500'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`;

  return (
    <div>
      <label htmlFor={rest.id || rest.name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <input
        required={required}
        disabled={disabled}
        className={inputClasses}
        {...rest}
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

export default Input;