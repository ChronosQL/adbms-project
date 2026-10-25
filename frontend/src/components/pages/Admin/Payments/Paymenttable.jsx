import React from "react";
import Pagination from "../../../common/Pagination";
import { FileText, ExternalLink } from "lucide-react";
import { BRAND, STATE } from "../AdminDashboard/adminTheme";

const STATUS_CONFIG = {
  pending: {
    label: "PENDING",
    bg: "rgba(227, 168, 87, 0.12)",
    text: STATE.warning,
    border: "rgba(227, 168, 87, 0.25)",
  },
  approved: {
    label: "APPROVED",
    bg: "rgba(47, 158, 68, 0.12)",
    text: STATE.success,
    border: "rgba(47, 158, 68, 0.25)",
  },
  rejected: {
    label: "REJECTED",
    bg: "rgba(224, 72, 59, 0.12)",
    text: STATE.danger,
    border: "rgba(224, 72, 59, 0.25)",
  },
};

const TYPE_BADGE_CONFIG = {
  Deposit: { bg: "rgba(59, 130, 246, 0.1)", text: "#3B82F6", border: "rgba(59, 130, 246, 0.25)" },
  Final: { bg: "rgba(139, 92, 246, 0.1)", text: "#8B5CF6", border: "rgba(139, 92, 246, 0.25)" },
  "Full Payment": { bg: "rgba(239, 131, 84, 0.1)", text: BRAND.coral, border: "rgba(239, 131, 84, 0.25)" },
  "Additional Charges": { bg: "rgba(227, 168, 87, 0.1)", text: STATE.warning, border: "rgba(227, 168, 87, 0.25)" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide"
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type, percent, t }) {
  const cfg = TYPE_BADGE_CONFIG[type] || { bg: "rgba(100, 116, 139, 0.1)", text: "#64748B", border: "rgba(100, 116, 139, 0.2)" };
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold" style={{ color: t?.textPrimary || '#2D3142' }}>{type}</span>
      <span
        className="inline-block text-[10px] font-bold px-2 py-0.5 rounded w-fit"
        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
      >
        {percent}
      </span>
    </div>
  );
}

function MethodBadge({ method, slip, dark }) {
  const isBank = method === "Bank Transfer" || method === "BANK_TRANSFER";
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
        style={{
          background: isBank ? "rgba(99, 102, 241, 0.1)" : "rgba(47, 158, 68, 0.1)",
          color: isBank ? (dark ? "#818cf8" : "#4f46e5") : (dark ? "#4ade80" : "#15803d"),
          borderColor: isBank ? "rgba(99, 102, 241, 0.25)" : "rgba(47, 158, 68, 0.25)",
        }}
      >
        <span>{isBank ? "🏦" : "💵"}</span>
        <span>{isBank ? "Bank Transfer" : "Cash"}</span>
      </span>
      {slip && (
        <span
          title="Open payment row to view uploaded receipt"
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded"
          style={{
            background: "rgba(239, 131, 84, 0.12)",
            color: BRAND.coral,
            border: "1px solid rgba(239, 131, 84, 0.25)",
          }}
        >
          <FileText size={11} /> Slip
        </span>
      )}
    </div>
  );
}

export default function PaymentTable({
  payments = [],
  selectedId = null,
  onSelect = () => {},
  pagination = { current: 1, total: 1, totalItems: 0, perPage: 10 },
  onPageChange = () => {},
  onLimitChange = () => {},
  loading = false,
  dark = false,
  t,
}) {
  const { current, total, totalItems, perPage } = pagination;

  const cardBg = t ? t.cardBg : (dark ? "#383C4E" : "#FFFFFF");
  const cardBorder = t ? t.cardBorder : (dark ? "rgba(255,255,255,0.08)" : "#E8E8EA");
  const textPrimary = t ? t.textPrimary : (dark ? "#FFFFFF" : BRAND.gunmetal);
  const textSecondary = t ? t.textSecondary : (dark ? "#B7BAC7" : BRAND.payneGray);
  const divider = t ? t.divider : (dark ? "rgba(255,255,255,0.06)" : "#EEEEF0");
  const headerBg = dark ? "rgba(255,255,255,0.03)" : "#F8FAFC";

  return (
    <div
      className="rounded-2xl shadow-sm overflow-hidden transition-colors"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: headerBg, borderBottom: `1px solid ${divider}` }}>
              {["Payment ID", "Booking", "Customer", "Type", "Amount", "Method", "Date", "Status", "Action"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: textSecondary, fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody style={{ borderColor: divider }} className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12" style={{ color: textSecondary }}>
                  <div className="flex items-center justify-center gap-2 text-sm font-medium">
                    <svg
                      className="animate-spin w-4 h-4"
                      style={{ color: BRAND.coral }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                    Loading payments...
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-sm" style={{ color: textSecondary }}>
                  No payments found matching the selected filters.
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <tr
                    key={p.id}
                    className="transition-colors cursor-pointer"
                    style={{
                      background: isSelected
                        ? "rgba(239, 131, 84, 0.12)"
                        : "transparent",
                      borderBottom: `1px solid ${divider}`,
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.03)" : "#F8FAFC";
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => onSelect(p)}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold whitespace-nowrap" style={{ color: textPrimary }}>
                      {p.id}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-bold text-xs" style={{ color: textPrimary }}>{p.bookingId}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: textSecondary }}>{p.tourType}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-xs" style={{ color: textPrimary }}>{p.customerName}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: textSecondary }}>{p.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <TypeBadge type={p.type} percent={p.typePercent} t={t} />
                    </td>
                    <td className="px-4 py-3.5 font-bold whitespace-nowrap" style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}>
                      {p.amount}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <MethodBadge method={p.method} slip={p.slip} dark={dark} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-xs font-medium" style={{ color: textPrimary }}>{p.date}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: textSecondary }}>{p.time}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(p);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer"
                        style={{
                          background: dark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                          borderColor: cardBorder,
                          color: textPrimary,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = BRAND.coral;
                          e.currentTarget.style.color = BRAND.coral;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = cardBorder;
                          e.currentTarget.style.color = textPrimary;
                        }}
                      >
                        <span>Details</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalItems > perPage && (
        <div
          className="px-4 py-3"
          style={{
            borderTop: `1px solid ${divider}`,
            background: headerBg,
          }}
        >
          <Pagination
            pagination={{
              page: current,
              totalPages: total,
              total: totalItems,
              limit: perPage,
            }}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            scrollToRef={false}
          />
        </div>
      )}
    </div>
  );
}
