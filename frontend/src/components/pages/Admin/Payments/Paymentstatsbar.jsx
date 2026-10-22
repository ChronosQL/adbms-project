import React from "react";

/**
 * PaymentStatsBar
 *
 * Props:
 *  - stats: {
 *      pendingCount: number,
 *      approvedCount: number,
 *      rejectedCount: number,
 *      totalReceived: number,        // e.g. 1250000
 *      totalReceivedLabel: string,   // e.g. "LKR 1,250,000"
 *      totalPaymentsCount: number,   // e.g. 28
 *      currency: string,             // e.g. "LKR"
 *    }
 */

const CARDS = [
  {
    key: "pending",
    label: "Pending Verifications",
    sublabel: "Needs your action",
    countKey: "pendingCount",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="2"/>
        <path d="M9 12h6M9 16h4"/>
      </svg>
    ),
    accent: "#f97316",
    bg: "#fff7ed",
    border: "#fed7aa",
    textColor: "#c2410c",
    countColor: "#ea580c",
  },
  {
    key: "approved",
    label: "Approved Payments",
    sublabel: "This month",
    countKey: "approvedCount",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    accent: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    textColor: "#15803d",
    countColor: "#16a34a",
  },
  {
    key: "rejected",
    label: "Rejected Payments",
    sublabel: "This month",
    countKey: "rejectedCount",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    accent: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    textColor: "#b91c1c",
    countColor: "#dc2626",
  },
  {
    key: "total",
    label: "Total Received",
    sublabel: (stats) => `From ${stats.totalPaymentsCount} payments`,
    isAmount: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94"/>
      </svg>
    ),
    accent: "#7c3aed",
    bg: "#faf5ff",
    border: "#e9d5ff",
    textColor: "#6d28d9",
    countColor: "#7c3aed",
  },
];

export default function PaymentStatsBar({ stats = {} }) {
  const defaultStats = {
    pendingCount: 5,
    approvedCount: 28,
    rejectedCount: 2,
    totalReceived: 1250000,
    totalReceivedLabel: "LKR 1,250,000",
    totalPaymentsCount: 28,
    currency: "LKR",
    ...stats,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {CARDS.map((card) => {
        const sublabel =
          typeof card.sublabel === "function"
            ? card.sublabel(defaultStats)
            : card.sublabel;

        const displayValue = card.isAmount
          ? defaultStats.totalReceivedLabel
          : defaultStats[card.countKey];

        return (
          <div
            key={card.key}
            className="rounded-xl p-5 flex items-start gap-4 border"
            style={{
              background: card.bg,
              borderColor: card.border,
            }}
          >
            <div
              className="rounded-full p-2 flex-shrink-0 mt-0.5"
              style={{ background: card.border, color: card.accent }}
            >
              {card.icon}
            </div>

            <div className="min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: card.textColor }}
              >
                {card.label}
              </p>
              <p
                className={`font-bold leading-none mb-1 ${
                  card.isAmount ? "text-xl" : "text-3xl"
                }`}
                style={{ color: card.countColor }}
              >
                {displayValue}
              </p>
              <p className="text-xs" style={{ color: card.textColor + "99" }}>
                {sublabel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
