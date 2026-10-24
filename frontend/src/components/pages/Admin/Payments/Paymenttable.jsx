import React from "react";
import Pagination from "../../../common/Pagination";
import { FileText, ExternalLink } from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "PENDING",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  approved: {
    label: "APPROVED",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  rejected: {
    label: "REJECTED",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
};

const TYPE_BADGE_CONFIG = {
  Deposit: "bg-blue-50 text-blue-700 border border-blue-200",
  Final: "bg-purple-50 text-purple-700 border border-purple-200",
  "Full Payment": "bg-teal-50 text-teal-700 border border-teal-200",
  "Additional Charges": "bg-amber-50 text-amber-700 border border-amber-200",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type, percent }) {
  const cls = TYPE_BADGE_CONFIG[type] || "bg-gray-100 text-gray-600 border border-gray-200";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-800">{type}</span>
      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded w-fit ${cls}`}>
        {percent}
      </span>
    </div>
  );
}

function MethodBadge({ method, slip }) {
  const isBank = method === "Bank Transfer" || method === "BANK_TRANSFER";
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
          isBank
            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
        }`}
      >
        <span>{isBank ? "🏦" : "💵"}</span>
        <span>{isBank ? "Bank Transfer" : "Cash"}</span>
      </span>
      {slip && (
        <a
          href={slip.previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="View uploaded payment slip"
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#EF8354] hover:underline bg-[#EF8354]/10 border border-[#EF8354]/20 px-1.5 py-0.5 rounded"
        >
          <FileText size={11} /> Slip
        </a>
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
}) {
  const { current, total, totalItems, perPage } = pagination;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75">
              {["Payment ID", "Booking", "Customer", "Type", "Amount", "Method", "Date", "Status", "Action"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  <div className="flex items-center justify-center gap-2 text-sm font-medium">
                    <svg
                      className="animate-spin w-4 h-4 text-[#EF8354]"
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
                <td colSpan={9} className="text-center py-12 text-slate-400 text-sm">
                  No payments found matching the selected filters.
                </td>
              </tr>
            ) : (
              payments.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? "bg-[#EF8354]/8" : "hover:bg-slate-50/80"
                    }`}
                    onClick={() => onSelect(p)}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                      {p.id}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-bold text-slate-800 text-xs">{p.bookingId}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{p.tourType}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800 text-xs">{p.customerName}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{p.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <TypeBadge type={p.type} percent={p.typePercent} />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                      {p.amount}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <MethodBadge method={p.method} slip={p.slip} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="text-slate-700 text-xs font-medium">{p.date}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5">{p.time}</p>
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:border-[#EF8354] hover:text-[#EF8354] hover:bg-[#EF8354]/5 transition-colors cursor-pointer"
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
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <Pagination
            pagination={{
              page: current,
              totalPages: total,
              total: totalItems,
              limit: perPage,
            }}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            limitOptions={[5, 10, 20]}
            itemLabel="payments"
            scrollToRef={false}
          />
        </div>
      )}
    </div>
  );
}
