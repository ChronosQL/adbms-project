import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Snowflake, Star, Map } from 'lucide-react';

const categoryDescriptions = {
    'Mini Car': {
        icon: '🚗',
        description: 'Perfect for city driving and tight parking spaces. Fuel-efficient and easy to maneuver.',
        bestFor: 'Solo travelers, couples, city tours',
    },
    'Normal Car': {
        icon: '🚙',
        description: 'Reliable and comfortable cars perfect for everyday use and small group travel.',
        bestFor: 'Small families, business trips',
    },
    'Sedan Car': {
        icon: '🚘',
        description: 'Premium comfort with spacious interiors and elegant design for executive travel.',
        bestFor: 'Business meetings, airport transfers',
    },
    'MPV': {
        icon: '🚐',
        description: 'Multi-Purpose Vehicles offering versatility, space, and comfort for groups.',
        bestFor: 'Family trips, group tours',
    },
    'SUV': {
        icon: '🏎️',
        description: 'Powerful and rugged vehicles ideal for adventure trips and off-road exploration.',
        bestFor: 'Adventure trips, hill stations',
    },
    'Mini Van': {
        icon: '🚌',
        description: 'Compact vans perfect for small groups needing extra space and comfort.',
        bestFor: 'Small group tours, family vacations',
    },
    'Van': {
        icon: '🚍',
        description: 'Spacious vans ideal for medium-sized groups and luggage-heavy trips.',
        bestFor: 'Group tours, wedding parties',
    },
    'Large Van': {
        icon: '🚛',
        description: 'Maximum capacity vans for large groups and extensive cargo transportation.',
        bestFor: 'Large groups, corporate events',
    },
};

const CategoryShowcase = ({ category, vehicles = [] }) => {
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Parse images - Prefer images from actual vehicles in this category
    const images = React.useMemo(() => {
        if (!category) return [];
        let vehicleImages = [];
        
        // 1. Extract the primary image from each vehicle
        if (vehicles && vehicles.length > 0) {
            vehicles.forEach(vehicle => {
                let vImg = null;
                if (Array.isArray(vehicle.images) && vehicle.images.length > 0) {
                    vImg = vehicle.images[0];
                } else if (vehicle.image_url) {
                    try {
                        const parsed = JSON.parse(vehicle.image_url);
                        if (Array.isArray(parsed) && parsed.length > 0) vImg = parsed[0];
                        else vImg = vehicle.image_url;
                    } catch {
                        vImg = vehicle.image_url;
                    }
                }
                if (vImg) vehicleImages.push(vImg);
            });
        }
        
        // If we found vehicle images, use them for the slideshow
        if (vehicleImages.length > 0) {
            return vehicleImages;
        }

        // 2. Fallback to category's own images if no vehicles exist
        if (Array.isArray(category.images) && category.images.length > 0) {
            return category.images;
        } else if (category.image_url) {
            try {
                const parsed = JSON.parse(category.image_url);
                if (Array.isArray(parsed)) return parsed;
                return [category.image_url];
            } catch {
                return [category.image_url];
            }
        }
        return [];
    }, [category, vehicles]);

    // Handle automatic slideshow with delay
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentImageIndex(0);

        if (images.length > 1) {
            const timer = setInterval(() => {
                setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }, 4000); // 4 seconds delay to allow for the smooth 1-second transition
            return () => clearInterval(timer);
        }
    }, [images]);

    if (!category) return null;

    const info = categoryDescriptions[category.name] || {
        icon: '🚗',
        description: category.description || "Quality vehicles for your journey.",
        bestFor: category.best_for || "All travelers",
    };
    const translatedDesc = category.description || info.description;
    const translatedBestFor = category.best_for || info.bestFor;

    return (
        <div className="bg-white rounded-2xl p-6 md:p-8 mb-8 border border-gray-100 shadow-xl relative overflow-hidden group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-50 opacity-50 blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                {/* Image Section */}
                <div className="lg:w-2/5 flex-shrink-0">
                    <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        {images.length > 0 ? (
                            images.map((imgUrl, idx) => (
                                <img
                                    key={idx}
                                    src={imgUrl}
                                    alt={`${category.name} view ${idx + 1}`}
                                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out transform origin-center ${
                                        currentImageIndex === idx ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
                                    }`}
                                />
                            ))
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                                <div className="text-8xl opacity-80">{info.icon}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Section */}
                <div className="lg:w-3/5 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            {category.name}
                        </h2>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-green-200">
                            🚗 {category.vehicle_count || 0} Available
                        </span>
                    </div>
                    
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                        {translatedDesc}
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        {category.passenger_capacity && (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Capacity</p>
                                    <p className="text-sm font-semibold text-gray-800">{category.passenger_capacity}</p>
                                </div>
                            </div>
                        )}
                        
                        {category.luggage_capacity && (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                                    <Briefcase size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Luggage</p>
                                    <p className="text-sm font-semibold text-gray-800">{category.luggage_capacity}</p>
                                </div>
                            </div>
                        )}

                        {category.comfort_level && (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                                    <Star size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Comfort</p>
                                    <p className="text-sm font-semibold text-gray-800">{category.comfort_level}</p>
                                </div>
                            </div>
                        )}

                        {category.ac_available !== undefined && category.ac_available !== null && (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="bg-cyan-100 text-cyan-600 p-2 rounded-lg">
                                    <Snowflake size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Air Con</p>
                                    <p className="text-sm font-semibold text-gray-800">{category.ac_available ? 'Available' : 'Non-AC'}</p>
                                </div>
                            </div>
                        )}

                        {category.ideal_trip_types && (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 md:col-span-2">
                                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg shrink-0">
                                    <Map size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-500 font-medium">Ideal For Trips</p>
                                    <p className="text-sm font-semibold text-gray-800 truncate" title={category.ideal_trip_types}>{category.ideal_trip_types}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto">
                        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-indigo-700">
                            <span className="font-semibold text-sm">Best for:</span>
                            <span className="text-sm">{translatedBestFor}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryShowcase;