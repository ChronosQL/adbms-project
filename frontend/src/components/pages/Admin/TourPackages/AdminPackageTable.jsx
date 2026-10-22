import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import AdminPackageAvailabilityModal from './AdminPackageAvailabilityModal';

const TYPE_COLORS = {
  'Beach Side':          { bg: 'rgba(0,153,204,0.1)',  color: '#0099cc',  border: 'rgba(0,153,204,0.25)'  },
  'Hill Country':        { bg: 'rgba(92,138,60,0.1)',   color: '#5c8a3c',  border: 'rgba(92,138,60,0.25)'  },
  'Safari':              { bg: 'rgba(204,119,34,0.1)',  color: '#cc7722',  border: 'rgba(204,119,34,0.25)' },
  'Cultural Heritage':   { bg: 'rgba(136,85,204,0.1)', color: '#8855cc',  border: 'rgba(136,85,204,0.25)' },
  'Adventure':           { bg: 'rgba(204,51,68,0.1)',   color: '#cc3344',  border: 'rgba(204,51,68,0.25)'  },
  'Wellness & Ayurveda': { bg: 'rgba(51,153,122,0.1)', color: '#33997a',  border: 'rgba(51,153,122,0.25)' },
};

const TYPE_ICONS = {
  'Beach Side': '🏖️', 'Hill Country': '🏔️', 'Safari': '🐘',
  'Cultural Heritage': '🏛️', 'Adventure': '🧗', 'Wellness & Ayurveda': '🌿',
};

const AdminPackageTable = ({ packages, onEdit, onDelete, dark = false }) => {
  const [availabilityPackage, setAvailabilityPackage] = useState(null);

  if (packages.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '80px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
      }}>
        <div style={{ fontSize: '44px' }}>📦</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: dark ? '#e2e8f0' : '#0d2b2b', letterSpacing: '-0.02em' }}>
          No packages match your filters
        </h3>
        <p style={{ fontSize: '14px', fontWeight: 300, color: dark ? '#94a3b8' : '#5a8080' }}>
          Try adjusting your search or filters, or add a new package.
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .apt-wrap {
          max-width: 1280px; margin: 0 auto;
          padding: 32px 40px 80px;
        }
        .apt-wrap.dark { color: #cbd5e1; }
        @media(max-width:768px){ .apt-wrap { padding: 20px 16px 60px; } }

        /* Section heading */
        .apt-heading {
          font-size: 10px; font-weight: 800;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #5a8080; margin-bottom: 20px;
          display: flex; align-items: center; gap: 10px;
        }
        .apt-wrap.dark .apt-heading { color: #94a3b8; }
        .apt-heading::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, rgba(0,176,165,0.2), transparent);
        }

        /* Table card */
        .apt-card {
          background: #fff;
          border: 1px solid rgba(0,176,165,0.1);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,60,50,0.06);
        }
        .apt-wrap.dark .apt-card {
          background: rgba(15,23,42,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 16px 30px rgba(0,0,0,0.35);
        }

        /* Table */
        .apt-table {
          width: 100%; border-collapse: collapse;
        }
        .apt-table thead tr {
          background: #f7fffe;
          border-bottom: 1px solid rgba(0,176,165,0.1);
        }
        .apt-wrap.dark .apt-table thead tr {
          background: rgba(2,6,23,0.8);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .apt-th {
          padding: 14px 18px;
          text-align: left;
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #7a9a9a; white-space: nowrap;
        }
        .apt-wrap.dark .apt-th { color: #94a3b8; }
        .apt-th:last-child { text-align: right; }

        .apt-row {
          border-bottom: 1px solid rgba(0,176,165,0.06);
          transition: background 0.15s ease;
        }
        .apt-row:last-child { border-bottom: none; }
        .apt-row:hover { background: #f7fffe; }
        .apt-wrap.dark .apt-row {
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .apt-wrap.dark .apt-row:hover { background: rgba(255,255,255,0.04); }

        .apt-td {
          padding: 16px 18px;
          vertical-align: middle;
          font-size: 13.5px; font-weight: 400; color: #3a5a5a;
        }
        .apt-wrap.dark .apt-td { color: #cbd5e1; }

        /* Package identity cell */
        .apt-pkg-cell { display: flex; align-items: center; gap: 14px; }
        .apt-pkg-thumb {
          width: 52px; height: 40px; border-radius: 8px;
          object-fit: cover; flex-shrink: 0;
          border: 1px solid rgba(0,176,165,0.15);
          box-shadow: 0 2px 8px rgba(0,60,50,0.1);
        }
        .apt-pkg-thumb-placeholder {
          width: 52px; height: 40px; border-radius: 8px;
          background: linear-gradient(135deg, rgba(0,176,165,0.1), rgba(0,176,165,0.2));
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .apt-pkg-title {
          font-size: 14px; font-weight: 800;
          color: #0d2b2b; letter-spacing: -0.02em;
          line-height: 1.2; margin-bottom: 3px;
        }
        .apt-wrap.dark .apt-pkg-title { color: #e2e8f0; }
        .apt-pkg-id {
          font-size: 10px; font-weight: 400; color: #9ab8b5;
          font-family: monospace; letter-spacing: 0.02em;
        }
        .apt-wrap.dark .apt-pkg-id { color: #64748b; }

        /* Type badge */
        .apt-type-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 100px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        /* Days badge */
        .apt-days-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 100px;
          background: rgba(0,176,165,0.08);
          border: 1px solid rgba(0,176,165,0.2);
          font-size: 11px; font-weight: 700; color: #00b0a5;
        }

        /* Destinations count */
        .apt-dest-count {
          font-size: 12px; font-weight: 600; color: #5a8080;
        }
        .apt-wrap.dark .apt-dest-count { color: #cbd5e1; }
        .apt-dest-names {
          font-size: 11px; font-weight: 300; color: #9ab8b5;
          margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 180px;
        }
        .apt-wrap.dark .apt-dest-names { color: #94a3b8; }

        /* Actions */
        .apt-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .apt-availability-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 7px 12px; border-radius: 8px;
          background: rgba(0,176,165,0.08);
          border: 1px solid rgba(0,176,165,0.2);
          color: #00b0a5; font-size: 11px; font-weight: 800;
          letter-spacing: 0.05em; text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .apt-availability-btn:hover { background: #00b0a5; color: #fff; border-color: #00b0a5; }
        .apt-availability-btn.unavailable {
          background: rgba(204,51,68,0.06);
          border-color: rgba(204,51,68,0.2);
          color: #cc3344;
        }
        .apt-availability-btn.unavailable:hover { background: #cc3344; color: #fff; border-color: #cc3344; }
        .apt-edit-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          background: rgba(0,176,165,0.08);
          border: 1px solid rgba(0,176,165,0.2);
          color: #00b0a5; font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .apt-edit-btn:hover { background: #00b0a5; color: #fff; border-color: #00b0a5; }
        .apt-del-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          background: rgba(204,51,68,0.06);
          border: 1px solid rgba(204,51,68,0.2);
          color: #cc3344; font-size: 11px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .apt-del-btn:hover { background: #cc3344; color: #fff; border-color: #cc3344; }

        /* Mobile: card layout */
        @media(max-width:900px){
          .apt-table thead { display: none; }
          .apt-row { display: flex; flex-direction: column; padding: 16px 18px; gap: 12px; }
          .apt-td { padding: 0; }
          .apt-actions { justify-content: flex-start; }
        }
      `}</style>

      <div className={`apt-wrap ${dark ? 'dark' : ''}`}>
        <div className="apt-heading">All Packages</div>
        <div className="apt-card">
          <table className="apt-table">
            <thead>
              <tr>
                <th className="apt-th">Package</th>
                <th className="apt-th">Type</th>
                <th className="apt-th">Duration</th>
                <th className="apt-th">Destinations</th>
                <th className="apt-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => {
                const tc = TYPE_COLORS[pkg.type] || TYPE_COLORS['Beach Side'];
                const destNames = pkg.destinations.map(d => d.name).filter(Boolean).join(', ');
                const isAvailable = pkg.availability?.status !== 'UNAVAILABLE';
                return (
                  <tr key={pkg.id} className="apt-row">
                    {/* Package identity */}
                    <td className="apt-td">
                      <div className="apt-pkg-cell">
                        {pkg.image
                          ? <img src={pkg.image} alt={pkg.title} className="apt-pkg-thumb" />
                          : <div className="apt-pkg-thumb-placeholder">{TYPE_ICONS[pkg.type]}</div>
                        }
                        <div>
                          <div className="apt-pkg-title">{pkg.title}</div>
                          <div className="apt-pkg-id">{pkg.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="apt-td">
                      <span className="apt-type-badge" style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {TYPE_ICONS[pkg.type]} {pkg.type}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="apt-td">
                      <span className="apt-days-badge">
                        📅 {pkg.days} Days
                      </span>
                    </td>

                    {/* Destinations */}
                    <td className="apt-td">
                      <div className="apt-dest-count">{pkg.destinations.length} stops</div>
                      <div className="apt-dest-names">{destNames}</div>
                    </td>

                    {/* Actions */}
                    <td className="apt-td">
                      <div className="apt-actions">
                        <button
                          type="button"
                          className={`apt-availability-btn ${isAvailable ? '' : 'unavailable'}`}
                          onClick={() => setAvailabilityPackage(pkg)}
                          title="Manage availability"
                        >
                          <CalendarDays size={13} />
                          {isAvailable ? 'Available' : 'Unavailable'}
                        </button>
                        <button className="apt-edit-btn" onClick={() => onEdit(pkg)}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                            <path d="M11.5 2.5a1.5 1.5 0 0 1 2 2l-9 9-3 1 1-3 9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Edit
                        </button>
                        <button className="apt-del-btn" onClick={() => onDelete(pkg)}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                            <path d="M3 4h10M6 4V3h4v1M5 4v9h6V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AdminPackageAvailabilityModal
          pkg={availabilityPackage}
          dark={dark}
          onClose={() => setAvailabilityPackage(null)}
        />
      </div>
    </>
  );
};

export default AdminPackageTable;