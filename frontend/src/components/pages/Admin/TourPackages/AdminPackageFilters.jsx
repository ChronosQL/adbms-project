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
        .apf-container {
          max-width: 1320px;
          margin: 0 auto;
          padding: 20px 24px 0;
        }
        @media(max-width:768px){ .apf-container { padding: 16px 16px 0; } }

        .apf-card {
          border-radius: 20px;
          background: #ffffff;
          border: 1px solid #E8E8EA;
          box-shadow: 0 2px 10px rgba(0,0,0,0.03);
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .apf-card.dark {
          background: #383C4E;
          border-color: rgba(255,255,255,0.08);
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }

        /* Top row: search + result count */
        .apf-top {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Search */
        .apf-search-wrap {
          position: relative;
          flex: 1;
          min-width: 220px;
          max-width: 380px;
        }
        .apf-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #4F5D75;
          pointer-events: none;
        }
        .apf-card.dark .apf-search-icon { color: #B7BAC7; }
        .apf-search {
          width: 100%;
          padding: 10px 14px 10px 40px;
          border-radius: 12px;
          border: 1px solid #E8E8EA;
          background: #F7F7F8;
          color: #2D3142;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .apf-search:focus {
          border-color: #EF8354;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(239,131,84,0.15);
        }
        .apf-search::placeholder { color: #9ca3af; }
        .apf-card.dark .apf-search {
          background: #2D3142;
          border-color: rgba(255,255,255,0.12);
          color: #F5F5F6;
        }
        .apf-card.dark .apf-search:focus {
          border-color: #EF8354;
          box-shadow: 0 0 0 3px rgba(239,131,84,0.2);
        }
        .apf-card.dark .apf-search::placeholder { color: #64748b; }

        /* Count */
        .apf-count {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4F5D75;
          white-space: nowrap;
        }
        .apf-count b { font-size: 15px; font-weight: 800; color: #EF8354; }
        .apf-card.dark .apf-count { color: #B7BAC7; }
        .apf-card.dark .apf-count b { color: #EF8354; }

        /* Reset */
        .apf-reset {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 10px;
          border: 1px solid rgba(224,72,59,0.25);
          background: rgba(224,72,59,0.06);
          color: #E0483B;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: auto;
        }
        .apf-reset:hover {
          background: rgba(224,72,59,0.12);
          border-color: #E0483B;
        }

        /* Filter rows */
        .apf-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .apf-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4F5D75;
          flex-shrink: 0;
          min-width: 68px;
        }
        .apf-card.dark .apf-label { color: #B7BAC7; }

        /* Type pills */
        .apf-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid #EEEEF0;
          background: #F7F7F8;
          color: #4F5D75;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .apf-card.dark .apf-pill {
          border-color: rgba(255,255,255,0.08);
          color: #B7BAC7;
          background: rgba(255,255,255,0.04);
        }
        .apf-pill:hover {
          border-color: #EF8354;
          color: #EF8354;
          background: rgba(239,131,84,0.08);
        }
        .apf-pill.active {
          background: #EF8354;
          color: #FFFFFF;
          border-color: #EF8354;
          box-shadow: 0 2px 10px rgba(239,131,84,0.25);
        }

        /* Day pills */
        .apf-day {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid #EEEEF0;
          background: #F7F7F8;
          color: #4F5D75;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .apf-card.dark .apf-day {
          border-color: rgba(255,255,255,0.08);
          color: #B7BAC7;
          background: rgba(255,255,255,0.04);
        }
        .apf-day:hover {
          border-color: #EF8354;
          color: #EF8354;
          background: rgba(239,131,84,0.08);
        }
        .apf-day.active {
          background: #EF8354;
          color: #FFFFFF;
          border-color: #EF8354;
          box-shadow: 0 2px 10px rgba(239,131,84,0.25);
        }
      `}</style>

      <div className="apf-container">
        <div className={`apf-card ${dark ? 'dark' : ''}`}>

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