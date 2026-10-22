import React from 'react';
import VehicleCard from './CategoryCard';
import EmptyState from './EmptyState';

const VehicleGrid = ({ vehicles, loading, onViewDetails, categoryName }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-2xl shadow-md overflow-hidden">
                        <div className="h-56 bg-gray-200"></div>
                        <div className="p-5 space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (vehicles.length === 0) {
        return <EmptyState categoryName={categoryName} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
                <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onViewDetails={onViewDetails}
                />
            ))}
        </div>
    );
};

export default VehicleGrid;