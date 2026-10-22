import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCountryFlag } from './countryFlags';
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};



const StarRow = ({ stars }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width="14" height="14" viewBox="0 0 18 18"
        fill={i <= stars ? '#EF8354' : 'none'}
        stroke={i <= stars ? '#EF8354' : '#c0d8d5'}
        strokeWidth="1.5"
      >
        <path d="M9 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L9 12.1l-4.2 2.4.8-4.7-3.4-3.3 4.7-.7L9 1.5z"/>
      </svg>
    ))}
  </div>
);

// ── Image lightbox ───────────────────────────────────────────
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,15,12,0.92)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
        style={{ position: 'relative', maxWidth: '860px', width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <img
          src={images[idx]}
          alt=""
          style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '16px' }}
        />
        {/* Controls */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '-48px', right: 0,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '50%', width: '36px', height: '36px',
          color: '#fff', fontSize: '16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((idx - 1 + images.length) % images.length)}
              style={{
                position: 'absolute', left: '-48px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%', width: '40px', height: '40px',
                color: '#fff', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>←</button>
            <button
              onClick={() => setIdx((idx + 1) % images.length)}
              style={{
                position: 'absolute', right: '-48px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%', width: '40px', height: '40px',
                color: '#fff', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>→</button>
          </>
        )}
        <div style={{
          textAlign: 'center', color: 'rgba(255,255,255,0.5)',
          fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em',
          marginTop: '14px',
        }}>
          {idx + 1} / {images.length}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main card ────────────────────────────────────────────────
const ReviewCard = ({ review, index = 0 }) => {
  
  const cardRef = useRef(null);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [expandedComment, setExpandedComment] = useState(false);

  useEffect(() => {
    const el = cardRef.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add('rvc-visible'); },
      { threshold: 0.08 }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .rvc-card {
          background: #fff;
          border: 1px solid rgba(0,176,165,0.10);
          border-radius: 20px;
          padding: 28px;
          opacity: 0; transform: translateY(28px);
          transition:
            opacity 0.7s cubic-bezier(0.22,1,0.36,1),
            transform 0.7s cubic-bezier(0.22,1,0.36,1),
            box-shadow 0.3s ease;
          box-shadow: 0 2px 16px rgba(0,60,50,0.05);
          display: flex; flex-direction: column; gap: 18px;
        }
        .rvc-card.rvc-visible { opacity: 1; transform: translateY(0); }
        .rvc-card:hover {
          box-shadow: 0 12px 40px rgba(0,60,50,0.11);
          transform: translateY(-2px);
        }

        /* Header */
        .rvc-header { display: flex; align-items: flex-start; gap: 14px; }
        .rvc-avatar {
          width: 50px; height: 50px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          border: 2px solid rgba(0,176,165,0.25);
          box-shadow: 0 4px 12px rgba(0,60,50,0.12);
        }
        .rvc-avatar-placeholder {
          width: 50px; height: 50px; border-radius: 50%;
          background: linear-gradient(135deg, #EF8354, #4F5D75);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 18px; font-weight: 800;
          flex-shrink: 0; border: 2px solid rgba(0,176,165,0.25);
        }
        .rvc-user-info { flex: 1; min-width: 0; }
        .rvc-name {
          font-size: 14px; font-weight: 800;
          color: #0d2b2b; letter-spacing: -0.01em;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .rvc-meta {
          display: flex; align-items: center; gap: 8px;
          flex-wrap: wrap; margin-top: 3px;
        }
        .rvc-country {
          font-size: 11px; font-weight: 400; color: #5a8080;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .rvc-dot { width: 3px; height: 3px; border-radius: 50%; background: #c0d8d5; }
        .rvc-date {
          font-size: 11px; font-weight: 400; color: #7a9a9a;
        }
        .rvc-driver {
          margin-top: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #3a5a5a;
        }
        /* Stars + title */
        .rvc-rating { display: flex; flex-direction: column; gap: 6px; }
        .rvc-title {
          font-size: 1rem; font-weight: 800;
          color: #0d2b2b; letter-spacing: -0.02em;
          line-height: 1.25;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        /* Comment */
        .rvc-comment-container { display: flex; flex-direction: column; gap: 8px; }
        .rvc-comment {
          font-size: 13.5px; font-weight: 300;
          color: #4a7070; line-height: 1.78;
          position: relative;
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: normal;
        }
        .rvc-quote-mark {
          font-size: 48px; font-weight: 800;
          color: rgba(0,176,165,0.12); line-height: 0;
          position: absolute; top: 16px; left: -8px;
        }
        .rvc-see-more-btn {
          align-self: flex-start;
          background: none;
          border: none;
          color: #EF8354;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s ease;
        }
        .rvc-see-more-btn:hover { color: #4F5D75; }

        /* Images */
        .rvc-images { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .rvc-img-thumb {
          width: 80px; height: 60px; border-radius: 10px;
          object-fit: cover; cursor: pointer;
          border: 1px solid rgba(0,176,165,0.12);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .rvc-img-thumb:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 18px rgba(0,60,50,0.15);
        }
        .rvc-image-expand-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 60px;
          border-radius: 10px;
          border: 1.5px solid rgba(0,176,165,0.25);
          background: rgba(0,176,165,0.08);
          color: #EF8354;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .rvc-image-expand-btn:hover {
          background: rgba(0,176,165,0.15);
          border-color: #EF8354;
          transform: scale(1.05);
        }

        /* Rule */
        .rvc-rule {
          height: 1px;
          background: linear-gradient(90deg, rgba(0,176,165,0.15), transparent);
        }
      `}</style>

      <div
        ref={cardRef}
        className="rvc-card"
        style={{ transitionDelay: `${(index % 3) * 80}ms` }}
      >
        {/* Header */}
        <div className="rvc-header">
          {review.user.avatar
            ? <img src={review.user.avatar} alt={review.user.name} className="rvc-avatar" />
            : <div className="rvc-avatar-placeholder">{review.user.name[0]}</div>
          }
          <div className="rvc-user-info">
            <div className="rvc-name">{review.user.name}</div>
            <div className="rvc-meta">
              <span className="rvc-country">{getCountryFlag(review.user.country || review.user.countryFlag)} {review.user.country}</span>
              <span className="rvc-dot" />
              <span className="rvc-date">{formatDate(review.datePublished)}</span>
            </div>
            {review.driverName && (
              <div className="rvc-driver">{"Driver:"} {review.driverName}</div>
            )}
          </div>
        </div>

        {/* Stars + title */}
        <div className="rvc-rating">
          <StarRow stars={review.stars} />
          <div className="rvc-title">{review.title}</div>
        </div>

        <div className="rvc-rule" />

        {/* Comment */}
        <div className="rvc-comment-container">
          <div className="rvc-comment">
            <span className="rvc-quote-mark">"</span>
            <span style={{ paddingLeft: '4px' }}>
              {expandedComment
                ? review.comment
                : review.comment.length > 200
                ? review.comment.substring(0, 200) + '...'
                : review.comment}
            </span>
          </div>
          {review.comment.length > 200 && (
            <button
              className="rvc-see-more-btn"
              onClick={() => setExpandedComment(!expandedComment)}
            >
              {expandedComment ? "← See Less" : "See More →"}
            </button>
          )}
        </div>

        {/* Images */}
        {review.images?.length > 0 && (
          <div className="rvc-images">
            {review.images.slice(0, 4).map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Review photo ${i + 1}`}
                className="rvc-img-thumb"
                onClick={() => setLightboxIdx(i)}
              />
            ))}
            {review.images.length > 4 && (
              <button
                className="rvc-image-expand-btn"
                onClick={() => setLightboxIdx(4)}
              >
                +{review.images.length - 4}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            images={review.images}
            startIndex={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ReviewCard;
