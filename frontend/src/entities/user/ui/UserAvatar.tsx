import { cn } from '../../../shared/lib/cn';

interface UserAvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };

export function UserAvatar({ name, src, size = 'md', className }: UserAvatarProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'User'}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div className={cn('flex items-center justify-center rounded-full bg-teal-600 font-semibold text-white', sizes[size], className)}>
      {initials}
    </div>
  );
}
