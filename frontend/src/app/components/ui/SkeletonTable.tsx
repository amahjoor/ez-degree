import { HTMLAttributes } from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '@/utils/cn';

interface SkeletonTableProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
}

export function SkeletonTable({
  className,
  rows = 5,
  columns = 4,
  hasHeader = true,
  ...props
}: SkeletonTableProps) {
  return (
    <div className={cn('overflow-hidden', className)} {...props}>
      <div className="w-full border border-gray-200 rounded-lg">
        {hasHeader && (
          <div className="bg-gray-50 p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={`header-${i}`} height="1.5rem" />
              ))}
            </div>
          </div>
        )}
        
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="p-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="1.25rem" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 