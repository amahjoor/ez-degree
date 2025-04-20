import { HTMLAttributes } from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '@/utils/cn';

interface SkeletonListProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  items?: number;
  hasImage?: boolean;
  itemHeight?: string | number;
  imageSize?: string | number;
}

export function SkeletonList({
  className,
  items = 5,
  hasImage = false,
  itemHeight = '3rem',
  imageSize = '2.5rem',
  ...props
}: SkeletonListProps) {
  return (
    <div 
      className={cn('space-y-3', className)} 
      {...props}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center space-x-4 py-2"
          style={{ minHeight: itemHeight }}
        >
          {hasImage && (
            <Skeleton 
              width={imageSize} 
              height={imageSize} 
              rounded="rounded-full" 
            />
          )}
          
          <div className="flex-1 space-y-2">
            <Skeleton height="1rem" width="60%" />
            <Skeleton height="0.75rem" width="40%" />
          </div>
          
          <Skeleton height="1.5rem" width="3rem" />
        </div>
      ))}
    </div>
  );
} 