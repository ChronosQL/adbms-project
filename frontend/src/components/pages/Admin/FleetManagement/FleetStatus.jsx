import React from 'react';

const FleetStats = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-24"></div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        {
            label: 'Total Vehicles',
            value: stats.total,
            icon: '🚗',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200',
        },
        {
            label: 'Available',
            value: stats.available,
            icon: '✅',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200',
        },
        {
            label: 'Booked',
            value: stats.booked,
            icon: '📅',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-700',
            borderColor: 'border-purple-200',
        },
        {
            label: 'Maintenance',
            value: stats.maintenance,
            icon: '🔧',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-700',
            borderColor: 'border-yellow-200',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, index) => (
                <div
                    key={index}
                    className={`${stat.bgColor} border ${stat.borderColor} rounded-xl p-4 transition-transform hover:scale-105`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                        </div>
                        <span className="text-3xl">{stat.icon}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FleetStats;