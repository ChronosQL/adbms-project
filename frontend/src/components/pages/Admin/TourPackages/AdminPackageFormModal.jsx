import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PACKAGE_TYPES, PACKAGE_DAYS, emptyPackage } from './adminPackagesData';
import { searchLocations } from '../../../../services/locationService';
import { BRAND, STATE, FONT } from '../AdminDashboard/adminTheme';

// ── Small field components ───────────────────────────────────
const Field = ({ label, error, children, dark = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: dark ? '#cbd5e1' : BRAND.payneGray,
      fontFamily: FONT.heading,
    }}>
      {label}
    </label>
    {children}
    {error && <span style={{ fontSize: '11px', color: STATE.danger, fontWeight: 600 }}>{error}</span>}
  </div>
);

const inputStyle = (error, dark = false) => ({
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1.5px solid ${error ? STATE.danger : dark ? 'rgba(255,255,255,0.15)' : BRAND.silver}`,
  background: dark ? '#1E2230' : BRAND.white,
  color: dark ? '#F5F5F6' : BRAND.gunmetal,
  fontSize: '13.5px',
  fontWeight: 400,
  outline: 'none',
  fontFamily: FONT.body,
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  width: '100%',
  boxSizing: 'border-box',
});

const taStyle = (error, dark = false) => ({
  ...inputStyle(error, dark),
  resize: 'vertical',
  minHeight: '80px',
  lineHeight: 1.6,
  fontWeight: 400,
});

// ── Destination Location Autocomplete Field ──────────────────
const DestinationLocationInput = ({ value, onChangeLocation, hasError = false, dark = false }) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChangeLocation(val, null);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const matches = await searchLocations(val);
        setResults(matches || []);
        setIsOpen((matches || []).length > 0);
      } catch (err) {
        console.warn('Failed to search locations:', err);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelect = (loc) => {
    const selectedName = loc.shortName || loc.label.split(',')[0] || loc.label;
    setQuery(selectedName);
    onChangeLocation(selectedName, { lat: loc.lat, lng: loc.lng });
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          style={{
            ...inputStyle(hasError, dark),
            paddingRight: loading ? '32px' : '14px',
          }}
          placeholder="Search destination (e.g. Galle, Kandy, Sigiriya...)"
          value={query}
          onChange={handleInputChange}
          onFocus={async () => {
            if (results.length > 0) {
              setIsOpen(true);
            } else if (query.trim()) {
              setLoading(true);
              try {
                const matches = await searchLocations(query.trim());
                setResults(matches || []);
                setIsOpen((matches || []).length > 0);
              } finally {
                setLoading(false);
              }
            }
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute', right: '10px',
            width: '14px', height: '14px',
            border: '2px solid rgba(239, 131, 84, 0.25)',
            borderTopColor: BRAND.coral,
            borderRadius: '50%',
            animation: 'apfm-spin 0.8s linear infinite',
          }} />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: '4px', zIndex: 100,
          maxHeight: '220px', overflowY: 'auto',
          background: dark ? '#242838' : '#FFFFFF',
          border: dark ? '1px solid rgba(255,255,255,0.15)' : `1px solid ${BRAND.silver}`,
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        }}>
          {results.map((loc, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(loc)}
              style={{
                padding: '9px 12px',
                cursor: 'pointer',
                borderBottom: idx < results.length - 1 ? (dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)') : 'none',
                display: 'flex', flexDirection: 'column', gap: '2px',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(239,131,84,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                fontSize: '13px', fontWeight: 600,
                color: dark ? '#f1f5f9' : BRAND.gunmetal,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{loc.label}</span>
                {loc.category && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: BRAND.coral,
                    background: 'rgba(239,131,84,0.1)',
                    padding: '1px 6px', borderRadius: '4px',
                  }}>
                    {loc.category}
                  </span>
                )}
              </div>
              {loc.lat != null && loc.lng != null && (
                <div style={{ fontSize: '11px', color: dark ? '#94a3b8' : BRAND.payneGray }}>
                  GPS: {Number(loc.lat).toFixed(4)}°, {Number(loc.lng).toFixed(4)}°
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Destination row ──────────────────────────────────────────
const DestRow = ({ dest, index, onChange, onLocationChange, onRemove, canRemove, dark = false, errors = {} }) => (
  <div style={{
    background: dark ? '#242838' : '#FAF9F8',
    border: dark ? '1px solid rgba(255,255,255,0.12)' : `1px solid ${BRAND.silver}`,
    borderRadius: '12px', padding: '16px', display:'flex', flexDirection:'column', gap:'12px',
  }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontSize:'11px', fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color: BRAND.coral, fontFamily: FONT.heading }}>
          Stop {index + 1}
        </span>
        {dest.latitude != null && dest.longitude != null && (
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            color: BRAND.coral,
            background: 'rgba(239,131,84,0.08)',
            border: '1px solid rgba(239,131,84,0.25)',
            padding: '2px 8px',
            borderRadius: '999px',
          }}>
            GPS: {Number(dest.latitude).toFixed(4)}°, {Number(dest.longitude).toFixed(4)}°
          </span>
        )}
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(index)}
          style={{
            width:'26px', height:'26px', borderRadius:'50%',
            background:'rgba(224,72,59,0.08)', border:'1px solid rgba(224,72,59,0.25)',
            color: STATE.danger, fontSize:'12px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >✕</button>
      )}
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'10px' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        <DestinationLocationInput
          value={dest.name}
          onChangeLocation={(name, coords) => onLocationChange(index, name, coords)}
          hasError={!!errors.name}
          dark={dark}
        />
        {errors.name && <span style={{ fontSize:'11px', color: STATE.danger, fontWeight:600 }}>{errors.name}</span>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <input
            type="number" min="1" max="30"
            style={{ ...inputStyle(!!errors.days, dark), width:'64px', textAlign:'center' }}
            value={dest.days}
            onChange={e => onChange(index, 'days', Number(e.target.value))}
          />
          <span style={{ fontSize:'12px', color: dark ? '#cbd5e1' : BRAND.payneGray, whiteSpace:'nowrap', fontWeight:600 }}>days</span>
        </div>
        {errors.days && <span style={{ fontSize:'11px', color: STATE.danger, fontWeight:600 }}>{errors.days}</span>}
      </div>
    </div>
    <textarea
      style={taStyle(false, dark)}
      placeholder="Short description of this destination…"
      value={dest.description}
      onChange={e => onChange(index, 'description', e.target.value)}
    />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: dark ? '#cbd5e1' : BRAND.payneGray, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Destination Photo
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={e => onChange(index, 'imageFile', e.target.files[0])}
        className="w-full rounded-xl border px-3 py-1.5 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#EF8354]/10 file:text-[#EF8354] hover:file:bg-[#EF8354]/20 focus:outline-none focus:border-[#EF8354] cursor-pointer transition-all"
        style={{
          background: dark ? '#242838' : '#FFFFFF',
          color: dark ? '#cbd5e1' : '#2D3142',
          borderColor: dark ? 'rgba(255,255,255,0.12)' : '#E8E8EA',
        }}
      />
      {(dest.imageFile || dest.image) && (
        <div style={{ position: 'relative', marginTop: '6px', borderRadius: '10px', overflow: 'hidden', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E8E8EA', background: dark ? '#242838' : '#F7F7F8' }}>
          <img
            src={dest.imageFile ? URL.createObjectURL(dest.imageFile) : dest.image}
            alt="Destination preview"
            style={{ height: '90px', width: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => e.target.style.display = 'none'}
          />
          <span style={{
            position: 'absolute', bottom: '6px', left: '8px',
            fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
            background: dest.imageFile ? BRAND.coral : 'rgba(45, 49, 66, 0.85)',
            color: '#FFFFFF',
          }}>
            {dest.imageFile ? `New Selected: ${dest.imageFile.name}` : 'Current Photo'}
          </span>
        </div>
      )}
    </div>
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(dest.activities || []).map((a, ai) => (
        <div key={ai} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              <input
                style={inputStyle(!!errors[`act_${ai}_name`], dark)}
                placeholder="Activity name"
                value={a.name}
                onChange={e => {
                  const next = (dest.activities || []).map((act, idx) => idx === ai ? { ...act, name: e.target.value } : act);
                  onChange(index, 'activities', next);
                }}
              />
              {errors[`act_${ai}_name`] && (
                <span style={{ fontSize:'11px', color:'#cc3344', fontWeight:600 }}>{errors[`act_${ai}_name`]}</span>
              )}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
              <input
                style={{ ...inputStyle(!!errors[`act_${ai}_phone`], dark), width: '120px' }}
                placeholder="Phone"
                value={a.phone}
                onChange={e => {
                  const next = (dest.activities || []).map((act, idx) => idx === ai ? { ...act, phone: e.target.value } : act);
                  onChange(index, 'activities', next);
                }}
              />
              {errors[`act_${ai}_phone`] && (
                <span style={{ fontSize:'11px', color:'#cc3344', fontWeight:600 }}>{errors[`act_${ai}_phone`]}</span>
              )}
            </div>
          </div>
          <textarea
            style={{ ...taStyle(false, dark), gridColumn: '1 / -1' }}
            placeholder="Activity description"
            value={a.description}
            onChange={e => {
              const next = (dest.activities || []).map((act, idx) => idx === ai ? { ...act, description: e.target.value } : act);
              onChange(index, 'activities', next);
            }}
          />
        </div>
      ))}
      <button
        className="apfm-add-btn"
        onClick={() => onChange(index, 'activities', [...(dest.activities || []), { name: '', phone: '', description: '' }])}
        type="button"
      >Add Activity</button>
    </div>
  </div>
);

// ── Main form modal ──────────────────────────────────────────
const AdminPackageFormModal = ({ isOpen, pkg, onSave, onClose, dark = false, existingPackages = [], editingId = null }) => {
  const isEdit = !!pkg?.id;
  const [form,   setForm]   = useState(emptyPackage());
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(pkg ? {
        ...emptyPackage(),
        ...pkg,
        highlights: [...(pkg.highlights || ['','','',''])],
        destinations: (pkg.destinations || []).map(d => ({ ...d })),
      } : emptyPackage());
      setErrors({});
    }
  }, [isOpen, pkg]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setDest = (i, key, val) => {
    const dests = form.destinations.map((d, idx) => idx === i ? { ...d, [key]: val } : d);
    set('destinations', dests);
  };
  const setDestLocation = (i, name, coords) => {
    const dests = form.destinations.map((d, idx) => {
      if (idx !== i) return d;
      return {
        ...d,
        name,
        latitude: coords?.lat != null ? coords.lat : d.latitude,
        longitude: coords?.lng != null ? coords.lng : d.longitude,
      };
    });
    set('destinations', dests);
  };
  const addDest = () => set('destinations', [...form.destinations, { name:'', days:1, description:'', image:'', imageFile:null, latitude:null, longitude:null, activities:[] }]);
  const removeDest = (i) => set('destinations', form.destinations.filter((_, idx) => idx !== i));

  const validate = () => {
    const e = {};

    // ── Basic fields ─────────────────────────────────────────
    if (!form.title.trim())       e.title       = 'Title is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.type)               e.type        = 'Type is required.';
    if (!form.days)               e.days        = 'Duration is required.';
    if (!form.image.trim() && !form.packageImageFile) e.image = 'Cover image is required.';

    // ── Duplicate title check ────────────────────────────────
    if (form.title.trim() && existingPackages.length) {
      const titleLower = form.title.trim().toLowerCase();
      const duplicate = existingPackages.find(
        (p) => p.title?.toLowerCase() === titleLower && p.id !== editingId
      );
      if (duplicate) e.title = 'A package with this title already exists. Please use a different title.';
    }



    // ── Destination validations ──────────────────────────────
    if (form.destinations.length === 0) {
      e.destinations = 'Add at least one destination.';
    }

    const seenDestNames = [];
    let totalDestDays   = 0;

    form.destinations.forEach((dest, i) => {
      // Name required + uniqueness
      if (!dest.name.trim()) {
        e[`dest_${i}_name`] = 'Destination name is required.';
      } else {
        const nameLower = dest.name.trim().toLowerCase();
        if (seenDestNames.includes(nameLower)) {
          e[`dest_${i}_name`] = 'Destination names must be unique within a package.';
        }
        seenDestNames.push(nameLower);
      }

      // Days required
      const destDays = Number(dest.days);
      if (!dest.days || destDays < 1) {
        e[`dest_${i}_days`] = 'Number of days at this destination is required (minimum 1).';
      } else {
        totalDestDays += destDays;
      }

      // Activity validations
      const seenActNames = [];
      (dest.activities || []).forEach((act, ai) => {
        // Duplicate activity names within the same destination
        if (act.name.trim()) {
          const actLower = act.name.trim().toLowerCase();
          if (seenActNames.includes(actLower)) {
            e[`dest_${i}_act_${ai}_name`] = 'Activity names must be unique within a destination.';
          }
          seenActNames.push(actLower);
        }
        // Phone: exactly 10 digits if provided
        if (act.phone && act.phone.trim() && !/^\d{10}$/.test(act.phone.trim())) {
          e[`dest_${i}_act_${ai}_phone`] = 'Phone must be exactly 10 digits.';
        }
      });
    });

    // ── Days sum must equal package duration ─────────────────
    if (form.days && form.destinations.length > 0) {
      const allDaysSet = form.destinations.every(d => Number(d.days) >= 1);
      if (allDaysSet && totalDestDays !== Number(form.days)) {
        e.daysTotal = `Total destination days must add up to exactly ${form.days} day(s), but currently they sum to ${totalDestDays} day(s). Please adjust the days per destination.`;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
      // prepare payload including files
      const payload = {
        ...form,
        highlights: form.highlights.filter(h => h.trim()),
        destinations: form.destinations.map(d => ({ ...d })),
        packageImageFile: form.packageImageFile || null,
      };
      onSave(payload);
  };

  return (
    <>
      <style>{`
        .apfm-backdrop {
          position: fixed; inset: 0; z-index: 150;
          background: rgba(45, 49, 66, 0.72); backdrop-filter: blur(6px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 24px; overflow-y: auto;
        }
        .apfm-modal {
          background: #FFFFFF; border-radius: 20px;
          max-width: 680px; width: 100%;
          margin: auto;
          border: 1px solid #BFC0C0;
          box-shadow: 0 25px 50px -12px rgba(45, 49, 66, 0.25);
          overflow: hidden;
          font-family: 'Open Sans', 'Segoe UI', sans-serif;
        }
        .apfm-modal.dark {
          background: #2D3142;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        .apfm-strip {
          height: 4px;
          background: linear-gradient(90deg, #EF8354, #F4A261, #EF8354);
        }
        .apfm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 28px 0;
        }
        .apfm-header-tag {
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.16em; text-transform: uppercase; color: #EF8354;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
        }
        .apfm-header-title {
          font-size: 1.35rem; font-weight: 800;
          color: #2D3142; letter-spacing: -0.02em;
          margin-top: 4px;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
        }
        .apfm-modal.dark .apfm-header-title { color: #FFFFFF; }
        .apfm-close {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(239, 131, 84, 0.08);
          border: 1px solid rgba(239, 131, 84, 0.25);
          color: #4F5D75; font-size: 15px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s ease;
        }
        .apfm-close:hover { background: rgba(239, 131, 84, 0.18); color: #EF8354; }
        .apfm-modal.dark .apfm-close {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.15);
          color: #BFC0C0;
        }
        .apfm-modal.dark .apfm-close:hover {
          background: rgba(239, 131, 84, 0.2);
          color: #EF8354;
        }

        .apfm-rule { height: 1px; margin: 18px 28px 0; background: linear-gradient(90deg, rgba(239, 131, 84, 0.25), transparent); }

        .apfm-body {
          padding: 22px 28px 28px;
          display: flex; flex-direction: column; gap: 20px;
          max-height: 75vh; overflow-y: auto;
        }

        .apfm-section {
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #4F5D75; margin-top: 6px;
          display: flex; align-items: center; gap: 10px;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
        }
        .apfm-modal.dark .apfm-section { color: #BFC0C0; }
        .apfm-section::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,rgba(239, 131, 84, 0.25),transparent); }

        .apfm-select {
          padding: 10px 14px; border-radius: 10px;
          border: 1.5px solid #BFC0C0;
          background: #FFFFFF; color: #2D3142;
          font-size: 13.5px; outline: none;
          font-family: inherit; cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .apfm-select:focus { border-color: #EF8354; box-shadow: 0 0 0 3px rgba(239,131,84,0.15); }
        .apfm-select.error { border-color: #E0483B; }
        .apfm-modal.dark .apfm-select {
          background: #1E2230;
          border-color: rgba(255,255,255,0.15);
          color: #F5F5F6;
        }
        .apfm-modal.dark .apfm-select:focus { background: #242838; border-color: #EF8354; }

        .apfm-add-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 16px; border-radius: 10px;
          border: 1.5px dashed rgba(239, 131, 84, 0.4);
          background: rgba(239, 131, 84, 0.04);
          color: #EF8354; font-size: 12px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; width: 100%;
          justify-content: center;
          transition: all 0.2s ease;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
        }
        .apfm-add-btn:hover { background: rgba(239, 131, 84, 0.1); border-color: #EF8354; }
        .apfm-modal.dark .apfm-add-btn {
          background: rgba(239, 131, 84, 0.08);
          border-color: rgba(239, 131, 84, 0.35);
          color: #EF8354;
        }

        .apfm-footer {
          display: flex; gap: 12px;
          padding: 20px 28px 24px;
          border-top: 1px solid rgba(45, 49, 66, 0.08);
        }
        .apfm-modal.dark .apfm-footer { border-top: 1px solid rgba(255,255,255,0.1); }
        .apfm-save {
          flex: 1; padding: 13px; border-radius: 10px;
          background: #EF8354; border: none; color: #FFFFFF;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(239, 131, 84, 0.35);
          transition: all 0.2s ease;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
        }
        .apfm-save:hover { background: #df7243; transform: translateY(-1px); }
        .apfm-cancel {
          padding: 13px 24px; border-radius: 10px;
          border: 1.5px solid #BFC0C0;
          background: transparent; color: #4F5D75;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s ease;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
        }
        .apfm-cancel:hover { border-color: #EF8354; color: #EF8354; }
        .apfm-modal.dark .apfm-cancel {
          border-color: rgba(255,255,255,0.2);
          color: #BFC0C0;
        }
        .apfm-modal.dark .apfm-cancel:hover { border-color: #EF8354; color: #EF8354; }

        .apfm-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width:560px){ .apfm-2col { grid-template-columns: 1fr; } }
        @keyframes apfm-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="apfm-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              className={`apfm-modal ${dark ? 'dark' : ''}`}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="apfm-strip" />

              {/* Header */}
              <div className="apfm-header">
                <div>
                  <div className="apfm-header-tag">{isEdit ? '✦ Edit Package' : '✦ New Package'}</div>
                  <div className="apfm-header-title">{isEdit ? 'Update Package Details' : 'Add New Package'}</div>
                </div>
                <button className="apfm-close" onClick={onClose}>✕</button>
              </div>
              <div className="apfm-rule" />

              {/* Body */}
              <div className="apfm-body">

                {/* Basic info */}
                <div className="apfm-section">Basic Information</div>

                <Field label="Package Title *" error={errors.title} dark={dark}>
                  <input
                    style={inputStyle(errors.title, dark)}
                    placeholder="e.g. Golden Coast Escape"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                  />
                </Field>

                <Field label="Description *" error={errors.description} dark={dark}>
                  <textarea
                    style={taStyle(errors.description, dark)}
                    placeholder="A short compelling description of the package…"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                  />
                </Field>

                <div className="apfm-2col">
                  <Field label="Package Type *" error={errors.type} dark={dark}>
                    <select
                      className={`apfm-select ${errors.type ? 'error' : ''}`}
                      value={form.type}
                      onChange={e => set('type', e.target.value)}
                    >
                      {PACKAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>

                  <Field label="Duration (Days) *" error={errors.days} dark={dark}>
                    <select
                      className={`apfm-select ${errors.days ? 'error' : ''}`}
                      value={form.days}
                      onChange={e => set('days', Number(e.target.value))}
                    >
                      {PACKAGE_DAYS.map(d => <option key={d} value={d}>{d} Days</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Cover Image *" error={errors.image} dark={dark}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => set('packageImageFile', e.target.files[0])}
                    className="w-full rounded-xl border px-3.5 py-2 text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#EF8354]/10 file:text-[#EF8354] hover:file:bg-[#EF8354]/20 focus:outline-none focus:border-[#EF8354] focus:ring-2 focus:ring-[#EF8354]/20 cursor-pointer transition-all"
                    style={{
                      marginTop: 6,
                      background: dark ? '#242838' : '#FFFFFF',
                      color: dark ? '#cbd5e1' : '#2D3142',
                      borderColor: dark ? 'rgba(255,255,255,0.12)' : '#E8E8EA',
                    }}
                  />
                  <p className="text-[11px] mt-1" style={{ color: dark ? '#94A3B8' : BRAND.payneGray }}>
                    Choose an image from your PC. It will be stored and optimized via Cloudinary CDN.
                  </p>
                  {(form.packageImageFile || form.image) && (
                    <div style={{ position: 'relative', marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E8E8EA', background: dark ? '#242838' : '#F7F7F8' }}>
                      <img
                        src={form.packageImageFile ? URL.createObjectURL(form.packageImageFile) : form.image}
                        alt="Cover Preview"
                        style={{ height: '130px', borderRadius: '12px', objectFit: 'cover', width: '100%', display: 'block' }}
                        onError={e => e.target.style.display = 'none'}
                      />
                      <span style={{
                        position: 'absolute', bottom: '8px', left: '10px',
                        fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '6px',
                        background: form.packageImageFile ? BRAND.coral : 'rgba(45, 49, 66, 0.85)',
                        color: '#FFFFFF',
                      }}>
                        {form.packageImageFile ? `New Cover Selected: ${form.packageImageFile.name}` : 'Current Cover Image'}
                      </span>
                    </div>
                  )}
                </Field>



                

                {/* Destinations */}
                <div className="apfm-section">Destinations & Itinerary</div>
                {errors.destinations && (
                  <span style={{ fontSize:'11px', color:'#cc3344', fontWeight:600 }}>{errors.destinations}</span>
                )}
                {errors.daysTotal && (
                  <span style={{ fontSize:'11px', color:'#cc3344', fontWeight:600 }}>{errors.daysTotal}</span>
                )}
                {form.destinations.map((dest, i) => {
                  // Collect per-destination and per-activity errors for this row
                  const destRowErrors = {};
                  if (errors[`dest_${i}_name`]) destRowErrors.name = errors[`dest_${i}_name`];
                  if (errors[`dest_${i}_days`]) destRowErrors.days = errors[`dest_${i}_days`];
                  // Collect activity errors
                  (dest.activities || []).forEach((_, ai) => {
                    if (errors[`dest_${i}_act_${ai}_name`])  destRowErrors[`act_${ai}_name`]  = errors[`dest_${i}_act_${ai}_name`];
                    if (errors[`dest_${i}_act_${ai}_phone`]) destRowErrors[`act_${ai}_phone`] = errors[`dest_${i}_act_${ai}_phone`];
                  });
                  return (
                    <DestRow
                      key={i}
                      dest={dest}
                      index={i}
                      onChange={setDest}
                      onLocationChange={setDestLocation}
                      onRemove={removeDest}
                      canRemove={form.destinations.length > 1}
                      dark={dark}
                      errors={destRowErrors}
                    />
                  );
                })}
                <button className="apfm-add-btn" onClick={addDest}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  Add Destination
                </button>

              </div>

              {/* Footer */}
              <div className="apfm-footer">
                <button className="apfm-save" onClick={handleSave}>
                  {isEdit ? '✓ Save Changes' : '✓ Create Package'}
                </button>
                <button className="apfm-cancel" onClick={onClose}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminPackageFormModal;
