import React from 'react';

const Pagination = ({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [12, 24, 48],
  itemLabel = 'items',
  scrollToRef = null,
}) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = pagination;

  const handlePageClick = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
    if (scrollToRef && scrollToRef.current) {
      scrollToRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (scrollToRef !== false) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const delta = 2; // Pages on each side of current
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      margin: '40px 0 20px',
      padding: '16px 20px',
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(0, 176, 165, 0.2)',
      borderRadius: '16px',
      backdropFilter: 'blur(10px)',
      color: '#94a3b8',
      fontSize: '13px',
      fontWeight: 500,
    }}>
      {/* Information text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>
          Showing <strong style={{ color: '#00b0a5' }}>{startItem}</strong>–<strong style={{ color: '#00b0a5' }}>{endItem}</strong> of <strong style={{ color: '#f1f5f9' }}>{total}</strong> {itemLabel}
        </span>
      </div>

      {/* Page navigation buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Previous Button */}
        <button
          onClick={() => handlePageClick(page - 1)}
          disabled={page <= 1}
          style={{
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(0, 176, 165, 0.25)',
            background: page <= 1 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 176, 165, 0.1)',
            color: page <= 1 ? 'rgba(148, 163, 184, 0.35)' : '#00b0a5',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: '12px',
            transition: 'all 0.2s ease',
          }}
        >
          ← Prev
        </button>

        {/* Numbered Buttons */}
        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} style={{ padding: '0 6px', color: '#64748b', userSelect: 'none' }}>
                …
              </span>
            );
          }

          const isActive = p === page;
          return (
            <button
              key={p}
              onClick={() => handlePageClick(p)}
              style={{
                minWidth: '34px',
                height: '34px',
                borderRadius: '10px',
                border: isActive ? '1px solid #00b0a5' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isActive ? 'linear-gradient(135deg, #00b0a5, #007a72)' : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? '#ffffff' : '#cbd5e1',
                fontWeight: isActive ? 800 : 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 0 12px rgba(0, 176, 165, 0.4)' : 'none',
              }}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => handlePageClick(page + 1)}
          disabled={page >= totalPages}
          style={{
            padding: '6px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(0, 176, 165, 0.25)',
            background: page >= totalPages ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 176, 165, 0.1)',
            color: page >= totalPages ? 'rgba(148, 163, 184, 0.35)' : '#00b0a5',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: '12px',
            transition: 'all 0.2s ease',
          }}
        >
          Next →
        </button>
      </div>

      {/* Limit selector (optional) */}
      {onLimitChange && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.06em', color: '#64748b' }}>
            Per page:
          </label>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 176, 165, 0.3)',
              background: '#0f172a',
              color: '#00b0a5',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt} style={{ background: '#0f172a', color: '#ffffff' }}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
