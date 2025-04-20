import { HTMLAttributes } from 'react';
import { Skeleton } from './Skeleton';
import { SkeletonText } from './SkeletonText';
import { cn } from '@/utils/cn';

interface SkeletonCardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasImage?: boolean;
  imageHeight?: string | number;
  contentLines?: number;
}

export function SkeletonCard({
  className,
  hasHeader = true,
  hasFooter = false,
  hasImage = false,
  imageHeight = '12rem',
  contentLines = 3,
  ...props
}: SkeletonCardProps) {
  return (
    <div 
      className={cn(
        'rounded-lg border border-gray-200 p-4 shadow-sm overflow-hidden', 
        className
      )} 
      {...props}
    >
      {hasImage && (
        <Skeleton 
          className="mb-4 w-full" 
          height={imageHeight}
          rounded="rounded-md"
        />
      )}
      
      {hasHeader && (
        <div className="mb-4">
          <Skeleton className="mb-2" height="1.5rem" width="60%" />
          <Skeleton height="1rem" width="40%" />
        </div>
      )}
      
      <div className="mb-4">
        <SkeletonText lines={contentLines} lineHeight="1rem" />
      </div>
      
      {hasFooter && (
        <div className="flex items-center justify-between mt-4">
          <Skeleton height="2rem" width="40%" />
          <Skeleton height="2rem" width="20%" />
        </div>
      )}
    </div>
  );
} 