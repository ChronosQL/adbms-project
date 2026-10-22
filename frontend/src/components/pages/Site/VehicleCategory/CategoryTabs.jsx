import React from 'react';
const categoryIcons = {
    'Mini Car': '🚗',
    'Normal Car': '🚙',
    'Sedan Car': '🚘',
    'MPV': '🚐',
    'SUV': '🏎️',
    'Mini Van': '🚌',
    'Van': '🚍',
    'Large Van': '🚛',
};

const CategoryTabs = ({ categories, selectedCategory, onCategorySelect, loading }) => {
    
    if (loading) {
        return (
            <div className="flex gap-3 overflow-x-auto pb-2">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="animate-pulse bg-gray-200 rounded-2xl min-w-[140px] h-32"
                    ></div>
                ))}
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    {"Browse by Category"}
                </h2>
                <p className="text-sm text-gray-500 hidden md:block">
                    {"Click any category to see vehicles"}
                </p>
            </div>

            {/* Categories - Scrollable on mobile, grid on desktop */}
            <div className="flex gap-3 overflow-x-auto pb-3 md:grid md:grid-cols-4 lg:grid-cols-9 md:overflow-visible">
                {/* All Vehicles Tab */}
                <button
                    onClick={() => onCategorySelect(null)}
                    className="flex-shrink-0 min-w-[140px] md:min-w-0 rounded-2xl p-4 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md"
                    style={!selectedCategory 
                        ? { background: 'linear-gradient(to bottom right, #3b82f6, #1e3a8a)', color: '#ffffff', border: '2px solid transparent', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', transform: 'scale(1.05)' }
                        : { backgroundColor: '#ffffff', color: '#374151', border: '2px solid #d1d5db' }
                    }
                >
                    <div className="flex flex-col items-center text-center">
                        <span className="text-4xl mb-2">📋</span>
                        <h3 className="font-bold text-sm">{"All"}</h3>
                        <p className={`text-xs mt-1 ${!selectedCategory ? 'text-blue-100' : 'text-gray-500'}`}>
                            {"View All"}
                        </p>
                    </div>
                </button>

                {categories.map((category) => {
                    const isSelected = selectedCategory?.id === category.id;
                    const icon = categoryIcons[category.name] || '🚗';
                    const vehicleCount = category.vehicle_count || 0;
                    
                    let firstImage = null;
                    if (Array.isArray(category.images) && category.images.length > 0) {
                        firstImage = category.images[0];
                    } else if (category.image_url) {
                        try {
                            const parsed = JSON.parse(category.image_url);
                            if (Array.isArray(parsed) && parsed.length > 0) firstImage = parsed[0];
                            else firstImage = category.image_url;
                        } catch {
                            firstImage = category.image_url;
                        }
                    }
                    const hasImage = Boolean(firstImage);

                    return (
                        <button
                            key={category.id}
                            onClick={() => onCategorySelect(category)}
                            type="button"
                            className={`flex-shrink-0 min-w-[140px] md:min-w-0 rounded-2xl p-4 transition-all duration-300 transform hover:-translate-y-1 border-2 ${
                                isSelected
                                    ? 'text-white shadow-xl scale-105'
                                    : 'text-gray-700 hover:shadow-md'
                            }`}
                            style={isSelected ? { background: 'linear-gradient(to bottom right, #3b82f6, #1e3a8a)' } : { backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2 h-16 w-16 overflow-hidden rounded-xl border border-white/30 bg-white/20 shadow-sm flex items-center justify-center">
                                    {hasImage ? (
                                        <img
                                            src={firstImage}
                                            alt={category.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl">{icon}</span>
                                    )}
                                </div>
                                <h3 className="font-bold text-sm">{category.name}</h3>
                                <p className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                    <span className="font-bold">{vehicleCount}</span>{' '}
                                    {vehicleCount === 1 ? 'vehicle' : 'vehicles'}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryTabs;