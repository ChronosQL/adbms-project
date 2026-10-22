import React, { useState, useEffect } from 'react';
const VehicleCard = ({ vehicle, onViewDetails }) => {
    
    const [currentImageIdx, setCurrentImageIdx] = useState(0);
    const images = vehicle?.images && vehicle.images.length > 0 ? vehicle.images : (vehicle?.image_url ? [vehicle.image_url] : []);

    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentImageIdx((prev) => (prev + 1) % images.length);
        }, 3500); // slightly different delay than modal
        return () => clearInterval(timer);
    }, [images.length]);

    const isLargeVanOrVan = ['van', 'large van'].includes(vehicle?.category_name?.toLowerCase());

    return (
        <div
            className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-1 cursor-pointer"
            onClick={() => onViewDetails(vehicle)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewDetails(vehicle);
                }
            }}
        >
            {/* Image Section */}
            <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {images.length > 0 ? (
                    <img
                        src={images[currentImageIdx]}
                        alt={vehicle.vehicle_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-7xl">🚗</span>
                    </div>
                )}
                
                {images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {images.map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${currentImageIdx === idx ? 'bg-white scale-125' : 'bg-white/50'}`} />
                        ))}
                    </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 right-3">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-full text-gray-700 shadow-md">
                        {vehicle.category_name}
                    </span>
                </div>

                {/* Price Tag */}
                <div className="absolute bottom-3 right-3 bg-white rounded-xl px-4 py-2 shadow-lg">
                    <p className="text-xs text-gray-500">{"Starting at"}</p>
                    <p className="text-xl font-bold text-blue-600">
                        USD {vehicle.price_per_day}
                        <span className="text-xs text-gray-500 font-normal">{"/day"}</span>
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Title */}
                <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-800 mb-1 line-clamp-1">
                        {vehicle.vehicle_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {vehicle.brand} {vehicle.model} {vehicle.year && `• ${vehicle.year}`}
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-lg">👥</span>
                        <span>{vehicle.seats} Seats</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-lg">⛽</span>
                        <span>{vehicle.fuel_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-lg">⚙️</span>
                        <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-lg">🧳</span>
                        <span>{vehicle.luggage_capacity} Bags</span>
                    </div>
                </div>

                {/* Quick Features */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {vehicle.air_conditioning && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                            ❄️ A/C
                        </span>
                    )}
                    {vehicle.mileage && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200">
                            ⚡ {vehicle.mileage}
                        </span>
                    )}
                    {vehicle.color && (
                        <span className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-full border border-gray-200">
                            🎨 {vehicle.color}
                        </span>
                    )}
                </div>

                {/* Mileage Policy */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800 mb-0.5">Package & Custom Tours Pricing</p>
                    <p>Includes <span className="font-bold">{isLargeVanOrVan ? 125 : 150} km</span> per day. Additional mileage is charged at <span className="font-bold">$0.5/km</span>.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(vehicle);
                        }}
                        className="flex-1 font-medium py-2.5 rounded-lg transition-colors text-sm hover:shadow-md"
                        style={{ backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db' }}
                    >
                        {"View Details"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;