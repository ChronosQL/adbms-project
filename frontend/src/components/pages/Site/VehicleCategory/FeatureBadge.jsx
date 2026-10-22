import React from 'react';

const FeatureBadge = ({ icon, label, value }) => {
    return (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
            <span className="text-xl">{icon}</span>
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

export default FeatureBadge;