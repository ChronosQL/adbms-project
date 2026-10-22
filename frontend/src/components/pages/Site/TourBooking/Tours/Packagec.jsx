import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
const Packagec = () => {
  
  const cardRef = useRef(null);
  useEffect(() => {
    const c = cardRef.current; if (!c) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) c.classList.add('pkg-visible'); },
      { threshold: 0.12 }
    );
    obs.observe(c); return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        /* ── Premium image system ── */
        .pkg-img-wrap {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 4/3;
          box-shadow:
            0 32px 64px -16px rgba(0,60,50,0.30),
            0 0 0 1px rgba(0,176,165,0.18),
            inset 0 0 0 1px rgba(255,255,255,0.06);
        }
        .pkg-img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          transform: scale(1.04);
          transition: transform 1.1s cubic-bezier(0.22,1,0.36,1);
        }
        .pkg-img-wrap:hover .pkg-img { transform: scale(1.10); }
        .pkg-overlay {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(
            160deg,
            rgba(0,20,18,0.18) 0%,
            rgba(0,20,18,0.08) 35%,
            rgba(0,40,36,0.55) 70%,
            rgba(0,80,72,0.72) 100%
          );
        }
        .pkg-shimmer {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; pointer-events: none;
          background: linear-gradient(90deg,
            transparent 0%, rgba(0,176,165,0.6) 30%,
            rgba(0,220,205,0.9) 50%, rgba(0,176,165,0.6) 70%, transparent 100%
          );
          animation: pkg-shimmer-anim 3s ease-in-out infinite;
        }
        @keyframes pkg-shimmer-anim {
          0%,100% { opacity: 0.5; transform: scaleX(0.8); }
          50%      { opacity: 1;   transform: scaleX(1); }
        }
        .pkg-badge {
          position: absolute; top: 16px; left: 16px; z-index: 3;
          background: rgba(0,176,165,0.92); backdrop-filter: blur(10px);
          color: #fff; font-size: 9px; font-weight: 800;
          letter-spacing: 0.22em; text-transform: uppercase;
          padding: 5px 14px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 4px 16px rgba(0,176,165,0.4);
        }
        .pkg-chip {
          position: absolute; bottom: 16px; right: 16px; z-index: 3;
          background: rgba(255,255,255,0.10); backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.22); border-radius: 12px;
          padding: 10px 14px; color: #fff;
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          display: flex; align-items: center; gap: 7px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .pkg-chip-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #EF8354; box-shadow: 0 0 6px #EF8354; flex-shrink: 0;
          animation: pkg-dot-pulse 2s ease-in-out infinite;
        }
        @keyframes pkg-dot-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.7); }
        }

        .pkg-stats {
  position: absolute; bottom: 14px; left: 14px; right: 14px;
  display: flex; gap: 8px; z-index: 3;
}
.pkg-stat {
  flex: 1;
  background: rgba(255,255,255,0.08); backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 10px; padding: 9px 6px; text-align: center;
}
.pkg-stat-num {
  display: block; font-size: 17px; font-weight: 800;
  letter-spacing: -0.03em; color: #ffffff; line-height: 1;
  text-shadow: 0 0 12px rgba(0,220,200,0.6);
}
.pkg-stat-label {
  display: block; font-size: 8px; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(255,255,255,0.65); margin-top: 3px;
}

        /* ── Card ── */
        .pkg-card {
          background: #e8faf8;
          border: 1px solid rgba(0,176,165,0.14);
          border-radius: 24px; padding: 48px;
          box-shadow: 0 4px 32px rgba(0,176,165,0.07), 0 1px 4px rgba(0,0,0,0.04);
          opacity: 0; transform: translateY(40px);
          transition: opacity 0.85s cubic-bezier(0.22,1,0.36,1),
                      transform 0.85s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.3s ease;
        }
        .pkg-card.pkg-visible { opacity: 1; transform: translateY(0); }
        .pkg-card:hover {
          box-shadow: 0 16px 56px rgba(0,176,165,0.13), 0 2px 8px rgba(0,0,0,0.06);
          transform: translateY(-3px);
        }
        @media(max-width:768px){ .pkg-card { padding: 28px 20px; } }
        .pkg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 52px; align-items: center;
        }
        .pkg-content { display: flex; flex-direction: column; gap: 20px; }
        .pkg-eyebrow {
          display: inline-block; padding: 5px 16px;
          background: rgba(0,176,165,0.10); border: 1px solid rgba(0,176,165,0.35);
          border-radius: 100px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #EF8354; width: fit-content;
        }
        .pkg-title {
          font-size: clamp(2.4rem, 4.5vw, 3.2rem);
          font-weight: 800; color: #0d2b2b;
          line-height: 1.05; letter-spacing: -0.03em;
        }
        .pkg-title .teal { color: #EF8354; }
        .pkg-rule {
          width: 44px; height: 2px;
          background: linear-gradient(90deg, #EF8354, rgba(0,176,165,0));
          border-radius: 2px;
        }
        .pkg-desc { font-size: 16px; font-weight: 300; color: #3a5a5a; line-height: 1.82; max-width: 440px; }
        .pkg-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .pkg-feature { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 400; color: #3a5a5a; }
        .pkg-dot { width: 6px; height: 6px; background: #EF8354; border-radius: 50%; flex-shrink: 0; }
        .pkg-btn {
          display: inline-flex; align-items: center; gap: 10px;
          background: #EF8354; color: #fff; font-size: 13px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 14px 28px; border-radius: 10px; border: none;
          cursor: pointer; text-decoration: none; width: fit-content;
          box-shadow: 0 6px 24px -4px rgba(0,176,165,0.45);
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .pkg-btn:hover { background: #4F5D75; transform: translateY(-2px); box-shadow: 0 14px 36px -4px rgba(0,176,165,0.5); }
        .pkg-arrow { transition: transform 0.25s ease; }
        .pkg-btn:hover .pkg-arrow { transform: translateX(4px); }
      `}</style>

      <div ref={cardRef} className="pkg-card">
        <div className="pkg-grid">

          {/* Image */}
          {/* <div className="pkg-img-wrap">
            <span className="pkg-badge">Tour Packages</span>
            <img className="pkg-img"
              src="https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&q=80&w=900"
              alt="Tour Packages"
            />
            <div className="pkg-overlay" />
            <div className="pkg-shimmer" />
            <div className="pkg-chip">
              <span className="pkg-chip-dot" />
              12 Curated Itineraries
            </div>
          </div> */}

          <div className="pkg-img-wrap">
  <span className="pkg-badge">{"Tour Packages"}</span>
  <img className="pkg-img"
    src="https://images.unsplash.com/photo-1701857438297-a162c2584739?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    alt="Tour Packages"
  />
  <div className="pkg-overlay" />
  <div className="pkg-shimmer" />
  <div className="pkg-stats">
    {[
  [
    "12+",
    "Packages"
  ],
  [
    "5★",
    "Top Rated"
  ],
  [
    "100%",
    "Guided"
  ]
].map(([n, l]) => (
      <div key={l} className="pkg-stat">
        <span className="pkg-stat-num">{n}</span>
        <span className="pkg-stat-label">{l}</span>
      </div>
    ))}
  </div>
</div>

          {/* Content */}
          <div className="pkg-content">
            <span className="pkg-eyebrow">{"Handpicked Journeys"}</span>
            <h2 className="pkg-title">{"Tour"} <span className="teal">{"Packages."}</span></h2>
            <div className="pkg-rule" />
            <p className="pkg-desc">
              {"Choose from our expertly crafted itineraries. From the Hill Country mist to the Golden Beaches, our fixed packages offer the best value with a dedicated driver."}
            </p>
            {/* <ul className="pkg-features">
              {['Dedicated personal driver', 'All-inclusive pricing', 'Flexible departure times'].map(f => (
                <li key={f} className="pkg-feature"><span className="pkg-dot" />{f}</li>
              ))}
            </ul> */}
             <div className="cst-steps">
              {[
  "Pick a Package",
  "Set Dates",
  "Start Itinerary"
].map((s, i, arr) => (
                <div key={s} className="cst-step">
                  {i < arr.length - 1 && <div className="cst-step-line" />}
                  <div className="cst-step-num">{i + 1}</div>
                  <div className="cst-step-label">{s}</div>
                </div>
              ))}
            </div>
            <Link to="/tour-booking/package" className="pkg-btn">
              <span>{"Explore Packages"}</span>
              <svg className="pkg-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default Packagec;
