import { useEffect, useState } from "react";
const StarIcon = ({ fillPercent = 0, delayMs = 0 }) => (
  <span className="rs-star">
    <svg width="100%" height="100%" viewBox="0 0 18 18" fill="none" stroke="#f5b301" strokeWidth="0.50">
      <path d="M9 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L9 12.1l-4.2 2.4.8-4.7-3.4-3.3 4.7-.7L9 1.5z"/>
    </svg>
    <span
      className="rs-star-fill"
      style={{
        width: `${Math.max(0, Math.min(100, fillPercent))}%`,
        transitionDelay: `${delayMs}ms`,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 18 18" fill="#f5b301" stroke="#f5b301" strokeWidth="0.50">
        <path d="M9 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L9 12.1l-4.2 2.4.8-4.7-3.4-3.3 4.7-.7L9 1.5z"/>
      </svg>
    </span>
  </span>
);

const getAggregateStats = (reviews = []) => {
  if (!Array.isArray(reviews) || !reviews.length) {
    return { total: 0, average: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }
  const total = reviews.length;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let ratingSum = 0;
  reviews.forEach((r) => {
    const key = Number(r.stars || 0);
    if (breakdown[key] != null) {
      breakdown[key] += 1;
      ratingSum += key;
    }
  });
  return { total, average: total ? ratingSum / total : 0, breakdown };
};

const ReviewStats = ({ reviews, stats }) => {
  
  const fallback = getAggregateStats(reviews);
  const total = Number(stats?.total ?? fallback.total) || 0;
  const average = Number(stats?.avg ?? stats?.average ?? fallback.average) || 0;
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedAverage, setAnimatedAverage] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const start = performance.now();
    const duration = 1100;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(Math.round(total * eased));
      setAnimatedAverage(Number((average * eased).toFixed(1)));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    setAnimatedTotal(0);
    setAnimatedAverage(0);
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [average, total]);

  const starWidths = Array.from({ length: 5 }, (_, index) => {
    const starNumber = index + 1;
    if (animatedAverage >= starNumber) return 100;
    if (animatedAverage > index) return Math.round((animatedAverage - index) * 100);
    return 0;
  });

  return (
    <>
      <style>{`
        .rs-wrap {
          max-width: 1280px; margin: 0 auto;
          padding: 52px 32px 0;
        }
        @media(max-width:768px){ .rs-wrap { padding: 36px 16px 0; } }

        .rs-card {
          background:
            radial-gradient(circle at top left, rgba(0,176,165,0.14), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,0.98), #ffffff);
          border: 1px solid rgba(0,176,165,0.16);
          border-radius: 28px;
          padding: 40px 44px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          align-items: center;
          box-shadow: 0 18px 50px rgba(0,60,50,0.08);
        }
        @media(max-width:768px){
          .rs-card { gap: 18px; padding: 28px 20px; text-align: center; }
        }

        .rs-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
        }
        .rs-title {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #4f6f6c;
        }
        .rs-rating-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .rs-stars {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .rs-star {
          position: relative;
          display: inline-block;
          width: 80px;
          height: 80px;
          flex: 0 0 auto;
        }
        .rs-star-fill {
          position: absolute;
          inset: 0 auto 0 0;
          overflow: hidden;
          transition: width 900ms cubic-bezier(0.22,1,0.36,1);
        }
        .rs-rating-value {
          font-size: 40px;
          font-weight: 900;
          color: #0d2b2b;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .rs-rating-out-of {
          font-size: 19px;
          font-weight: 800;
          color: #4f6f6c;
        }
        .rs-based-on {
          font-size: 21px;
          font-weight: 650;
          color: #5d7776;
        }
        .rs-based-on strong {
          color: #0d2b2b;
          font-weight: 800;
        }
        .rs-fine-print {
          font-size: 12px;
          font-weight: 600;
          color: #6c8a88;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      `}</style>

      <div className="rs-wrap">
        <div className="rs-card">
          <div className="rs-header">
            {/* <div className="rs-title">{"Average rating"}</div> */}
             <div className="rs-title">RATINGS</div>
            <div className="rs-rating-row" aria-label={`${average.toFixed(1)} out of 5 stars`}>
              <div className="rs-stars" aria-hidden="true">
                {starWidths.map((fillPercent, index) => (
                  <StarIcon key={index} fillPercent={fillPercent} delayMs={index * 90} />
                ))}
              </div>
              <div className="rs-rating-value">
                {animatedAverage.toFixed(1)}<span className="rs-rating-out-of">/5</span>
              </div>
            </div>
            <div className="rs-based-on">
              {"Based on"} <strong>{animatedTotal}</strong> {"travelers"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewStats;
