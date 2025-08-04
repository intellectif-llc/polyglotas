import React from 'react';

interface NavigationSkeletonProps {
  isCollapsed: boolean;
  count?: number;
}

const NavigationSkeleton: React.FC<NavigationSkeletonProps> = ({ 
  isCollapsed, 
  count = 3 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={`skeleton-${index}`}
          className="flex items-center p-2 animate-pulse"
        >
          <div className={`bg-gray-300 dark:bg-gray-600 rounded ${
            isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'
          }`} />
          {!isCollapsed && (
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded flex-1" />
          )}
        </div>
      ))}
    </>
  );
};

export default NavigationSkeleton;