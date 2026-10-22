import React from 'react';
import CategoryCard from './CategoryCard';

const CategoryGrid = ({
    categories,
    selectedCategory,
    onCategorySelect,
    onEditCategory,
    onDeleteCategory,
    loading,
}) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="animate-pulse bg-gray-200 rounded-xl h-28"
                    ></div>
                ))}
            </div>
        );
    }

    return (
        <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Vehicle Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {/* All Categories Option */}
                <div
                    onClick={() => onCategorySelect(null)}
                    className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                        !selectedCategory
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                >
                    <div className="flex flex-col items-center text-center">
                        <div className="text-4xl mb-2">📋</div>
                        <h3
                            className={`font-semibold text-sm ${
                                !selectedCategory
                                    ? 'text-blue-700'
                                    : 'text-gray-700'
                            }`}
                        >
                            All
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            View All
                        </p>
                    </div>
                </div>

                {categories.map((category) => (
                    <CategoryCard
                        key={category.id}
                        category={category}
                        isSelected={selectedCategory?.id === category.id}
                        onClick={onCategorySelect}
                        onEdit={onEditCategory}
                        onDelete={onDeleteCategory}
                    />
                ))}
            </div>
        </div>
    );
};

export default CategoryGrid;