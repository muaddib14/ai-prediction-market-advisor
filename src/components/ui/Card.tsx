import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = true, onClick }: CardProps) {
  return (
    <div
      className={`bg-bg-elevated p-6 rounded-xl border border-border-subtle shadow-card transition-all duration-normal ${
        hover ? 'hover:bg-bg-hover hover:border-border-default hover:-translate-y-0.5' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  accentColor?: 'success' | 'error' | 'warning' | 'accent';
}

export function StatCard({ label, value, change, prefix, suffix, icon, accentColor }: StatCardProps) {
  const colorClasses = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    accent: 'text-accent-primary',
  };

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-text-secondary">{label}</span>
        {icon && (
          <span className={`${accentColor ? colorClasses[accentColor] : 'text-text-tertiary'}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        {prefix && <span className="text-lg text-text-secondary">{prefix}</span>}
        <span className={`font-mono text-3xl font-semibold ${accentColor ? colorClasses[accentColor] : 'text-text-primary'}`}>
          {value}
        </span>
        {suffix && <span className="text-lg text-text-secondary">{suffix}</span>}
      </div>
      {change !== undefined && (
        <div className={`mt-2 text-sm ${change >= 0 ? 'text-success' : 'text-error'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      )}
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, action, className = '' }: ChartCardProps) {
  return (
    <Card hover={false} className={`chart-container ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h4 text-text-primary">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}
