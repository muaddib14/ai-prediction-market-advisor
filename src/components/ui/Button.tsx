import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-fast ease-out disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-accent-primary text-black hover:brightness-110 hover:shadow-glow',
    secondary: 'border-2 border-accent-primary text-accent-primary bg-transparent hover:bg-accent-primary hover:text-black hover:shadow-glow',
    ghost: 'text-text-secondary bg-transparent hover:bg-bg-hover hover:text-text-primary',
    danger: 'bg-error text-white hover:bg-error-muted',
  };

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm gap-1.5',
    md: 'h-12 px-6 text-base gap-2',
    lg: 'h-14 px-8 text-lg gap-2.5',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      <span>{children}</span>
    </button>
  );
}
