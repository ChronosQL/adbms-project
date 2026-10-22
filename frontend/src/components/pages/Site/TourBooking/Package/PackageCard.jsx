import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

const TYPE_COLORS = {
  'Beach Side':          '#0099cc',
  'Hill Country':        '#5c8a3c',
  'Safari':              '#cc7722',
  'Cultural Heritage':   '#8855cc',
  'Adventure':           '#cc3344',
  'Wellness & Ayurveda': '#33997a',
};

const TYPE_ICONS = {
  'Beach Side':          '🏖️',
  'Hill Country':        '🏔️',
  'Safari':              '🐘',
  'Cultural Heritage':   '🏛️',
  'Adventure':           '🧗',
  'Wellness & Ayurveda': '🌿',
};

const PackageCard = ({ pkg, onShowMore, index = 0, showBookButton = true, showDestinationsAction = true }) => {
  
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add('pkc-visible'); },
      { threshold: 0.1 }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const accentColor = TYPE_COLORS[pkg.type] || '#EF8354';
  const destinations = Array.isArray(pkg.destinations) ? pkg.destinations : [];
  const highlights = Array.isArray(pkg.highlights) ? pkg.highlights : [];
  const topDests = destinations.slice(0, 2);
  const availability = pkg.availability || {};
  const isAvailable = availability.status !== 'UNAVAILABLE';

  return (
    <>
      <style>{`
        .pkc-card {
          background: #fff;
          border: 1px solid rgba(0,176,165,0.12);
          border-radius: 20px;
          overflow: hidden;
          opacity: 0; transform: translateY(32px);
          transition:
            opacity 0.7s cubic-bezier(0.22,1,0.36,1),
            transform 0.7s cubic-bezier(0.22,1,0.36,1),
            box-shadow 0.3s ease;
          box-shadow: 0 4px 24px rgba(0,60,50,0.06);
        }
        .pkc-card.pkc-visible { opacity: 1; transform: translateY(0); }
        .pkc-card:hover {
          box-shadow: 0 16px 48px rgba(0,60,50,0.14);
          transform: translateY(-4px);
        }

        /* Image */
        .pkc-img-wrap {
          position: relative; height: 220px; overflow: hidden;
        }
        .pkc-img {
          width: 100%; height: 100%; object-fit: cover;
          transform: scale(1.04);
          transition: transform 1s cubic-bezier(0.22,1,0.36,1);
        }
        .pkc-card:hover .pkc-img { transform: scale(1.10); }
        .pkc-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            160deg,
            rgba(0,20,18,0.15) 0%,
            rgba(0,20,18,0.05) 40%,
            rgba(0,40,36,0.60) 100%
          );
        }
        .pkc-shimmer {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg,
            transparent 0%, rgba(0,176,165,0.6) 30%,
            rgba(0,220,205,0.9) 50%, rgba(0,176,165,0.6) 70%, transparent 100%
          );
          animation: pkc-sh 3s ease-in-out infinite;
        }
        @keyframes pkc-sh {
          0%,100%{ opacity:0.5; transform:scaleX(0.8); }
          50%    { opacity:1;   transform:scaleX(1); }
        }

        /* Type badge */
        .pkc-type-badge {
          position: absolute; top: 14px; left: 14px; z-index: 2;
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 100px;
          background: rgba(0,0,0,0.45); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 9px; font-weight: 800;
          letter-spacing: 0.18em; text-transform: uppercase;
        }
        .pkc-type-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        }

        /* Days badge */
        .pkc-days-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(0,176,165,0.92); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.25);
          color: #fff; font-size: 9px; font-weight: 800;
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 5px 12px; border-radius: 100px;
          box-shadow: 0 4px 12px rgba(0,176,165,0.35);
        }
        .pkc-availability-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 10px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(0,0,0,0.44); backdrop-filter: blur(10px);
          color: #fff; font-size: 9px; font-weight: 900;
          letter-spacing: 0.15em; text-transform: uppercase;
          box-shadow: 0 6px 14px rgba(0,0,0,0.18);
        }
        .pkc-availability-badge.available {
          background: rgba(16,185,129,0.92);
          box-shadow: 0 6px 14px rgba(16,185,129,0.25);
        }
        .pkc-availability-badge.unavailable {
          background: rgba(204,51,68,0.92);
          box-shadow: 0 6px 14px rgba(204,51,68,0.25);
        }
        .pkc-availability-icon {
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pkc-badge-stack {
          position: absolute; top: 14px; right: 14px; z-index: 2;
          display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
        }

        /* Destination mini-chips on image bottom */
        .pkc-dest-chips {
          position: absolute; bottom: 14px; left: 12px; right: 12px;
          display: flex; gap: 6px; flex-wrap: nowrap; overflow: hidden; z-index: 2;
          align-items: center;
          min-width: 0;
        }
        .pkc-dest-chip {
          background: rgba(255,255,255,0.12); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 10px; font-weight: 600;
          padding: 4px 10px; border-radius: 100px;
          flex: 1 1 auto;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pkc-dest-more {
          background: rgba(0,176,165,0.7); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 10px; font-weight: 700;
          padding: 4px 10px; border-radius: 100px; white-space: nowrap;
          flex: 0 0 auto;
        }

        /* Content */
        .pkc-content { padding: 20px 22px 22px; }

        .pkc-title {
          font-size: 1.25rem; font-weight: 800;
          color: #0d2b2b; letter-spacing: -0.03em;
          line-height: 1.2; margin-bottom: 8px;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .pkc-desc {
          font-size: 13.5px; font-weight: 300;
          color: #4a7070; line-height: 1.7;
          margin-bottom: 16px;
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: normal;
        }

        /* Highlights */
        .pkc-highlights {
          display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px;
        }
        .pkc-hl {
          padding: 4px 10px; border-radius: 100px;
          background: rgba(0,176,165,0.07);
          border: 1px solid rgba(0,176,165,0.18);
          font-size: 10px; font-weight: 600; color: #EF8354;
          letter-spacing: 0.04em;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        /* Rule */
        .pkc-rule {
          height: 1px; margin-bottom: 18px;
          background: linear-gradient(90deg, rgba(0,176,165,0.2), transparent);
        }

        /* Actions */
        .pkc-actions { display: flex; gap: 10px; }
        .pkc-book-btn {
          flex: 1;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: #EF8354; color: #fff;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 12px 16px; border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 16px -4px rgba(0,176,165,0.45);
          transition: all 0.25s ease;
        }
        .pkc-book-btn:hover { background: #4F5D75; transform: translateY(-1px); }
        .pkc-more-btn {
          display: inline-flex; align-items: center; justify-content: center; gap-6px;
          padding: 12px 16px; border-radius: 10px;
          border: 1.5px solid rgba(0,176,165,0.25);
          background: transparent; color: #3a5a5a;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pkc-more-btn:hover { border-color: #EF8354; color: #EF8354; background: rgba(0,176,165,0.05); }
      `}</style>

      <div
        ref={cardRef}
        className="pkc-card"
        style={{ transitionDelay: `${(index % 4) * 80}ms` }}
      >
        {/* Image */}
        <div className="pkc-img-wrap">
          <img className="pkc-img" src={pkg.image} alt={pkg.title} />
          <div className="pkc-overlay" />
          <div className="pkc-shimmer" />

          <div className="pkc-type-badge">
            <span className="pkc-type-dot" style={{ background: accentColor }} />
            {TYPE_ICONS[pkg.type]} {pkg.type}
          </div>
          <div className="pkc-badge-stack">
            <div className={`pkc-availability-badge ${isAvailable ? 'available' : 'unavailable'}`}>
              <span className="pkc-availability-icon"><CalendarDays size={11} /></span>
              <span>{isAvailable ? "Available" : "Unavailable"}</span>
            </div>
            <div className="pkc-days-badge">📅 {pkg.days} {"Days"}</div>
          </div>


          {showDestinationsAction ? (
            <button type="button" onClick={() => onShowMore?.(pkg)}>
              <div className="pkc-dest-chips">
                {topDests.map(d => (
                  <span key={d.name} className="pkc-dest-chip">{d.name}</span>
                ))}
                {(pkg.hidden_dest_count > 0 || destinations.length > 2) && (
                  <span className="pkc-dest-more">+{pkg.hidden_dest_count ?? Math.max(0, destinations.length - 2)} {"more"}</span>
                )}
              </div>
            </button>
          ) : (
            <div className="pkc-dest-chips">
              {topDests.map(d => (
                <span key={d.name} className="pkc-dest-chip">{d.name}</span>
              ))}
              {(pkg.hidden_dest_count > 0 || destinations.length > 2) && (
                <span className="pkc-dest-more">+{pkg.hidden_dest_count ?? Math.max(0, destinations.length - 2)} {"more"}</span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="pkc-content">
          <div className="pkc-title">{pkg.title}</div>
          <div className="pkc-desc">{pkg.description}</div>
{/* 
          <div className="pkc-highlights">
            {highlights.slice(0, 3).map(h => (
              <span key={h} className="pkc-hl">✦ {h}</span>
            ))}
          </div> */}

          <div className="pkc-rule" />

          <div className="pkc-actions">
            {showBookButton && (
              <Link to={`/tour-booking/package/book?packageId=${pkg.id}&packageTitle=${encodeURIComponent(pkg.title || "Package Tour")}&packageDays=${encodeURIComponent(pkg.days || "")}`} className="pkc-book-btn">
                {"Book Now"}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}
            <button type="button" className="pkc-more-btn" onClick={() => onShowMore?.(pkg)} style={showBookButton ? undefined : { width: '100%' }}>
              {"Details"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PackageCard;
