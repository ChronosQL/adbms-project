import React from "react";
import { Search, ChevronDown } from "lucide-react";
import { BRAND, FONT } from "../AdminDashboard/adminTheme";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "deposit", label: "Deposit" },
  { value: "final", label: "Final" },
  { value: "full", label: "Full Payment" },
  { value: "additional", label: "Additional Charges" },
];

const METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const TABS = [
  { key: "all", label: "All Payments", countKey: "all" },
  { key: "pending", label: "Pending Verifications", countKey: "pending" },
  { key: "approved", label: "Approved", countKey: "approved" },
  { key: "rejected", label: "Rejected", countKey: "rejected" },
];

export default function PaymentFilters({
  counts = { all: 0, pending: 0, approved: 0, rejected: 0 },
  filters = { search: "", type: "", method: "" },
  onFilterChange = () => {},
  activeTab = "all",
  onTabChange = () => {},
  t = { cardBg: "#FFFFFF", cardBorder: "#E8E8EA", textPrimary: BRAND.gunmetal, textSecondary: BRAND.payneGray, headerBg: "#F7F7F8" },
}) {
  return (
    <div className="mb-6 space-y-4">
      {/* ── Search and dropdown filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            style={{ color: t.textSecondary }}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by Payment ID, Customer name, Booking ref, phone..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            style={{
              background: t.cardBg,
              borderColor: t.cardBorder,
              color: t.textPrimary,
              fontFamily: FONT.body,
            }}
            className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl placeholder:text-gray-400 focus:outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 transition-all font-medium"
          />
        </div>

        {/* Method Filter */}
        <div className="relative">
          <select
            value={filters.method || ""}
            onChange={(e) => onFilterChange("method", e.target.value)}
            style={{
              background: t.cardBg,
              borderColor: t.cardBorder,
              color: t.textPrimary,
              fontFamily: FONT.body,
            }}
            className="appearance-none pl-3.5 pr-9 py-2.5 text-sm font-semibold border rounded-xl focus:outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 cursor-pointer transition-all"
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{ color: t.textSecondary }}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={filters.type || ""}
            onChange={(e) => onFilterChange("type", e.target.value)}
            style={{
              background: t.cardBg,
              borderColor: t.cardBorder,
              color: t.textPrimary,
              fontFamily: FONT.body,
            }}
            className="appearance-none pl-3.5 pr-9 py-2.5 text-sm font-semibold border rounded-xl focus:outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 cursor-pointer transition-all"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{ color: t.textSecondary }}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>
      </div>

      {/* ── Status Tabs (Filtration Tags) ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              style={{
                fontFamily: FONT.body,
                background: isActive ? BRAND.coral : t.cardBg,
                borderColor: isActive ? BRAND.coral : t.cardBorder,
                color: isActive ? "#FFFFFF" : t.textSecondary,
                boxShadow: isActive ? "0 2px 8px rgba(239,131,84,0.22)" : "none",
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer hover:border-[#EF8354] hover:text-[#EF8354] active:scale-[0.98]"
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? "rgba(255,255,255,0.22)" : (t.dark ? "rgba(255,255,255,0.08)" : "#EEEEF0"),
                  color: isActive ? "#FFFFFF" : t.textSecondary,
                }}
                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full transition-colors"
              >
                {counts[tab.countKey] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
