import React from 'react';
import { CarFront, Edit2, Trash2 } from 'lucide-react';
import { BRAND, STATE } from '../AdminDashboard/adminTheme';

const CategoryCard = ({ category, isSelected, onClick, onEdit, onDelete, dark = false, t }) => {
    const hasImage = Boolean(category.image_url);

    const cardBg = t ? t.cardBg : (dark ? "#383C4E" : "#FFFFFF");
    const cardBorder = t ? t.cardBorder : (dark ? "rgba(255,255,255,0.08)" : "#E8E8EA");
    const textPrimary = t ? t.textPrimary : (dark ? "#FFFFFF" : BRAND.gunmetal);
    const textSecondary = t ? t.textSecondary : (dark ? "#B7BAC7" : BRAND.payneGray);

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
            className="cursor-pointer rounded-2xl p-3 border-2 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 relative group"
            style={{
                borderColor: isSelected ? BRAND.coral : cardBorder,
                background: isSelected ? "rgba(239, 131, 84, 0.1)" : cardBg,
            }}
        >
            {(onEdit || onDelete) && (
                <div className="absolute right-2 top-2 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={handleEdit}
                            className="rounded-full p-1.5 shadow-xs transition-colors cursor-pointer"
                            style={{
                                background: dark ? "#242838" : "#FFFFFF",
                                color: BRAND.coral,
                                border: `1px solid ${cardBorder}`,
                            }}
                            aria-label={`Edit ${category.name}`}
                        >
                            <Edit2 size={13} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="rounded-full p-1.5 shadow-xs transition-colors cursor-pointer"
                            style={{
                                background: dark ? "#242838" : "#FFFFFF",
                                color: STATE.danger,
                                border: `1px solid ${cardBorder}`,
                            }}
                            aria-label={`Delete ${category.name}`}
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-col items-center text-center">
                <div
                    className="mb-2.5 h-16 w-full overflow-hidden rounded-xl border flex items-center justify-center"
                    style={{
                        background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                        borderColor: cardBorder,
                    }}
                >
                    {hasImage ? (
                        <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <CarFront size={28} style={{ color: isSelected ? BRAND.coral : textSecondary }} />
                    )}
                </div>
                <h3
                    className="font-bold text-xs truncate w-full"
                    style={{ color: isSelected ? BRAND.coral : textPrimary, fontFamily: "'Montserrat', sans-serif" }}
                >
                    {category.name}
                </h3>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: textSecondary }}>
                    {category.vehicle_count || 0} vehicles
                </p>
            </div>
        </div>
    );
};

export default CategoryCard;