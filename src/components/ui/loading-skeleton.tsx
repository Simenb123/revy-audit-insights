import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
  height?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 10,
  columns = 5,
  height = "h-4",
  className = ""
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header skeleton */}
      <div className="flex space-x-4 p-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className={`${height} flex-1`} />
        ))}
      </div>
      
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className={`${height} flex-1`} />
          ))}
        </div>
      ))}
    </div>
  );
};

export const TableLoadingSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 10, 
  columns = 5 
}) => {
  return (
    <div className="w-full">
      <div className="rounded-md border">
        <div className="border-b">
          <div className="flex items-center space-x-4 p-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        <div className="space-y-1">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border-b last:border-b-0">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};