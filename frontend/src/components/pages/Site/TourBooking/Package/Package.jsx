import { useEffect, useMemo, useState } from "react";
import Hero       from "./Hero";
import PackageFilters    from "./PackageFilters";
import PackageGrid       from "./PackageGrid";
import PackageDetailModal from "./PackageDetailModal";
import { buildApiUrl } from '../../../../../config/api';

const Package = () => {
  const [activeType, setActiveType] = useState('All');
  const [activeDays, setActiveDays] = useState('All');
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [packages, setPackages] = useState([]);

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
      try {
        const params = new URLSearchParams();
        if (activeType && activeType !== 'All') params.set('type', activeType);
        if (activeDays && activeDays !== 'All') params.set('days', String(activeDays));
        const query = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(buildApiUrl(`/packages${query}`));
        if (res.ok) {
          const data = await res.json();
          setPackages(Array.isArray(data) ? data : data.packages || []);
        }
      } catch (e) {
        console.error('Failed to load packages', e);
      }
    })();
  }, [dataVersion]);

  // Re-filters automatically whenever data or filters change
  // packages is provided by the server already filtered according to activeType/activeDays

  const handleTypeChange = (type) => {
    setActiveType(type);
    setDataVersion(v => v + 1); // trigger reload with new filter
  };

  const handleDaysChange = (days) => {
    setActiveDays(days);
    setDataVersion(v => v + 1); // trigger reload with new filter
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
        total={packages.length}
      />

      {/* Package grid */}
      <PackageGrid
        packages={packages}
        onShowMore={handleShowMore}
      />

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
