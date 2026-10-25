import { useEffect, useState } from "react";
import Hero       from "./Hero";
import PackageFilters    from "./PackageFilters";
import PackageGrid       from "./PackageGrid";
import PackageDetailModal from "./PackageDetailModal";
import Pagination from "../../../../common/Pagination";
import { buildApiUrl } from '../../../../../config/api';

const Package = () => {
  const [activeType, setActiveType] = useState('All');
  const [activeDays, setActiveDays] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handlePackagesChanged = () => {
      setDataVersion((version) => version + 1);
    };
    window.addEventListener('sl-admin-packages-changed', handlePackagesChanged);
    window.addEventListener('storage', handlePackagesChanged);

    return () => {
      window.removeEventListener('sl-admin-packages-changed', handlePackagesChanged);
      window.removeEventListener('storage', handlePackagesChanged);
    };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeType && activeType !== 'All') params.set('type', activeType);
        if (activeDays && activeDays !== 'All') params.set('days', String(activeDays));
        params.set('page', String(currentPage));
        params.set('limit', '9');
        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(buildApiUrl(`/packages${query}`));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPackages(data);
            setPagination(data.pagination || null);
          } else {
            setPackages(data.packages || []);
            setPagination(data.pagination || null);
          }
        }
      } catch (e) {
        console.error('Failed to load packages', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeType, activeDays, currentPage, dataVersion]);

  // Reset page when filter changes
  const handleTypeChange = (type) => {
    setActiveType(type);
    setCurrentPage(1);
  };

  const handleDaysChange = (days) => {
    setActiveDays(days);
    setCurrentPage(1);
  };

  const handleShowMore = async (pkg) => {
    try {
      const res = await fetch(buildApiUrl(`/packages/${pkg.id}`));
      if (res.ok) {
        const data = await res.json();
        // fetch recommendations
        let recs = null;
        try {
          const r = await fetch(buildApiUrl(`/packages/${pkg.id}/recommendations`));
          if (r.ok) recs = await r.json();
        } catch (err) { /* ignore */ }

        setSelectedPkg({
          ...data,
          highlights: data.highlights || [],
          recommendations: recs,
        });
        return;
      }
    } catch (error) {
      console.error('Failed to load package detail', error);
    }

    setSelectedPkg({
      ...pkg,
      highlights: pkg.highlights || [],
      destinations: pkg.destinations || [],
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7fffe' }}>

      {/* Hero */}
      <Hero />

      {/* Sticky filter bar */}
      <PackageFilters
        activeType={activeType}
        activeDays={activeDays}
        onTypeChange={handleTypeChange}
        onDaysChange={handleDaysChange}
        total={pagination?.totalItems ?? packages.length}
      />

      {/* Package grid */}
      <PackageGrid
        packages={packages}
        onShowMore={handleShowMore}
      />

      {/* Server-side Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <Pagination
            pagination={pagination}
            onPageChange={(p) => setCurrentPage(p)}
            scrollToRef={true}
          />
        </div>
      )}

      {/* Detail modal */}
      {selectedPkg && (
        <PackageDetailModal
          pkg={selectedPkg}
          onClose={() => setSelectedPkg(null)}
          onShowMore={handleShowMore}
        />
      )}

    </div>
  );
};

export default Package;
