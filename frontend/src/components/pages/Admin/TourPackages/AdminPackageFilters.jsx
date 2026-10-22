import { PACKAGE_TYPES, PACKAGE_DAYS } from './adminPackagesData';

const TYPE_ICONS = {
  'Beach Side':          '🏖️',
  'Hill Country':        '🏔️',
  'Safari':              '🐘',
  'Cultural Heritage':   '🏛️',
  'Adventure':           '🧗',
  'Wellness & Ayurveda': '🌿',
};

const AdminPackageFilters = ({
  dark = false,
  search, onSearch,
  activeType, onTypeChange,
  activeDays, onDaysChange,
  total, filtered,
  onReset,
}) => {
  const types = ['All', ...PACKAGE_TYPES];
  const days  = ['All', ...PACKAGE_DAYS];
  const hasFilters = search || activeType !== 'All' || activeDays !== 'All';

  return (
    <>
      <style>{`
        .apf-wrap {
          background: #fff;
          border-bottom: 1px solid rgba(0,176,165,0.1);
          position: sticky; top: 0; z-index: 40;
          box-shadow: 0 4px 20px rgba(0,60,50,0.05);
        }
        .apf-wrap.dark {
          background: rgba(15,23,42,0.95);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 12px 28px rgba(0,0,0,0.35);
        }
        .apf-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 16px 40px;
          display: flex; flex-direction: column; gap: 14px;
        }
        @media(max-width:768px){ .apf-inner { padding: 12px 16px; } }

        /* Top row: search + result count */
        .apf-top {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }

        /* Search */
        .apf-search-wrap {
          position: relative; flex: 1; min-width: 200px; max-width: 360px;
        }
        .apf-search-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: #7a9a9a; pointer-events: none;
        }
        .apf-wrap.dark .apf-search-icon { color: #94a3b8; }
        .apf-search {
          width: 100%; padding: 10px 14px 10px 40px;
          border-radius: 10px;
          border: 1.5px solid rgba(0,176,165,0.2);
          background: #f7fffe; color: #0d2b2b;
          font-size: 13px; font-weight: 400;
          outline: none; font-family: inherit;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .apf-search:focus { border-color: #00b0a5; background: #fff; }
        .apf-search::placeholder { color: #9ab8b5; }
        .apf-wrap.dark .apf-search {
          background: rgba(2,6,23,0.8);
          border-color: rgba(255,255,255,0.14);
          color: #e2e8f0;
        }
        .apf-wrap.dark .apf-search:focus {
          border-color: #00b0a5;
          background: #0f172a;
        }
        .apf-wrap.dark .apf-search::placeholder { color: #64748b; }

        /* Count */
        .apf-count {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #5a8080; white-space: nowrap;
        }
        .apf-count b { font-size: 17px; font-weight: 800; color: #0d2b2b; letter-spacing: -0.02em; }
        .apf-wrap.dark .apf-count { color: #94a3b8; }
        .apf-wrap.dark .apf-count b { color: #e2e8f0; }

        /* Reset */
        .apf-reset {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px;
          border: 1.5px solid rgba(204,51,68,0.25);
          background: rgba(204,51,68,0.05);
          color: #cc3344; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .apf-reset:hover { background: rgba(204,51,68,0.1); border-color: #cc3344; }

        /* Filter rows */
        .apf-row {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .apf-label {
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #7a9a9a; flex-shrink: 0; min-width: 58px;
        }
        .apf-wrap.dark .apf-label { color: #94a3b8; }

        /* Type pills */
        .apf-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 13px; border-radius: 100px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
          border: 1.5px solid rgba(0,176,165,0.2);
          background: transparent; color: #4a7070;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
        }
        .apf-wrap.dark .apf-pill {
          border-color: rgba(255,255,255,0.14);
          color: #cbd5e1;
          background: rgba(15,23,42,0.6);
        }
        .apf-pill:hover { border-color: #00b0a5; color: #00b0a5; background: rgba(0,176,165,0.05); }
        .apf-pill.active {
          background: #00b0a5; color: #fff;
          border-color: #00b0a5;
          box-shadow: 0 3px 12px rgba(0,176,165,0.3);
        }

        /* Day pills */
        .apf-day {
          display: inline-flex; align-items: center;
          padding: 5px 14px; border-radius: 100px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.05em;
          border: 1.5px solid rgba(0,176,165,0.2);
          background: transparent; color: #4a7070;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.22,1,0.36,1);
        }
        .apf-wrap.dark .apf-day {
          border-color: rgba(255,255,255,0.14);
          color: #cbd5e1;
          background: rgba(15,23,42,0.6);
        }
        .apf-day:hover { border-color: #00b0a5; color: #00b0a5; background: rgba(0,176,165,0.05); }
        .apf-day.active {
          background: linear-gradient(135deg, #00b0a5, #009e94);
          color: #fff; border-color: transparent;
          box-shadow: 0 3px 12px rgba(0,176,165,0.3);
        }
      `}</style>

      <div className={`apf-wrap ${dark ? 'dark' : ''}`}>
        <div className="apf-inner">

          {/* Top: search + count + reset */}
          <div className="apf-top">
            <div className="apf-search-wrap">
              <svg className="apf-search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                className="apf-search"
                type="text"
                placeholder="Search packages, types or destinations…"
                value={search}
                onChange={e => onSearch(e.target.value)}
              />
            </div>

            <span className="apf-count">
              <b>{filtered}</b> of {total} packages
            </span>

            {hasFilters && (
              <button className="apf-reset" onClick={onReset}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8a6 6 0 1 0 1-3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M2 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reset Filters
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="apf-row">
            <span className="apf-label">Type</span>
            {types.map(t => (
              <button
                key={t}
                className={`apf-pill ${activeType === t ? 'active' : ''}`}
                onClick={() => onTypeChange(t)}
              >
                {TYPE_ICONS[t] && <span>{TYPE_ICONS[t]}</span>}
                {t}
              </button>
            ))}
          </div>

          {/* Duration filter */}
          <div className="apf-row">
            <span className="apf-label">Duration</span>
            {days.map(d => (
              <button
                key={d}
                className={`apf-day ${activeDays === String(d) ? 'active' : ''}`}
                onClick={() => onDaysChange(String(d))}
              >
                {d === 'All' ? 'All' : `${d} Days`}
              </button>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

export default AdminPackageFilters;