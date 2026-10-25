import React from 'react';
import StatusBadge from './StatusBadge';
import { Users, Fuel, Settings2, Briefcase, Trash2 } from 'lucide-react';
import { BRAND, STATE } from '../AdminDashboard/adminTheme';

const VehicleCard = ({ vehicle, onView, onEdit, onDelete, dark = false, t }) => {
    const cardBg = t ? t.cardBg : (dark ? "#383C4E" : "#FFFFFF");
    const cardBorder = t ? t.cardBorder : (dark ? "rgba(255,255,255,0.08)" : "#E8E8EA");
    const textPrimary = t ? t.textPrimary : (dark ? "#FFFFFF" : BRAND.gunmetal);
    const textSecondary = t ? t.textSecondary : (dark ? "#B7BAC7" : BRAND.payneGray);

    return (
        <div
            className="rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200"
            style={{
                background: cardBg,
                borderColor: cardBorder,
            }}
        >
            {/* Vehicle Image */}
            <div
                className="relative h-48 overflow-hidden"
                style={{ background: dark ? "rgba(255,255,255,0.03)" : "#F3F4F6" }}
            >
                {vehicle.image_url ? (
                    <img
                        src={vehicle.image_url}
                        alt={vehicle.vehicle_name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-4xl text-gray-400">🚗</span>
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <StatusBadge status={vehicle.status} />
                </div>
                <div className="absolute top-3 left-3">
                    <span
                        className="backdrop-blur-md text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs"
                        style={{
                            background: dark ? "rgba(45, 49, 66, 0.85)" : "rgba(255, 255, 255, 0.9)",
                            color: textPrimary,
                        }}
                    >
                        {vehicle.category_name}
                    </span>
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-1.5">
                    <h3
                        className="text-base font-bold truncate max-w-[65%]"
                        style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}
                    >
                        {vehicle.vehicle_name}
                    </h3>
                    <span className="text-base font-extrabold whitespace-nowrap" style={{ color: BRAND.coral, fontFamily: "'Montserrat', sans-serif" }}>
                        LKR {Number(vehicle.price_per_day).toLocaleString('en-LK')}
                        <span className="text-xs font-normal" style={{ color: textSecondary }}>/day</span>
                    </span>
                </div>

                <p className="text-xs mb-3 truncate" style={{ color: textSecondary }}>
                    {vehicle.brand} {vehicle.model} {vehicle.year && `• ${vehicle.year}`}
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3.5">
                    <div className="flex items-center text-xs" style={{ color: textSecondary }}>
                        <Users size={13} className="mr-1.5 shrink-0" style={{ color: BRAND.coral }} />
                        {vehicle.seats} Seats
                    </div>
                    <div className="flex items-center text-xs" style={{ color: textSecondary }}>
                        <Fuel size={13} className="mr-1.5 shrink-0" style={{ color: BRAND.coral }} />
                        {vehicle.fuel_type}
                    </div>
                    <div className="flex items-center text-xs" style={{ color: textSecondary }}>
                        <Settings2 size={13} className="mr-1.5 shrink-0" style={{ color: BRAND.coral }} />
                        {vehicle.transmission}
                    </div>
                    <div className="flex items-center text-xs" style={{ color: textSecondary }}>
                        <Briefcase size={13} className="mr-1.5 shrink-0" style={{ color: BRAND.coral }} />
                        {vehicle.luggage_capacity} Bags
                    </div>
                </div>

                {/* License Plate */}
                <div
                    className="flex items-center justify-between text-xs mb-3 rounded-xl px-3 py-2"
                    style={{
                        background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                        color: textSecondary,
                    }}
                >
                    <span>License: <strong style={{ color: textPrimary }}>{vehicle.license_plate}</strong></span>
                    {vehicle.air_conditioning && (
                        <span className="font-semibold text-[11px]" style={{ color: '#3B82F6' }}>
                            ❄️ A/C
                        </span>
                    )}
                </div>

                <div
                    className="mb-4 text-xs font-bold rounded-xl px-3 py-1.5 border flex items-center justify-between"
                    style={{
                        background: vehicle.insurance_expired ? "rgba(224, 72, 59, 0.1)" : "rgba(47, 158, 68, 0.1)",
                        borderColor: vehicle.insurance_expired ? "rgba(224, 72, 59, 0.25)" : "rgba(47, 158, 68, 0.25)",
                        color: vehicle.insurance_expired ? STATE.danger : STATE.success,
                    }}
                >
                    <span>{vehicle.insurance_expired ? 'Insurance Expired' : 'Insurance Valid'}</span>
                    <span className="text-[10px] uppercase font-bold opacity-80">{vehicle.insurance_provider}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onView(vehicle)}
                        className="flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                        style={{
                            background: dark ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                            color: textPrimary,
                        }}
                    >
                        View
                    </button>
                    <button
                        onClick={() => onEdit(vehicle)}
                        className="flex-1 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                        style={{ background: BRAND.coral }}
                        onMouseEnter={e => e.currentTarget.style.background = '#d96e41'}
                        onMouseLeave={e => e.currentTarget.style.background = BRAND.coral}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(vehicle)}
                        className="p-2 rounded-xl transition-colors cursor-pointer"
                        style={{
                            background: "rgba(224, 72, 59, 0.1)",
                            color: STATE.danger,
                        }}
                        aria-label={`Delete ${vehicle.vehicle_name}`}
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleCard;