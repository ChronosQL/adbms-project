import { motion, AnimatePresence } from "framer-motion";
import PackageCard from "./PackageCard";
const PackageGrid = ({ packages, onShowMore }) => {
  

  const getPackageIdNumber = (pkg) => {
    const match = String(pkg?.id || '').match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const normalizePackageMetrics = (pkg) => ({
    ...pkg,
    avg_rating: Number(pkg.avg_rating) || 0,
    reviews_count: Number(pkg.reviews_count) || 0,
    bookings_count: Number(pkg.bookings_count) || 0,
  });

  const highestRated = [...packages]
    .map(normalizePackageMetrics)
    .sort((a, b) => {
      if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
      if (b.reviews_count !== a.reviews_count) return b.reviews_count - a.reviews_count;
      return getPackageIdNumber(b) - getPackageIdNumber(a);
    });

  const mostBooked = [...packages]
    .map(normalizePackageMetrics)
    .sort((a, b) => {
      if (b.bookings_count !== a.bookings_count) return b.bookings_count - a.bookings_count;
      if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
      return getPackageIdNumber(b) - getPackageIdNumber(a);
    });

  const newest = [...packages]
    .map(normalizePackageMetrics)
    .sort((a, b) => getPackageIdNumber(b) - getPackageIdNumber(a));

  const seen = new Set();
  const sectionSize = Math.max(1, Math.ceil(packages.length / 3));

  const sortedPackages = [
    { items: highestRated.slice(0, sectionSize) },
    { items: mostBooked.slice(0, sectionSize) },
    { items: newest },
  ]
    .flatMap((section) => section.items)
    .filter((pkg) => {
      const key = String(pkg.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (packages.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '80px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
      }}>
        <div style={{ fontSize: '48px' }}>🔍</div>
        <h3 style={{
          fontSize: '1.4rem', fontWeight: 800,
          color: '#0d2b2b', letterSpacing: '-0.02em'
        }}>
          {"No packages found"}
        </h3>
        <p style={{ fontSize: '15px', fontWeight: 300, color: '#5a8080', maxWidth: '320px' }}>
          {"Try adjusting your filters to discover more Sri Lanka experiences."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .pkg-grid-wrap {
          max-width: 1280px; margin: 0 auto;
          padding: 48px 32px 80px;
        }
        @media(max-width:768px){ .pkg-grid-wrap { padding: 32px 16px 60px; } }

        .pkg-section {
          margin-bottom: 36px;
        }

        .pkg-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .pkg-section-title {
          font-size: 1.1rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #0d2b2b;
        }

        .pkg-section-label {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(0,176,165,0.08);
          color: #EF8354;
          border: 1px solid rgba(0,176,165,0.16);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .pkg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 28px;
        }
      `}</style>

      <div className="pkg-grid-wrap">
        <div className="pkg-grid">
          <AnimatePresence mode="popLayout">
            {sortedPackages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22,1,0.36,1] }}
              >
                <PackageCard pkg={pkg} onShowMore={onShowMore} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PackageGrid;
