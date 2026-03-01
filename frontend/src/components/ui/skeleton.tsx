import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[color:var(--glass-border)]', className)}
      {...props}
    />
  );
}

export { Skeleton };
