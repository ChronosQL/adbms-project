import React from 'react';
import { Car, CheckCircle2, CalendarClock, Wrench } from 'lucide-react';
import { BRAND, STATE } from '../AdminDashboard/adminTheme';

const STAT_CONFIG = [
    {
        key: 'total',
        label: 'Total Fleet',
        countKey: 'total',
        icon: Car,
        accent: '#3B82F6',
    },
    {
        key: 'available',
        label: 'Available Now',
        countKey: 'available',
        icon: CheckCircle2,
        accent: STATE.success,
    },
    {
        key: 'booked',
        label: 'On Tour / Booked',
        countKey: 'booked',
        icon: CalendarClock,
        accent: BRAND.coral,
    },
    {
        key: 'maintenance',
        label: 'In Maintenance',
        countKey: 'maintenance',
        icon: Wrench,
        accent: STATE.warning,
    },
];

const FleetStats = ({ stats, loading, dark = false, t }) => {
    const cardBg = t ? t.cardBg : (dark ? "#383C4E" : "#FFFFFF");
    const cardBorder = t ? t.cardBorder : (dark ? "rgba(255,255,255,0.08)" : "#E8E8EA");
    const textPrimary = t ? t.textPrimary : (dark ? "#FFFFFF" : BRAND.gunmetal);
    const textSecondary = t ? t.textSecondary : (dark ? "#B7BAC7" : BRAND.payneGray);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="animate-pulse rounded-2xl h-24"
                        style={{ background: dark ? "rgba(255,255,255,0.04)" : "#F3F4F6" }}
                    ></div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {STAT_CONFIG.map((item) => {
                const IconComponent = item.icon;
                const value = stats[item.countKey] || 0;

                return (
                    <div
                        key={item.key}
                        className="rounded-2xl p-4 flex items-center justify-between border shadow-xs transition-transform hover:-translate-y-0.5 duration-200"
                        style={{
                            background: cardBg,
                            borderColor: cardBorder,
                        }}
                    >
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: textSecondary }}>
                                {item.label}
                            </p>
                            <p
                                className="text-2xl font-extrabold leading-tight"
                                style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}
                            >
                                {value}
                            </p>
                        </div>
                        <div
                            className="p-3 rounded-xl flex-shrink-0"
                            style={{
                                background: `${item.accent}18`,
                                color: item.accent,
                            }}
                        >
                            <IconComponent size={22} strokeWidth={2.2} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FleetStats;