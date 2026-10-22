import React from "react";

const STATUS_CONFIG = {
  pending: {
    label: "PENDING",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  approved: {
    label: "APPROVED",
    className: "bg-green-50 text-green-700 border border-green-200",
  },
  rejected: {
    label: "REJECTED",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
};

const TYPE_BADGE_CONFIG = {
  Deposit: "bg-blue-50 text-blue-700",
  Final: "bg-purple-50 text-purple-700",
  "Full Payment": "bg-teal-50 text-teal-700",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type, percent }) {
  const cls = TYPE_BADGE_CONFIG[type] || "bg-gray-100 text-gray-600";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-gray-800">{type}</span>
      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded w-fit ${cls}`}>
        {percent}
      </span>
    </div>
  );
}

function PaginationButton({ page, active, onClick, disabled, children }) {
  if (active) {
    return (
      <button
        onClick={() => onClick(page)}
        className="w-8 h-8 rounded-md text-sm font-semibold bg-teal-600 text-white"
      >
        {children ?? page}
      </button>
    );
  }
  return (
    <button
      onClick={() => !disabled && onClick(page)}
      disabled={disabled}
      className={`w-8 h-8 rounded-md text-sm transition-colors
        ${disabled
          ? "text-gray-300 cursor-not-allowed"
          : "text-gray-600 hover:bg-gray-100 cursor-pointer"
        }`}
    >
      {children ?? page}
    </button>
  );
}

function buildPageNumbers(current, totalPages) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const pages = [];
  pages.push(1);
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export default function PaymentTable({
  payments = [],
  selectedId = null,
  onSelect = () => {},
  pagination = { current: 1, total: 7, totalItems: 35, perPage: 5 },
  onPageChange = () => {},
  loading = false,
}) {
  const { current, total, totalItems, perPage } = pagination;
  const start = (current - 1) * perPage + 1;
  const end = Math.min(current * perPage, totalItems);
  const pageNumbers = buildPageNumbers(current, total);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {['Payment ID','Booking','Customer','Type','Amount','Method','Date','Status','Action'].map((col)=> (
                <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
                    </svg>
                    Loading payments...
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-gray-400">No payments found.</td>
              </tr>
            ) : (
              payments.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <tr key={p.id} className={`transition-colors cursor-pointer ${isSelected ? 'bg-teal-50/60' : 'hover:bg-gray-50/80'}`} onClick={() => onSelect(p)}>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">{p.id}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><p className="font-semibold text-gray-800 text-xs">{p.bookingId}</p><p className="text-gray-400 text-xs mt-0.5">{p.tourType}</p></td>
                    <td className="px-4 py-3.5"><p className="font-medium text-gray-800">{p.customerName}</p><p className="text-gray-400 text-xs mt-0.5">{p.customerPhone}</p></td>
                    <td className="px-4 py-3.5"><TypeBadge type={p.type} percent={p.typePercent} /></td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{p.amount}</td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">{p.method}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><p className="text-gray-700">{p.date}</p><p className="text-gray-400 text-xs mt-0.5">{p.time}</p></td>
                    <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3.5"><button onClick={(e)=>{e.stopPropagation(); onSelect(p);}} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">View</button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/40">
        <p className="text-xs text-gray-500">Showing {start} to {end} of {totalItems} payments</p>
        <div className="flex items-center gap-1">
          <PaginationButton page={1} onClick={onPageChange} disabled={current===1}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg></PaginationButton>
          <PaginationButton page={current-1} onClick={onPageChange} disabled={current===1}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></PaginationButton>
          {pageNumbers.map((p,i)=> p === '...' ? <span key={`ellipsis-${i}`} className="w-8 text-center text-gray-400 text-sm">…</span> : <PaginationButton key={p} page={p} active={p===current} onClick={onPageChange} />)}
          <PaginationButton page={current+1} onClick={onPageChange} disabled={current===total}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></PaginationButton>
          <PaginationButton page={total} onClick={onPageChange} disabled={current===total}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg></PaginationButton>
        </div>
      </div>
    </div>
  );
}
