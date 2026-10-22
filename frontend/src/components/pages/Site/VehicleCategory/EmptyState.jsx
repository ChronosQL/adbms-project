import React from 'react';
const EmptyState = ({ categoryName }) => {
    
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-8xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
                No Vehicles Found
            </h3>
            <p className="text-gray-500 text-center max-w-md">
                {categoryName
                    ? `Sorry, we don't have any vehicles in the "${categoryName}" category at the moment. Please check back later or browse other categories.`
                    : 'No vehicles match your current filters. Try adjusting your search criteria.'}
            </p>
        </div>
    );
};

export default EmptyState;