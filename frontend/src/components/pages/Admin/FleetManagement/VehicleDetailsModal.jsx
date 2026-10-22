import React, { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';

const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const VehicleDetailsModal = ({ isOpen, onClose, vehicle }) => {
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    const images = vehicle?.images && vehicle.images.length > 0 ? vehicle.images : (vehicle?.image_url ? [vehicle.image_url] : []);

    useEffect(() => {
        setCurrentImageIdx(0);
    }, [vehicle]);

    useEffect(() => {
        if (!isOpen || images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentImageIdx((prev) => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [isOpen, images.length]);

    if (!isOpen || !vehicle) return null;

    const features = vehicle.features
        ? vehicle.features.split(',').map((f) => f.trim()).filter(Boolean)
        : [];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header with Image */}
                <div className="relative h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-2xl overflow-hidden group">
                    {images.length > 0 ? (
                        <img
                            src={images[currentImageIdx]}
                            alt={vehicle.vehicle_name}
                            className="w-full h-full object-cover rounded-t-2xl transition-opacity duration-500"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-8xl">🚗</span>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="absolute bottom-4 left-4">
                        <StatusBadge status={vehicle.status} />
                    </div>
                    <div className="absolute bottom-4 right-4">
                        <span className="bg-white/90 backdrop-blur-sm text-sm font-medium px-3 py-1 rounded-full text-gray-700">
                            {vehicle.category_name}
                        </span>
                    </div>
                    {images.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentImageIdx((prev) => (prev + 1) % images.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {images.map((_, idx) => (
                                    <button key={idx} onClick={() => setCurrentImageIdx(idx)} className={`w-2 h-2 rounded-full transition-colors ${currentImageIdx === idx ? 'bg-white' : 'bg-white/50'}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Details */}
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                {vehicle.vehicle_name}
                            </h2>
                            <p className="text-gray-500">
                                {vehicle.brand} {vehicle.model} {vehicle.year && `• ${vehicle.year}`}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-blue-600">
                                USD {vehicle.price_per_day}
                            </span>
                            <p className="text-xs text-gray-500">per day</p>
                        </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <div className="text-2xl mb-1">💺</div>
                            <p className="text-xs text-gray-500">Seats</p>
                            <p className="font-semibold text-gray-800">{vehicle.seats}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <div className="text-2xl mb-1">⛽</div>
                            <p className="text-xs text-gray-500">Fuel</p>
                            <p className="font-semibold text-gray-800">{vehicle.fuel_type}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <div className="text-2xl mb-1">⚙️</div>
                            <p className="text-xs text-gray-500">Transmission</p>
                            <p className="font-semibold text-gray-800">{vehicle.transmission}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <div className="text-2xl mb-1">🧳</div>
                            <p className="text-xs text-gray-500">Luggage</p>
                            <p className="font-semibold text-gray-800">{vehicle.luggage_capacity} Bags</p>
                        </div>
                    </div>

                    {/* Details Table */}
                    <div className="space-y-3 mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Vehicle Details
                        </h3>
                        <div className="bg-gray-50 rounded-xl divide-y divide-gray-200">
                            {[
                                { label: 'License Plate', value: vehicle.license_plate },
                                { label: 'Vehicle License', value: vehicle.vehicle_license || 'N/A' },
                                { label: 'Color', value: vehicle.color || 'N/A' },
                                { label: 'Model', value: vehicle.model || 'N/A' },
                                { label: 'Fuel Type', value: vehicle.fuel_type || 'N/A' },
                                { label: 'Insurance', value: vehicle.insurance_provider || 'N/A' },
                                { label: 'Insurance Start', value: formatDate(vehicle.insurance_start_date) },
                                { label: 'Insurance End', value: formatDate(vehicle.insurance_end_date) },
                                { label: 'Insurance Status', value: vehicle.insurance_expired ? 'Expired' : 'Valid' },
                                { label: 'Air Conditioning', value: vehicle.air_conditioning ? 'Yes ❄️' : 'No' },
                            ].map((item, index) => (
                                <div key={index} className="flex justify-between items-center px-4 py-3">
                                    <span className="text-sm text-gray-500">{item.label}</span>
                                    <span className="text-sm font-medium text-gray-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    {features.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Features
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {features.map((feature, index) => (
                                    <span
                                        key={index}
                                        className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-200"
                                    >
                                        ✓ {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Close Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleDetailsModal;