import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import { buildApiUrl } from '../../../../../config/api';
import PackageCard from './PackageCard';
import LocationWeather from "./LocationWeather";

const TYPE_ICONS = {
  'Beach Side':          '🏖️',
  'Hill Country':        '🏔️',
  'Safari':              '🐘',
  'Cultural Heritage':   '🏛️',
  'Adventure':           '🧗',
  'Wellness & Ayurveda': '🌿',
};

const PackageDetailModal = ({ pkg, onClose, onShowMore }) => {

  const [recommendations, setRecommendations] = useState(null);
  const [activeRecTab, setActiveRecTab] = useState('duration');

  const handleRecommendationShowMore = (recPkg) => {
    if (!onShowMore || !recPkg?.id) return;
    try { onClose && onClose(); } catch (e) {}
    onShowMore({ id: Number(recPkg.id) || recPkg.id });
  };

  useEffect(() => {
    if (pkg?.recommendations) {
      setRecommendations(pkg.recommendations);
      return;
    }
    let cancelled = false;
    const load = async () => {
      if (!pkg?.id) return;
      try {
        const res = await fetch(buildApiUrl(`/packages/${pkg.id}/recommendations`));
        if (!cancelled && res.ok) {
          const data = await res.json();
          setRecommendations(data);
        }
      } catch (e) {}
    };
    load();
    return () => { cancelled = true; };
  }, [pkg?.id, pkg?.recommendations]);

  const destinations = Array.isArray(pkg.destinations) ? pkg.destinations : [];

  const recTabs = [
    { id: 'duration', label: '⏱ Same Duration', data: recommendations?.similarByDays },
    { id: 'type',     label: '🏷 Same Type',     data: recommendations?.similarByType },
    { id: 'rated',    label: '⭐ Top Rated',      data: recommendations?.topRated },
    { id: 'booked',   label: '🔥 Most Booked',    data: recommendations?.mostBooked },
  ].filter(t => t.data?.length > 0);

  // Whenever recommendations load, ensure the active tab is valid
  useEffect(() => {
    if (!recommendations) return;
    const tabs = [
      { id: 'duration', data: recommendations.similarByDays },
      { id: 'type',     data: recommendations.similarByType },
      { id: 'rated',    data: recommendations.topRated },
      { id: 'booked',   data: recommendations.mostBooked },
    ].filter(t => t.data?.length > 0);
    if (tabs.length === 0) return;
    // If current tab has no data, switch to first that does
    const currentValid = tabs.find(t => t.id === activeRecTab);
    if (!currentValid) setActiveRecTab(tabs[0].id);
  }, [recommendations]);

  return (
    <>
      <style>{`
        /* ─── Backdrop ─────────────────────────────── */
        .pdm-backdrop {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(4, 18, 16, 0.82);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }

        /* ─── Modal shell ──────────────────────────── */
        .pdm-modal {
          background: #ffffff;
          border-radius: 28px;
          max-width: 900px; width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 48px 96px rgba(0,60,50,0.35), 0 0 0 1px rgba(0,176,165,0.1);
          position: relative;
          scrollbar-width: thin;
          scrollbar-color: rgba(0,176,165,0.25) transparent;
        }
        .pdm-modal::-webkit-scrollbar { width: 4px; }
        .pdm-modal::-webkit-scrollbar-track { background: transparent; }
        .pdm-modal::-webkit-scrollbar-thumb { background: rgba(0,176,165,0.3); border-radius: 4px; }

        /* ─── Hero ─────────────────────────────────── */
        .pdm-hero {
          position: relative; height: 320px; flex-shrink: 0;
          border-radius: 28px 28px 0 0; overflow: hidden;
        }
        .pdm-hero img { width: 100%; height: 100%; object-fit: cover; }
        .pdm-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(170deg, rgba(0,10,8,0.15) 0%, rgba(0,40,32,0.85) 100%);
        }
        .pdm-hero-content {
          position: absolute; bottom: 28px; left: 32px; right: 90px;
        }
        .pdm-type-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 16px; border-radius: 100px;
          background: #EF8354; backdrop-filter: blur(8px);
          color: #fff; font-size: 9px; font-weight: 800;
          letter-spacing: 0.2em; text-transform: uppercase;
          margin-bottom: 10px;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .pdm-title {
          font-size: clamp(1.7rem, 3.5vw, 2.4rem);
          font-weight: 900; color: #fff;
          line-height: 1.1; letter-spacing: -0.04em;
          text-shadow: 0 2px 16px rgba(0,0,0,0.3);
        }
        .pdm-meta-row {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;
        }
        .pdm-meta-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.14); backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 100px; padding: 5px 14px;
          color: #fff; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em;
        }

        /* ─── Close btn ────────────────────────────── */
        .pdm-close {
          position: absolute; top: 18px; right: 18px; z-index: 10;
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(0,0,0,0.35); backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255,255,255,0.2);
          color: #fff; font-size: 17px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .pdm-close:hover { background: rgba(255,70,50,0.75); transform: scale(1.08); }

        /* ─── Body ─────────────────────────────────── */
        .pdm-body { padding: 32px 32px 36px; }

        /* ─── Description ──────────────────────────── */
        .pdm-desc {
          font-size: 15px; font-weight: 400; color: #4a6a6a;
          line-height: 1.85; margin-bottom: 28px;
          overflow-wrap: anywhere; word-break: break-word;
          border-left: 3px solid rgba(0,176,165,0.35);
          padding-left: 16px;
        }

        /* Highlights */
        .pdm-highlights {
          display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px;
        }
        .pdm-hl {
          padding: 5px 14px; border-radius: 100px;
          background: rgba(239, 131, 84, 0.08);
          border: 1px solid rgba(239, 131, 84, 0.25);
          font-size: 11px; font-weight: 600; color: #EF8354;
          letter-spacing: 0.06em;
        }

        /* Section heading */
        .pdm-section-heading {
          font-size: 14px; font-weight: 900;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: #EF8354; margin-bottom: 18px;
          display: flex; align-items: center; gap: 12px;
        }
        .pdm-section-heading::after {
          content: ''; flex: 1; height: 1.5px;
          background: linear-gradient(90deg, rgba(0,176,165,0.3), transparent);
        }

        /* ─── Destination cards ─────────────────────── */
        .pdm-dest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 18px; margin-bottom: 36px;
        }
        .pdm-dest-card {
          border-radius: 20px; overflow: hidden;
          border: 1px solid rgba(0,176,165,0.12);
          box-shadow: 0 4px 20px rgba(0,60,50,0.07);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: #fff;
        }
        .pdm-dest-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,60,50,0.14);
        }
        .pdm-dest-img {
          position: relative; height: 150px; overflow: hidden;
        }
        .pdm-dest-img img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.6s ease;
        }
        .pdm-dest-card:hover .pdm-dest-img img { transform: scale(1.08); }
        .pdm-dest-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(0,28,22,0.55) 100%);
        }
        .pdm-dest-days {
          position: absolute; bottom: 12px; right: 12px;
          background: linear-gradient(135deg, #00b0a5, #007a72);
          color: #fff; font-size: 10px; font-weight: 800;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 5px 12px; border-radius: 100px;
          box-shadow: 0 4px 12px rgba(0,176,165,0.4);
          border: 1.5px solid rgba(255,255,255,0.25);
        }
        .pdm-dest-num {
          position: absolute; top: 12px; left: 12px;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
          border: 1.5px solid rgba(255,255,255,0.3);
          color: #fff; font-size: 11px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }
        .pdm-dest-info { padding: 16px; background: #fff; }
        .pdm-dest-name {
          font-size: 14px; font-weight: 800;
          color: #0d2b2b; letter-spacing: -0.02em; margin-bottom: 6px;
          overflow-wrap: anywhere; word-break: break-word;
        }
        .pdm-dest-desc {
          font-size: 12px; font-weight: 400;
          color: #6a9090; line-height: 1.65; margin-bottom: 12px;
        }

        /* ─── Activities ────────────────────────────── */
        .pdm-activities {
          border-top: 1px dashed rgba(0,176,165,0.2);
          padding: 12px 0 0 0; margin-top: 10px;
        }
        .pdm-activities-label {
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: #EF8354; margin-bottom: 8px;
          display: block;
        }
        .pdm-activity-item {
          margin-bottom: 10px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,176,165,0.07);
          display: flex; gap: 10px; align-items: flex-start;
        }
        .pdm-activity-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .pdm-activity-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00b0a5; flex-shrink: 0; margin-top: 5px;
        }
        .pdm-activity-name {
          font-size: 12px; font-weight: 700;
          color: #0d2b2b; margin-bottom: 2px;
        }
        .pdm-activity-phone {
          font-size: 10px; color: #7a9a9a;
          display: flex; gap: 4px; align-items: center; margin-bottom: 3px;
        }
        .pdm-activity-desc {
          font-size: 11px; font-weight: 400;
          color: #6a9090; line-height: 1.5;
        }

        /* ─── CTA ───────────────────────────────────── */
        .pdm-cta {
          display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
          padding: 20px; margin: 0 -32px -36px -32px;
          background: linear-gradient(180deg, rgba(0,176,165,0.03) 0%, rgba(0,176,165,0.07) 100%);
          border-top: 1px solid rgba(0,176,165,0.12);
          border-radius: 0 0 28px 28px;
        }
        .pdm-book-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: #EF8354; color: #fff;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 15px 30px; border-radius: 14px;
          text-decoration: none;
          box-shadow: 0 8px 28px -4px rgba(239, 131, 84, 0.45);
          transition: all 0.25s ease;
        }
        .pdm-book-btn:hover { background: #4F5D75; transform: translateY(-2px); }
        .pdm-close-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: #2D3142;
          font-size: 13px; font-weight: 700;
          padding: 15px 22px; border-radius: 14px;
          border: 1.5px solid rgba(239, 131, 84, 0.25);
          cursor: pointer; transition: all 0.2s ease;
        }
        .pdm-close-btn:hover { border-color: #EF8354; color: #EF8354; background: rgba(239, 131, 84, 0.08); }

        /* ─── Recommendations ───────────────────────── */
        .pdm-rec-panel {
          margin-top: 4px; padding: 24px;
          background: #fafafa;
          border: 1.5px solid rgba(239, 131, 84, 0.15);
          border-radius: 22px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.05);
        }
        .pdm-rec-tab-row {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .pdm-rec-tab {
          padding: 7px 16px; border-radius: 100px;
          font-size: 11px; font-weight: 700;
          border: 1.5px solid rgba(239, 131, 84, 0.2);
          background: transparent; color: #4F5D75;
          cursor: pointer; transition: all 0.2s;
          letter-spacing: 0.04em;
        }
        .pdm-rec-tab:hover { border-color: #EF8354; color: #EF8354; background: rgba(239, 131, 84, 0.05); }
        .pdm-rec-tab.active {
          background: #EF8354;
          border-color: transparent; color: #fff;
          box-shadow: 0 4px 14px rgba(239, 131, 84, 0.35);
        }
        .pdm-rec-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px; border-radius: 999px;
          background: rgba(239, 131, 84, 0.08);
          color: #EF8354; font-size: 10px; font-weight: 800;
          letter-spacing: 0.08em; text-transform: uppercase;
          border: 1px solid rgba(239, 131, 84, 0.2);
        }
        .pdm-rec-scroll {
          display: flex; gap: 14px;
          overflow-x: auto; padding-bottom: 8px;
          scrollbar-width: thin; scrollbar-color: rgba(0,176,165,0.2) transparent;
        }
        .pdm-rec-scroll::-webkit-scrollbar { height: 3px; }
        .pdm-rec-scroll::-webkit-scrollbar-thumb { background: rgba(0,176,165,0.25); border-radius: 3px; }
        .pdm-rec-item {
          flex: 0 0 auto; min-width: 230px;
          transition: transform 0.22s ease;
        }
        .pdm-rec-item .pkc-card {
          transform: scale(0.92);
          transform-origin: top center;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .pdm-rec-item:hover .pkc-card {
          transform: scale(1);
          box-shadow: 0 18px 48px rgba(0,60,50,0.16);
          border-color: rgba(0,176,165,0.22);
        }

        /* ─── Rating stars ──────────────────────────── */
        .pdm-stars { display: flex; gap: 3px; align-items: center; }
        .pdm-star { font-size: 13px; }

        @media (max-width: 640px) {
          .pdm-hero { height: 240px; }
          .pdm-body { padding: 20px 18px 24px; }
          .pdm-cta { margin: 0 -18px -24px -18px; padding: 16px 18px; }
          .pdm-dest-grid { grid-template-columns: 1fr; }
          .pdm-guide-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <AnimatePresence>
        <motion.div
          className="pdm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="pdm-modal"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.38, ease: [0.22,1,0.36,1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* ─── Hero ─── */}
            <div className="pdm-hero">
              <img src={pkg.image} alt={pkg.title} />
              <div className="pdm-hero-overlay" />
              <button className="pdm-close" onClick={onClose}>✕</button>
              <div className="pdm-hero-content">
                <div className="pdm-type-badge">
                  {TYPE_ICONS[pkg.type]} {pkg.type}
                </div>
                <div className="pdm-title">{pkg.title}</div>
                <div className="pdm-meta-row">
                  <div className="pdm-meta-chip">📅 {pkg.days} Days</div>
                  <div className="pdm-meta-chip">📍 {destinations.length} Destinations</div>
                  {pkg.avg_rating > 0 && (
                    <div className="pdm-meta-chip">⭐ {Number(pkg.avg_rating).toFixed(1)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Body ─── */}
            <div className="pdm-body">
              {pkg.description && (
                <p className="pdm-desc">{pkg.description}</p>
              )}

              {/* ─── Destinations ─── */}
              <div className="pdm-section-heading">Destinations &amp; Itinerary</div>
              <div className="pdm-dest-grid">
                {destinations.map((dest, i) => {
                  const activities = Array.isArray(dest.activities) ? dest.activities : [];
                  const stayDays = dest.days || dest.dayNumber || 1;
                  return (
                    <div key={i} className="pdm-dest-card">
                      <div className="pdm-dest-img">
                        <img src={dest.image} alt={dest.name} />
                        <div className="pdm-dest-img-overlay" />
                        <div className="pdm-dest-num">{i + 1}</div>
                        <span className="pdm-dest-days">
                          {stayDays} {stayDays === 1 ? "Day" : "Days"}
                        </span>
                      </div>
                      <div className="pdm-dest-info">
                        <div className="pdm-dest-name">
                          <span style={{color:'#EF8354', marginRight:'6px'}}>{i + 1}.</span>
                          {dest.name}
                        </div>
                        {dest.description && (
                          <div className="pdm-dest-desc">{dest.description}</div>
                        )}
                        <LocationWeather locationName={dest.name} />

                        {activities.length > 0 && (
                          <div className="pdm-activities">
                            <span className="pdm-activities-label">🗺 Activities</span>
                            {activities.map((act, ai) => (
                              <div key={ai} className="pdm-activity-item">
                                <div className="pdm-activity-dot" />
                                <div>
                                  <div className="pdm-activity-name">{act.name}</div>
                                  {act.phone && (
                                    <div className="pdm-activity-phone">
                                      <span>📞</span> {act.phone}
                                    </div>
                                  )}
                                  {act.description && (
                                    <div className="pdm-activity-desc">{act.description}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>



              {/* ─── CTA ─── */}
              <div className="pdm-cta">
                <Link
                  to={`/tour-booking/package/book?packageId=${pkg.id}&packageTitle=${encodeURIComponent(pkg.title || "Package Tour")}&packageDays=${encodeURIComponent(pkg.days || "")}`}
                  className="pdm-book-btn"
                >
                  <span>Book This Package</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <button className="pdm-close-btn" onClick={onClose}>
                  ← Back to packages
                </button>
              </div>

              {recommendations && recTabs.length > 0 && (
                <div style={{ marginTop: 36 }}>
                  <div className="pdm-section-heading">Recommended For You</div>
                  <div className="pdm-rec-panel">
                    {/* Tab bar */}
                    <div className="pdm-rec-tab-row">
                      {recTabs.map(tab => (
                        <button
                          key={tab.id}
                          className={`pdm-rec-tab${activeRecTab === tab.id ? ' active' : ''}`}
                          onClick={() => setActiveRecTab(tab.id)}
                        >
                          {tab.label}
                          <span style={{
                            marginLeft: 6,
                            fontSize: 9,
                            fontWeight: 800,
                            background: activeRecTab === tab.id ? 'rgba(255,255,255,0.25)' : 'rgba(0,176,165,0.12)',
                            color: activeRecTab === tab.id ? '#fff' : '#00b0a5',
                            borderRadius: 100,
                            padding: '1px 6px',
                          }}>{tab.data.length}</span>
                        </button>
                      ))}
                    </div>

                    {/* Cards scroll row */}
                    <AnimatePresence mode="wait">
                      {recTabs.map(tab => tab.id === activeRecTab && (
                        <motion.div
                          key={tab.id}
                          className="pdm-rec-scroll"
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.22 }}
                        >
                          {(tab.data || []).slice(0, 6).map((r, i) => (
                            <div key={`${tab.id}-${r.id}`} className="pdm-rec-item">
                              {/* Mini badge for rating or bookings */}
                              {tab.id === 'rated' && r.avg_rating > 0 && (
                                <div style={{
                                  textAlign: 'center',
                                  marginBottom: 4,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: '#00b0a5',
                                  letterSpacing: '0.04em',
                                }}>⭐ {Number(r.avg_rating).toFixed(1)} avg</div>
                              )}
                              {tab.id === 'booked' && r.bookings_count > 0 && (
                                <div style={{
                                  textAlign: 'center',
                                  marginBottom: 4,
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: '#e05c00',
                                  letterSpacing: '0.04em',
                                }}>🔥 {r.bookings_count} bookings</div>
                              )}
                              <PackageCard
                                pkg={r}
                                onShowMore={handleRecommendationShowMore}
                                index={i}
                                showBookButton={false}
                                showDestinationsAction={false}
                              />
                            </div>
                          ))}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default PackageDetailModal;
