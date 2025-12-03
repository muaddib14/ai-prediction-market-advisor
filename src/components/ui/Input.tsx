import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {icon}
          </div>
        )}
        <input
          className={`w-full h-12 px-4 py-3 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-tertiary transition-all duration-fast focus:outline-none focus:border-accent-primary focus:shadow-glow-sm ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-error focus:border-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = '',
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder:text-text-tertiary transition-all duration-fast focus:outline-none focus:border-accent-primary focus:shadow-glow-sm resize-none ${
          error ? 'border-error focus:border-error' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
    </div>
  );
}
