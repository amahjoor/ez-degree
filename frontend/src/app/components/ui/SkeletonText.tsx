import { HTMLAttributes } from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '@/utils/cn';

interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  lines?: number;
  width?: string | number;
  lineHeight?: string | number;
  height?: string | number;
}

export function SkeletonText({
  className,
  lines = 1,
  width = '100%',
  lineHeight = '1rem',
  height,
  ...props
}: SkeletonTextProps) {
  const actualLineHeight = height || lineHeight;
  
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === lines - 1 ? 'max-w-[80%]' : ''}
          height={actualLineHeight}
          width={width}
        />
      ))}
    </div>
  );
} 