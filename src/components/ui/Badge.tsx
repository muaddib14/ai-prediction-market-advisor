import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'accent' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  const variantClasses = {
    success: 'bg-success/20 text-success',
    error: 'bg-error/20 text-error',
    warning: 'bg-warning/20 text-warning',
    info: 'bg-info/20 text-info',
    accent: 'bg-accent-subtle text-accent-primary',
    neutral: 'bg-bg-hover text-text-secondary',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success' ? 'bg-success' :
            variant === 'error' ? 'bg-error' :
            variant === 'warning' ? 'bg-warning' :
            variant === 'info' ? 'bg-info' :
            variant === 'accent' ? 'bg-accent-primary' :
            'bg-text-secondary'
          }`}
        />
      )}
      {children}
    </span>
  );
}
