import React, { useState, useEffect } from 'react';
import VehicleCard from './VehicleCard';
import Pagination from '../../../common/Pagination';

const VehicleList = ({ vehicles, loading, onView, onEdit, onDelete, selectedCategory }) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(8);

    useEffect(() => {
        setPage(1);
    }, [selectedCategory]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="h-48 bg-gray-200"></div>
                        <div className="p-4 space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="h-4 bg-gray-200 rounded"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-9 bg-gray-200 rounded flex-1"></div>
                                <div className="h-9 bg-gray-200 rounded flex-1"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (vehicles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <span className="text-6xl mb-4">🚗</span>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No Vehicles Found
                </h3>
                <p className="text-gray-400 text-sm">
                    {selectedCategory
                        ? `No vehicles in the "${selectedCategory.name}" category yet.`
                        : 'No vehicles have been added yet.'}
                </p>
            </div>
        );
    }

    const totalPages = Math.ceil(vehicles.length / limit) || 1;
    const currentPage = Math.min(page, totalPages);
    const paginatedVehicles = vehicles.slice((currentPage - 1) * limit, currentPage * limit);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                    {selectedCategory ? `${selectedCategory.name} Vehicles` : 'All Vehicles'}
                    <span className="text-sm font-normal text-gray-400 ml-2">
                        ({vehicles.length} vehicles)
                    </span>
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedVehicles.map((vehicle) => (
                    <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
            {vehicles.length > limit && (
                <div className="mt-8">
                    <Pagination
                        pagination={{
                            page: currentPage,
                            totalPages,
                            total: vehicles.length,
                            limit,
                        }}
                        onPageChange={setPage}
                        onLimitChange={(newLimit) => {
                            setLimit(newLimit);
                            setPage(1);
                        }}
                        limitOptions={[8, 16, 24]}
                        itemLabel="vehicles"
                        scrollToRef={false}
                    />
                </div>
            )}
        </div>
    );
};

export default VehicleList;