import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
const Point = () => {
  
  const cardRef = useRef(null);
  useEffect(() => {
    const c = cardRef.current; if (!c) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) c.classList.add('ptp-visible'); },
      { threshold: 0.12 }
    );
    obs.observe(c); return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        /* ── Premium image system ── */
        .ptp-img-wrap {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 4/3;
          box-shadow:
            0 32px 64px -16px rgba(0,60,50,0.30),
            0 0 0 1px rgba(0,176,165,0.18),
            inset 0 0 0 1px rgba(255,255,255,0.06);
        }
        .ptp-img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transform: scale(1.04);
          transition: transform 1.1s cubic-bezier(0.22,1,0.36,1);
        }
        .ptp-img-wrap:hover .ptp-img { transform: scale(1.10); }
        .ptp-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(
            160deg,
            rgba(0,20,18,0.18) 0%,
            rgba(0,20,18,0.08) 35%,
            rgba(0,40,36,0.55) 70%,
            rgba(0,80,72,0.72) 100%
          );
        }
        .ptp-shimmer {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; pointer-events: none;
          background: linear-gradient(90deg,
            transparent 0%, rgba(0,176,165,0.6) 30%,
            rgba(0,220,205,0.9) 50%, rgba(0,176,165,0.6) 70%, transparent 100%
          );
          animation: ptp-shimmer-anim 3s ease-in-out infinite;
        }
        @keyframes ptp-shimmer-anim {
          0%,100% { opacity: 0.5; transform: scaleX(0.8); }
          50%      { opacity: 1;   transform: scaleX(1); }
        }
        .ptp-badge {
          position: absolute; top: 16px; left: 16px; z-index: 3;
          background: rgba(0,176,165,0.92); backdrop-filter: blur(10px);
          color: #fff; font-size: 9px; font-weight: 800;
          letter-spacing: 0.22em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 4px 16px rgba(0,176,165,0.4);
        }
        .ptp-stats {
          position: absolute; bottom: 14px; left: 14px; right: 14px;
          display: flex; gap: 8px; z-index: 3;
        }
        .ptp-stat {
          flex: 1;
          background: rgba(255,255,255,0.08); backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px; padding: 9px 6px; text-align: center;
        }
        .ptp-stat-num {
          display: block; font-size: 17px; font-weight: 800;
          letter-spacing: -0.03em; color: #ffffff; line-height: 1;
          text-shadow: 0 0 12px rgba(0,220,200,0.6);
        }
        .ptp-stat-label {
          display: block; font-size: 8px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.65); margin-top: 3px;
        }

        /* ── Card ── */
        .ptp-card {
          background: linear-gradient(135deg, #f0fdfb 0%, #e6faf8 100%);
          border: 1px solid rgba(0,176,165,0.22);
          border-radius: 24px; padding: 48px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 32px rgba(0,176,165,0.10), 0 1px 4px rgba(0,0,0,0.04);
          opacity: 0; transform: translateY(40px);
          transition: opacity 0.85s cubic-bezier(0.22,1,0.36,1),
                      transform 0.85s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.3s ease;
        }
        .ptp-card.ptp-visible { opacity: 1; transform: translateY(0); }
        .ptp-card:hover {
          box-shadow: 0 16px 56px rgba(0,176,165,0.16), 0 2px 8px rgba(0,0,0,0.06);
          transform: translateY(-3px);
        }
        @media(max-width:768px){ .ptp-card { padding: 28px 20px; } }
        .ptp-orb { position: absolute; border-radius: 50%; pointer-events: none; }
        .ptp-orb-1 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(0,176,165,0.10) 0%, transparent 70%);
          top: -80px; right: -60px;
        }
        .ptp-orb-2 {
          width: 160px; height: 160px;
          background: radial-gradient(circle, rgba(0,176,165,0.07) 0%, transparent 70%);
          bottom: -40px; left: 38%;
        }
        .ptp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 52px; align-items: center; position: relative; z-index: 1;
        }
        .ptp-content { display: flex; flex-direction: column; gap: 20px; position: relative; z-index: 1; }
        .ptp-eyebrow {
          display: inline-block; padding: 5px 16px;
          background: rgba(0,176,165,0.12); border: 1px solid rgba(0,176,165,0.38);
          border-radius: 100px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #EF8354; width: fit-content;
        }
        .ptp-title {
          font-size: clamp(2.4rem, 4.5vw, 3.2rem);
          font-weight: 800; color: #0d2b2b;
          line-height: 1.05; letter-spacing: -0.03em;
        }
        .ptp-title .teal { color: #EF8354; }
        .ptp-rule {
          width: 44px; height: 2px;
          background: linear-gradient(90deg, #EF8354, rgba(0,176,165,0));
          border-radius: 2px;
        }
        .ptp-desc { font-size: 16px; font-weight: 300; color: #3a5a5a; line-height: 1.82; max-width: 440px; }
        .ptp-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .ptp-feature { display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 400; color: #3a5a5a; }
        .ptp-icon-box {
          width: 30px; height: 30px;
          background: rgba(0,176,165,0.12); border: 1px solid rgba(0,176,165,0.28);
          border-radius: 8px; display: flex; align-items: center;
          justify-content: center; font-size: 13px; flex-shrink: 0;
        }
        .ptp-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: #EF8354; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 14px 28px; border-radius: 10px; border: none;
          cursor: pointer; text-decoration: none; width: fit-content;
          box-shadow: 0 6px 24px -4px rgba(0,176,165,0.45);
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .ptp-btn:hover { background: #4F5D75; transform: translateY(-2px); box-shadow: 0 14px 36px -4px rgba(0,176,165,0.5); }
        .ptp-arrow { transition: transform 0.25s ease; }
        .ptp-btn:hover .ptp-arrow { transform: translateX(4px); }
      `}</style>

      <div ref={cardRef} className="ptp-card">
        <div className="ptp-orb ptp-orb-1" />
        <div className="ptp-orb ptp-orb-2" />

        <div className="ptp-grid">

          {/* Image */}
          <div className="ptp-img-wrap">
            <span className="ptp-badge">{"One Directional"}</span>
            <img className="ptp-img"
              src="https://images.unsplash.com/photo-1640282693834-f941c0c012aa?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Point to Point"
            />
            <div className="ptp-overlay" />
            <div className="ptp-shimmer" />
            <div className="ptp-stats">
              {[
  [
    "24/7",
    "Available"
  ],
  [
    "50+",
    "Destinations"
  ],
  [
    "4.9★",
    "Rated"
  ]
].map(([n, l]) => (
                <div key={l} className="ptp-stat">
                  <span className="ptp-stat-num">{n}</span>
                  <span className="ptp-stat-label">{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="ptp-content">
            <span className="ptp-eyebrow">{"Seamless Transfers"}</span>
            <h2 className="ptp-title">{"Point to"} <span className="teal">{"Point."}</span></h2>
            <div className="ptp-rule" />
            <p className="ptp-desc">
              {"Reliable transfers between any two locations in Sri Lanka. Professional drivers and air-conditioned vehicles waiting just for you."}
            </p>
            {/* <ul className="ptp-features">
              {[
                { icon: '🛡', text: 'Vetted, professional drivers' },
                { icon: '❄️', text: 'Air-conditioned fleet' },
                { icon: '📍', text: 'Door-to-door service' },
              ].map(f => (
                <li key={f.text} className="ptp-feature">
                  <span className="ptp-icon-box">{f.icon}</span>
                  {f.text}
                </li>
              ))}
            </ul> */}
            <div className="cst-steps">
              {[
  "Set Locations",
  "Instant Bookings",
  "We Drive You"
].map((s, i, arr) => (
                <div key={s} className="cst-step">
                  {i < arr.length - 1 && <div className="cst-step-line" />}
                  <div className="cst-step-num">{i + 1}</div>
                  <div className="cst-step-label">{s}</div>
                </div>
              ))}
            </div>
            <Link to="/tour-booking/point" className="ptp-btn">
              <span>{"Book a Transfer"}</span>
              <svg className="ptp-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default Point;
