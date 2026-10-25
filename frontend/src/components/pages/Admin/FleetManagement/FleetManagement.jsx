// function FleetManagement() {
// 	return <section>Fleet management page</section>;
// }

// export default FleetManagement;


import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import CategoryGrid from './CategoryGrid';
import CategoryForm from './CategoryForm';
import VehicleList from './VehicleList';
import VehicleForm from './VehicleForm';
import VehicleDetailsModal from './VehicleDetailsModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import FleetStats from './FleetStatus';
import { vehicleService, categoryService } from '../../../../services/vehicleService';
import { BRAND, getTheme } from '../AdminDashboard/adminTheme';

const FleetManagement = () => {
    const outletCtx = useOutletContext();
    const dark = outletCtx?.dark ?? false;
    const t = getTheme(dark);

    // State management
    const [categories, setCategories] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState(null);

    // Loading states
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [deletingVehicle, setDeletingVehicle] = useState(null);

    // Toast notification state
    const [toast, setToast] = useState(null);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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
            showToast('Failed to fetch categories', 'error');
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    // Fetch vehicles
    const fetchVehicles = useCallback(async (categoryId = null) => {
        try {
            setVehiclesLoading(true);
            let response;
            if (categoryId) {
                response = await vehicleService.getByCategory(categoryId);
            } else {
                response = await vehicleService.getAll();
            }
            if (response.success) {
                setVehicles(response.data);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            showToast('Failed to fetch vehicles', 'error');
        } finally {
            setVehiclesLoading(false);
        }
    }, []);

    // Fetch stats
    const fetchStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const response = await vehicleService.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // Initial data load
    useEffect(() => {
        fetchCategories();
        fetchVehicles();
        fetchStats();
    }, [fetchCategories, fetchVehicles, fetchStats]);

    // Handle category selection
    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        if (category) {
            fetchVehicles(category.id);
        } else {
            fetchVehicles();
        }
    };

    // Handle add new vehicle
    const handleAddVehicle = () => {
        setEditingVehicle(null);
        setShowForm(true);
    };

    // Handle add new category
    const handleAddCategory = () => {
        setEditingCategory(null);
        setShowCategoryForm(true);
    };

    // Handle edit category
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setShowCategoryForm(true);
    };

    // Handle delete category click
    const handleDeleteCategoryClick = (category) => {
        setDeletingCategory(category);
        setShowCategoryDeleteConfirm(true);
    };

    // Handle edit vehicle
    const handleEditVehicle = (vehicle) => {
        setEditingVehicle(vehicle);
        setShowForm(true);
    };

    // Handle view vehicle details
    const handleViewVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        setShowDetails(true);
    };

    // Handle delete vehicle click
    const handleDeleteClick = (vehicle) => {
        setDeletingVehicle(vehicle);
        setShowDeleteConfirm(true);
    };

    // Handle form submit (create/update)
    const handleFormSubmit = async (formData) => {
        try {
            setFormLoading(true);
            let response;

            if (editingVehicle) {
                response = await vehicleService.update(editingVehicle.id, formData);
                showToast('Vehicle updated successfully!');
            } else {
                response = await vehicleService.create(formData);
                showToast('Vehicle added successfully!');
            }

            if (response.success) {
                setShowForm(false);
                setEditingVehicle(null);
                fetchVehicles(selectedCategory?.id);
                fetchCategories();
                fetchStats();
            }
        } catch (error) {
            console.error('Error saving vehicle:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save vehicle';
            showToast(errorMsg, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    // Handle category form submit (create/update)
    const handleCategorySubmit = async (formData) => {
        try {
            setFormLoading(true);
            let response;

            if (editingCategory) {
                response = await categoryService.update(editingCategory.id, formData);
                showToast('Category updated successfully!');
            } else {
                response = await categoryService.create(formData);
                showToast('Category added successfully!');
            }

            if (response.success) {
                setShowCategoryForm(false);
                setEditingCategory(null);
                fetchCategories();
                fetchVehicles(selectedCategory?.id);
            }
        } catch (error) {
            console.error('Error saving category:', error);
            const errorMsg = error.response?.data?.message || 'Failed to save category';
            showToast(errorMsg, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        try {
            setDeleteLoading(true);
            const response = await vehicleService.delete(deletingVehicle.id);

            if (response.success) {
                showToast('Vehicle deleted successfully!');
                setShowDeleteConfirm(false);
                setDeletingVehicle(null);
                fetchVehicles(selectedCategory?.id);
                fetchCategories();
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            showToast('Failed to delete vehicle', 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Handle category delete confirm
    const handleCategoryDeleteConfirm = async () => {
        try {
            setDeleteLoading(true);
            const response = await categoryService.delete(deletingCategory.id);

            if (response.success) {
                showToast('Category deleted successfully!');
                setShowCategoryDeleteConfirm(false);
                setDeletingCategory(null);

                if (selectedCategory?.id === deletingCategory.id) {
                    setSelectedCategory(null);
                    fetchVehicles();
                } else {
                    fetchVehicles(selectedCategory?.id);
                }

                fetchCategories();
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            const errorMsg = error.response?.data?.message || 'Failed to delete category';
            showToast(errorMsg, 'error');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="min-h-screen transition-colors duration-200" style={{ background: t.pageBg }}>
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-[60] px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all duration-300 ${
                        toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {toast.type === 'error' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {toast.message}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: t.textPrimary, fontFamily: "'Montserrat', sans-serif" }}>
                            Fleet Management
                        </h1>
                        <p className="text-xs md:text-sm font-medium mt-1" style={{ color: t.textSecondary }}>
                            Manage your luxury vehicle fleet, specifications, and category classifications
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleAddCategory}
                            type="button"
                            className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-5 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                            style={{
                                backgroundColor: dark ? '#242838' : '#ffffff',
                                color: t.textPrimary,
                                borderColor: t.cardBorder,
                            }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Category
                        </button>
                        <button
                            onClick={handleAddVehicle}
                            type="button"
                            className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer"
                            style={{ backgroundColor: '#EF8354' }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Vehicle
                        </button>
                    </div>
                </div>

                {/* Fleet Statistics */}
                <FleetStats stats={stats} loading={statsLoading} dark={dark} t={t} />

                {/* Category Grid */}
                <CategoryGrid
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategorySelect={handleCategorySelect}
                    onEditCategory={handleEditCategory}
                    onDeleteCategory={handleDeleteCategoryClick}
                    loading={categoriesLoading}
                    dark={dark}
                    t={t}
                />

                {/* Vehicle List */}
                <VehicleList
                    vehicles={vehicles}
                    loading={vehiclesLoading}
                    selectedCategory={selectedCategory}
                    onView={handleViewVehicle}
                    onEdit={handleEditVehicle}
                    onDelete={handleDeleteClick}
                    dark={dark}
                    t={t}
                />
            </div>

            {/* Vehicle Form Modal */}
            <VehicleForm
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingVehicle(null);
                }}
                onSubmit={handleFormSubmit}
                vehicle={editingVehicle}
                categories={categories}
                loading={formLoading}
            />

            {/* Vehicle Details Modal */}
            <VehicleDetailsModal
                isOpen={showDetails}
                onClose={() => {
                    setShowDetails(false);
                    setSelectedVehicle(null);
                }}
                vehicle={selectedVehicle}
            />

            {/* Category Form Modal */}
            <CategoryForm
                isOpen={showCategoryForm}
                onClose={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                }}
                onSubmit={handleCategorySubmit}
                category={editingCategory}
                loading={formLoading}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeletingVehicle(null);
                }}
                onConfirm={handleDeleteConfirm}
                vehicleName={deletingVehicle?.vehicle_name}
                loading={deleteLoading}
            />

            <DeleteConfirmModal
                isOpen={showCategoryDeleteConfirm}
                onClose={() => {
                    setShowCategoryDeleteConfirm(false);
                    setDeletingCategory(null);
                }}
                onConfirm={handleCategoryDeleteConfirm}
                entityType="Category"
                itemName={deletingCategory?.name}
                loading={deleteLoading}
            />
        </div>
    );
};

export default FleetManagement;