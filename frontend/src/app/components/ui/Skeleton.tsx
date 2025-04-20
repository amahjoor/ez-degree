import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export function Skeleton({
  className,
  width,
  height,
  rounded = 'rounded-md',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        rounded,
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    />
  );
} 