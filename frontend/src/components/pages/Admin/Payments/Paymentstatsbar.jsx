import React from "react";
import { Clock, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { BRAND, STATE } from "../AdminDashboard/adminTheme";

const CARDS = [
  {
    key: "pending",
    label: "Pending Verifications",
    sublabel: "Needs your action",
    countKey: "pendingCount",
    icon: Clock,
    accent: STATE.warning,
  },
  {
    key: "approved",
    label: "Approved Payments",
    sublabel: "This month",
    countKey: "approvedCount",
    icon: CheckCircle2,
    accent: STATE.success,
  },
  {
    key: "rejected",
    label: "Rejected Payments",
    sublabel: "This month",
    countKey: "rejectedCount",
    icon: XCircle,
    accent: STATE.danger,
  },
  {
    key: "received",
    label: "Total Revenue",
    sublabel: (s) => `${s.totalPaymentsCount || 0} transactions`,
    isAmount: true,
    icon: Wallet,
    accent: BRAND.coral,
  },
];

export default function PaymentStatsBar({ stats = {}, dark = false, t }) {
  const defaultStats = {
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalReceived: 0,
    totalReceivedLabel: "LKR 0.00",
    totalPaymentsCount: 0,
    currency: "LKR",
    ...stats,
  };

  const cardBg = t ? t.cardBg : (dark ? "#383C4E" : "#FFFFFF");
  const cardBorder = t ? t.cardBorder : (dark ? "rgba(255,255,255,0.08)" : "#E8E8EA");
  const textPrimary = t ? t.textPrimary : (dark ? "#FFFFFF" : BRAND.gunmetal);
  const textSecondary = t ? t.textSecondary : (dark ? "#B7BAC7" : BRAND.payneGray);

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

        const IconComponent = card.icon;

        return (
          <div
            key={card.key}
            className="rounded-2xl p-5 flex items-start gap-4 transition-all duration-200 shadow-xs"
            style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
            }}
          >
            <div
              className="rounded-xl p-2.5 flex-shrink-0 mt-0.5"
              style={{
                background: `${card.accent}18`,
                color: card.accent,
              }}
            >
              <IconComponent size={20} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <p
                className="text-xs font-bold uppercase tracking-wider mb-1"
                style={{ color: textSecondary }}
              >
                {card.label}
              </p>
              <p
                className={`font-extrabold leading-tight mb-1 ${
                  card.isAmount ? "text-xl" : "text-2xl"
                }`}
                style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}
              >
                {displayValue}
              </p>
              <p className="text-xs font-medium" style={{ color: textSecondary }}>
                {sublabel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
