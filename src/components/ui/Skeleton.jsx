import React from 'react';

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-white/5 rounded-xl border border-white/5 ${className}`}></div>
);

export const PageSkeleton = () => {
    return (
        <div className="space-y-6 w-full max-w-7xl mx-auto animate-fade-in p-2">
            <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2">
                    <Skeleton className="h-[400px] w-full" />
                </div>
                <div>
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        </div>
    );
};

export default PageSkeleton;
