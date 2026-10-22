import React from 'react';
import { Search, FilterX } from 'lucide-react';

const VehicleFilters = ({ filters, onFilterChange, totalCount, filterOptions }) => {
    const handleChange = (key, value) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handleReset = () => {
        onFilterChange({
            search: '',
            passenger_capacity: '',
            luggage_capacity: '',
            trip_type: '',
            comfort_level: '',
            sortBy: 'default',
        });
    };

    const hasActiveFilters =
        filters.search || filters.passenger_capacity || filters.luggage_capacity || filters.trip_type || filters.comfort_level || filters.sortBy !== 'default';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-2">
            <div className="flex flex-col lg:flex-row items-center gap-2">
                
                {/* Search Bar - Takes up remaining space */}
                <div className="relative w-full lg:flex-1">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search categories, trip types..."
                        value={filters.search || ''}
                        onChange={(e) => handleChange('search', e.target.value)}
                        className="h-12 w-full rounded-xl border border-gray-100 pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 hover:bg-gray-100 transition-colors outline-none"
                    />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap md:flex-nowrap w-full lg:w-auto gap-2">
                    {/* Passenger Capacity */}
                    <select
                        value={filters.passenger_capacity || ''}
                        onChange={(e) => handleChange('passenger_capacity', e.target.value)}
                        className="h-12 flex-1 md:w-36 rounded-xl border border-gray-100 px-3 text-sm text-gray-600 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none"
                    >
                        <option value="">Any Capacity</option>
                        {filterOptions?.passenger_capacities?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>

                    {/* Luggage Capacity */}
                    <select
                        value={filters.luggage_capacity || ''}
                        onChange={(e) => handleChange('luggage_capacity', e.target.value)}
                        className="h-12 flex-1 md:w-36 rounded-xl border border-gray-100 px-3 text-sm text-gray-600 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none"
                    >
                        <option value="">Any Luggage</option>
                        {filterOptions?.luggage_capacities?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>

                    {/* Trip Type */}
                    <select
                        value={filters.trip_type || ''}
                        onChange={(e) => handleChange('trip_type', e.target.value)}
                        className="h-12 flex-1 md:w-40 rounded-xl border border-gray-100 px-3 text-sm text-gray-600 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none"
                    >
                        <option value="">Any Trip Type</option>
                        {filterOptions?.trip_types?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>

                    {/* Comfort Level */}
                    <select
                        value={filters.comfort_level || ''}
                        onChange={(e) => handleChange('comfort_level', e.target.value)}
                        className="h-12 flex-1 md:w-40 rounded-xl border border-gray-100 px-3 text-sm text-gray-600 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none"
                    >
                        <option value="">Any Comfort</option>
                        {filterOptions?.comfort_levels?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>

                    {/* Sort By */}
                    <select
                        value={filters.sortBy || 'default'}
                        onChange={(e) => handleChange('sortBy', e.target.value)}
                        className="h-12 flex-1 md:w-32 rounded-xl border border-blue-100 px-3 text-sm text-blue-700 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer outline-none"
                    >
                        <option value="default">Sort By</option>
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="name_desc">Name (Z-A)</option>
                    </select>

                    {/* Reset Button */}
                    {hasActiveFilters && (
                        <button
                            onClick={handleReset}
                            title="Reset Filters"
                            className="h-12 w-12 flex items-center justify-center shrink-0 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100"
                        >
                            <FilterX size={20} />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Results count */}
            <div className="px-4 pt-2 pb-1 text-xs text-gray-400 font-medium flex justify-between">
                <span>Showing {totalCount} categories</span>
            </div>
        </div>
    );
};

export default VehicleFilters;