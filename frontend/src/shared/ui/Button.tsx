import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/cn';

const variants = {
  primary:   'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
  secondary: 'bg-white text-teal-700 border border-teal-600 hover:bg-teal-50 focus:ring-teal-400',
  danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost:     'bg-transparent text-teal-700 hover:bg-teal-50 focus:ring-teal-400',
};

const sizes = {
  sm:  'px-3 py-1.5 text-sm',
  md:  'px-4 py-2 text-sm',
  lg:  'px-6 py-3 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
