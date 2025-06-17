import { SkeletonCard } from './SkeletonCard';

export function SkeletonGraph() {
  return (
    <div className="h-[calc(100vh-280px)] bg-white border rounded-md shadow-lg p-8">
      <div className="w-full h-full bg-gray-50 rounded-md p-6">
        {/* Simple 4x5 grid of skeleton cards */}
        <div className="grid grid-cols-5 gap-6 w-full h-full place-items-center">
          {Array.from({ length: 20 }, (_, index) => (
            <SkeletonCard 
              key={index}
              hasHeader={false} 
              hasImage={false} 
              contentLines={2} 
              className="w-32 h-20" 
            />
          ))}
        </div>
      </div>
    </div>
  );
} 