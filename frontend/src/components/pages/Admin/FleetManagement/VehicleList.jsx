import React, { useState, useEffect } from 'react';
import { CarFront } from 'lucide-react';
import VehicleCard from './VehicleCard';
import Pagination from '../../../common/Pagination';
import { BRAND } from '../AdminDashboard/adminTheme';

const VehicleList = ({ vehicles, loading, onView, onEdit, onDelete, selectedCategory, dark = false, t }) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(8);

    const cardBg = t ? t.cardBg : (dark ? "#383C4E" : "#FFFFFF");
    const cardBorder = t ? t.cardBorder : (dark ? "rgba(255,255,255,0.08)" : "#E8E8EA");
    const textPrimary = t ? t.textPrimary : (dark ? "#FFFFFF" : BRAND.gunmetal);
    const textSecondary = t ? t.textSecondary : (dark ? "#B7BAC7" : BRAND.payneGray);

    useEffect(() => {
        setPage(1);
    }, [selectedCategory]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="animate-pulse rounded-2xl shadow-xs overflow-hidden"
                        style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                    >
                        <div className="h-48" style={{ background: dark ? "rgba(255,255,255,0.04)" : "#E5E7EB" }}></div>
                        <div className="p-4 space-y-3">
                            <div className="h-5 rounded w-3/4" style={{ background: dark ? "rgba(255,255,255,0.04)" : "#E5E7EB" }}></div>
                            <div className="h-4 rounded w-1/2" style={{ background: dark ? "rgba(255,255,255,0.04)" : "#E5E7EB" }}></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="h-4 rounded" style={{ background: dark ? "rgba(255,255,255,0.04)" : "#E5E7EB" }}></div>
                                <div className="h-4 rounded" style={{ background: dark ? "rgba(255,255,255,0.04)" : "#E5E7EB" }}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (vehicles.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed transition-colors"
                style={{ background: cardBg, borderColor: cardBorder }}
            >
                <CarFront size={48} style={{ color: BRAND.coral, marginBottom: 12 }} />
                <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}
                >
                    No Vehicles Found
                </h3>
                <p className="text-xs" style={{ color: textSecondary }}>
                    {selectedCategory
                        ? `No vehicles found in the "${selectedCategory.name}" category yet.`
                        : 'No vehicles have been added to the fleet yet.'}
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
                <h2
                    className="text-base font-bold"
                    style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}
                >
                    {selectedCategory ? `${selectedCategory.name} Vehicles` : 'All Vehicles'}
                    <span className="text-xs font-medium ml-2" style={{ color: textSecondary }}>
                        ({vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'})
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
                        dark={dark}
                        t={t}
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