import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CategoryHero from './CategoryHero';
import CategoryTabs from './CategoryTabs';
import VehicleGrid from './VehicleGrid';
import VehicleDetailsModal from './VehicleDetailsModal';
import { categoryService, vehicleService } from '../../../../services/vehicleService';
import Pagination from '../../../common/Pagination';

const OurFleet = () => {
    // State
    const [categories, setCategories] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(6);
    // Loading states
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            setCategoriesLoading(true);
            const response = await categoryService.getAll();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    // Fetch vehicles
    const fetchVehicles = useCallback(async () => {
        try {
            setVehiclesLoading(true);
            const response = await vehicleService.getAll();
            if (response.success) {
                setVehicles(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setVehiclesLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchCategories();
        fetchVehicles();
    }, [fetchCategories, fetchVehicles]);



    const filteredVehicles = useMemo(() => {
        if (!selectedCategory) {
            return vehicles;
        }

        return vehicles.filter((vehicle) => String(vehicle.category_id) === String(selectedCategory.id));
    }, [vehicles, selectedCategory]);

    const totalPages = Math.ceil(filteredVehicles.length / limit) || 1;
    const currentPage = Math.min(page, totalPages);
    const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * limit, currentPage * limit);

    const selectedCategoryName = selectedCategory?.name || 'All categories';

    const handleViewDetails = useCallback((vehicle) => {
        setSelectedVehicle(vehicle);
    }, []);

    const handleCloseDetails = useCallback(() => {
        setSelectedVehicle(null);
    }, []);

    const handleCategorySelect = useCallback((category) => {
        setSelectedCategory(category);
        setPage(1);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Hero Section */}
            <CategoryHero />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Category selector */}
                <div className="mb-8">
                    <CategoryTabs
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onCategorySelect={handleCategorySelect}
                        loading={categoriesLoading}
                    />
                </div>

                <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                            {selectedCategory ? selectedCategory.name : 'All Vehicles'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {selectedCategory
                                ? `Showing vehicles related to ${selectedCategory.name}.`
                                : 'Browse all available vehicles, then click a category to filter the list.'}
                        </p>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        {filteredVehicles.length} vehicle{filteredVehicles.length === 1 ? '' : 's'} shown
                    </div>
                </div>

                <VehicleGrid
                    vehicles={paginatedVehicles}
                    loading={vehiclesLoading || categoriesLoading}
                    onViewDetails={handleViewDetails}
                    categoryName={selectedCategoryName}
                />

                {filteredVehicles.length > limit && (
                    <div className="mt-8">
                        <Pagination
                            pagination={{
                                page: currentPage,
                                totalPages,
                                total: filteredVehicles.length,
                                limit,
                            }}
                            onPageChange={setPage}
                            onLimitChange={(newLimit) => {
                                setLimit(newLimit);
                                setPage(1);
                            }}
                            limitOptions={[6, 12, 24]}
                            itemLabel="vehicles"
                        />
                    </div>
                )}

                <VehicleDetailsModal
                    isOpen={Boolean(selectedVehicle)}
                    onClose={handleCloseDetails}
                    vehicle={selectedVehicle}
                />


            </div>


        </div>
    );
};

export default OurFleet;