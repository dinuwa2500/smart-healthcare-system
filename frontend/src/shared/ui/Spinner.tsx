import { cn } from '../lib/cn';

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string; }

const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-teal-600 border-t-transparent',
        sizes[size],
        className
      )}
    />
  );
}
