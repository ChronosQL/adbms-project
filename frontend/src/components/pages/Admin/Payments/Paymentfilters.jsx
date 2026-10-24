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
}) {
  return (
    <div className="mb-6 space-y-4">
      {/* ── Search and dropdown filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by Payment ID, Customer name, Booking ref, phone..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 transition-all"
          />
        </div>

        {/* Method Filter */}
        <div className="relative">
          <select
            value={filters.method || ""}
            onChange={(e) => onFilterChange("method", e.target.value)}
            className="appearance-none pl-3.5 pr-9 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 cursor-pointer"
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <select
            value={filters.type || ""}
            onChange={(e) => onFilterChange("type", e.target.value)}
            className="appearance-none pl-3.5 pr-9 py-2.5 text-sm font-medium border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 cursor-pointer"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
          />
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#EF8354] text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
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
