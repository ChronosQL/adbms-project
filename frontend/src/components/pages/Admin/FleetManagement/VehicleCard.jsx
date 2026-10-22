import React from 'react';
import StatusBadge from './StatusBadge';

const VehicleCard = ({ vehicle, onView, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* Vehicle Image */}
            <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                {vehicle.image_url ? (
                    <img
                        src={vehicle.image_url}
                        alt={vehicle.vehicle_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-6xl">🚗</span>
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <StatusBadge status={vehicle.status} />
                </div>
                <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700">
                        {vehicle.category_name}
                    </span>
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                        {vehicle.vehicle_name}
                    </h3>
                    <span className="text-lg font-bold text-blue-600">
                        USD {vehicle.price_per_day}
                        <span className="text-xs text-gray-500 font-normal">/day</span>
                    </span>
                </div>

                <p className="text-sm text-gray-500 mb-3">
                    {vehicle.brand} {vehicle.model} {vehicle.year && `• ${vehicle.year}`}
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center text-xs text-gray-600">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {vehicle.seats} Seats
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {vehicle.fuel_type}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {vehicle.transmission}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                        <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {vehicle.luggage_capacity} Bags
                    </div>
                </div>

                {/* License Plate */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2">
                    <span>License: <strong>{vehicle.license_plate}</strong></span>
                    {vehicle.air_conditioning && (
                        <span className="flex items-center text-blue-500">
                            ❄️ A/C
                        </span>
                    )}
                </div>

                <div
                    className={`mb-4 text-xs font-semibold rounded-lg px-3 py-2 border ${
                        vehicle.insurance_expired
                            ? 'text-red-700 bg-red-50 border-red-200'
                            : 'text-green-700 bg-green-50 border-green-200'
                    }`}
                >
                    {vehicle.insurance_expired ? 'Insurance Expired' : 'Insurance Valid'}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onView(vehicle)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                        View
                    </button>
                    <button
                        onClick={() => onEdit(vehicle)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(vehicle)}
                        className="bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;