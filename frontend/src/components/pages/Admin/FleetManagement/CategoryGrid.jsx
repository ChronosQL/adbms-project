import React from 'react';
import { LayoutGrid } from 'lucide-react';
import CategoryCard from './CategoryCard';
import { BRAND } from '../AdminDashboard/adminTheme';

const CategoryGrid = ({
    categories,
    selectedCategory,
    onCategorySelect,
    onEditCategory,
    onDeleteCategory,
    loading,
    dark = false,
    t,
}) => {
    const cardBg = t ? t.cardBg : (dark ? "#383C4E" : "#FFFFFF");
    const cardBorder = t ? t.cardBorder : (dark ? "rgba(255,255,255,0.08)" : "#E8E8EA");
    const textPrimary = t ? t.textPrimary : (dark ? "#FFFFFF" : BRAND.gunmetal);
    const textSecondary = t ? t.textSecondary : (dark ? "#B7BAC7" : BRAND.payneGray);

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="animate-pulse rounded-2xl h-28"
                        style={{ background: dark ? "rgba(255,255,255,0.04)" : "#F3F4F6" }}
                    ></div>
                ))}
            </div>
        );
    }

    return (
        <div className="mb-6">
            <h2
                className="text-base font-bold mb-3"
                style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}
            >
                Vehicle Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {/* All Categories Option */}
                <div
                    onClick={() => onCategorySelect(null)}
                    className="cursor-pointer rounded-2xl p-3 border-2 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                    style={{
                        borderColor: !selectedCategory ? BRAND.coral : cardBorder,
                        background: !selectedCategory ? "rgba(239, 131, 84, 0.1)" : cardBg,
                    }}
                >
                    <div className="flex flex-col items-center text-center">
                        <div
                            className="mb-2.5 h-16 w-full overflow-hidden rounded-xl border flex items-center justify-center"
                            style={{
                                background: dark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                borderColor: cardBorder,
                            }}
                        >
                            <LayoutGrid size={28} style={{ color: !selectedCategory ? BRAND.coral : textSecondary }} />
                        </div>
                        <h3
                            className="font-bold text-xs truncate w-full"
                            style={{
                                color: !selectedCategory ? BRAND.coral : textPrimary,
                                fontFamily: "'Montserrat', sans-serif",
                            }}
                        >
                            All
                        </h3>
                        <p className="text-[11px] font-medium mt-0.5" style={{ color: textSecondary }}>
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
                        dark={dark}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );
};

export default CategoryGrid;