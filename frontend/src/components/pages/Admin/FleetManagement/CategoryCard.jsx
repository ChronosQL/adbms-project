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

const CategoryCard = ({ category, isSelected, onClick, onEdit, onDelete }) => {
    const icon = categoryIcons[category.name] || '🚗';
    const hasImage = Boolean(category.image_url);

    const handleEdit = (event) => {
        event.stopPropagation();
        onEdit?.(category);
    };

    const handleDelete = (event) => {
        event.stopPropagation();
        onDelete?.(category);
    };

    return (
        <div
            onClick={() => onClick(category)}
            className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 relative group ${
                isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
        >
            {(onEdit || onDelete) && (
                <div className="absolute right-2 top-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="rounded-full bg-white/95 p-2 text-blue-600 shadow-sm ring-1 ring-blue-100 hover:bg-blue-50"
                            aria-label={`Edit ${category.name}`}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.586a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-full bg-white/95 p-2 text-red-600 shadow-sm ring-1 ring-red-100 hover:bg-red-50"
                            aria-label={`Delete ${category.name}`}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-col items-center text-center">
                <div className="mb-3 h-20 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm flex items-center justify-center">
                    {hasImage ? (
                        <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
                            <span className="text-4xl">{icon}</span>
                        </div>
                    )}
                </div>
                <h3
                    className={`font-semibold text-sm ${
                        isSelected ? 'text-blue-700' : 'text-gray-700'
                    }`}
                >
                    {category.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    {category.vehicle_count || 0} vehicles
                </p>
            </div>
        </div>
    );
};

export default CategoryCard;