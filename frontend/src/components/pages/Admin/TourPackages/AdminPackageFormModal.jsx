import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PACKAGE_TYPES, PACKAGE_DAYS, emptyPackage } from './adminPackagesData';

// ── Small field components ───────────────────────────────────
const Field = ({ label, error, children, dark = false }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
    <label style={{ fontSize:'9px', fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color: dark ? '#94a3b8' : '#5a8080' }}>
      {label}
    </label>
    {children}
    {error && <span style={{ fontSize:'11px', color:'#cc3344', fontWeight:600 }}>{error}</span>}
  </div>
);

const inputStyle = (error, dark = false) => ({
  padding: '10px 14px', borderRadius: '9px',
  border: `1.5px solid ${error ? '#cc3344' : dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,176,165,0.22)'}`,
  background: dark ? '#0b1220' : '#f7fffe', color: dark ? '#e2e8f0' : '#0d2b2b',
  fontSize: '13.5px', fontWeight: 400,
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.2s ease',
  width: '100%', boxSizing: 'border-box',
});

const taStyle = (error, dark = false) => ({
  ...inputStyle(error, dark),
  resize: 'vertical', minHeight: '80px', lineHeight: 1.7, fontWeight: 300,
});

// ── Destination row ──────────────────────────────────────────
const DestRow = ({ dest, index, onChange, onRemove, canRemove, dark = false, errors = {} }) => (
  <div style={{
    background: dark ? '#0b1220' : '#f7fffe', border: dark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,176,165,0.15)',
    borderRadius: '12px', padding: '16px', display:'flex', flexDirection:'column', gap:'10px',
  }}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <span style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.18em', textTransform:'uppercase', color:'#00b0a5' }}>
        Stop {index + 1}
      </span>
      {canRemove && (
        <button
          onClick={() => onRemove(index)}
          style={{
            width:'24px', height:'24px', borderRadius:'50%',
            background:'rgba(204,51,68,0.08)', border:'1px solid rgba(204,51,68,0.2)',
            color:'#cc3344', fontSize:'12px', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
        >✕</button>
      )}
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'10px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
          <input
            style={inputStyle(!!errors.name, dark)}
          placeholder="Destination name"
          value={dest.name}
          onChange={e => onChange(index, 'name', e.target.value)}
        />
        {errors.name && <span style={{ fontSize:'11px', color:'#cc3344', fontWeight:600 }}>{errors.name}</span>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <input
            type="number" min="1" max="30"
            style={{ ...inputStyle(!!errors.days, dark), width:'60px', textAlign:'center' }}
            value={dest.days}
            onChange={e => onChange(index, 'days', Number(e.target.value))}
          />
          <span style={{ fontSize:'11px', color: dark ? '#94a3b8' : '#7a9a9a', whiteSpace:'nowrap', fontWeight:600 }}>days</span>
        </div>
        {errors.days && <span style={{ fontSize:'11px', color:'#cc3344', fontWeight:600 }}>{errors.days}</span>}
      </div>
    </div>
    <textarea
      style={taStyle(false, dark)}
      placeholder="Short description of this destination…"
      value={dest.description}
      onChange={e => onChange(index, 'description', e.target.value)}
    />
    {/* <input
      style={inputStyle(false, dark)}
      placeholder="Image URL for this destination or choose file"
      value={dest.image}
      onChange={e => onChange(index, 'image', e.target.value)}
    /> */}
    <input
      type="file"
      accept="image/*"
      style={{ marginTop: '8px' }}
      onChange={e => onChange(index, 'imageFile', e.target.files[0])}
    />
    {dest.image && (
      <img src={dest.image} alt="" style={{ height:'80px', borderRadius:'8px', objectFit:'cover', width:'100%', marginTop:'6px' }} onError={e => e.target.style.display='none'} />
    )}
    {dest.imageFile && (
      <div style={{ marginTop: '6px', fontSize: '12px', color: '#5a8080' }}>{dest.imageFile.name}</div>
    )}
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

  const setHL = (i, val) => {
    const hl = [...form.highlights];
    hl[i] = val;
    set('highlights', hl);
  };
  const addHL = () => set('highlights', [...form.highlights, '']);
  const removeHL = (i) => set('highlights', form.highlights.filter((_, idx) => idx !== i));

  const setDest = (i, key, val) => {
    const dests = form.destinations.map((d, idx) => idx === i ? { ...d, [key]: val } : d);
    set('destinations', dests);
  };
  const addDest = () => set('destinations', [...form.destinations, { name:'', days:1, description:'', image:'', imageFile:null, activities:[] }]);
  const removeDest = (i) => set('destinations', form.destinations.filter((_, idx) => idx !== i));

  const validate = () => {
    const e = {};

    // ── Basic fields ─────────────────────────────────────────
    if (!form.title.trim())       e.title       = 'Title is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.type)               e.type        = 'Type is required.';
    if (!form.days)               e.days        = 'Duration is required.';
    if (!form.image.trim() && !form.packageImageFile) e.image = 'Cover image is required (URL or file).';

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
          background: rgba(0,20,18,0.72); backdrop-filter: blur(6px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 24px; overflow-y: auto;
        }
        .apfm-modal {
          background: #fff; border-radius: 24px;
          max-width: 680px; width: 100%;
          margin: auto;
          box-shadow: 0 40px 80px rgba(0,60,50,0.25);
          overflow: hidden;
        }
        .apfm-modal.dark {
          background: #0f172a;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 40px 80px rgba(0,0,0,0.45);
        }
        /* Teal top strip */
        .apfm-strip {
          height: 3px;
          background: linear-gradient(90deg, #00b0a5, #00ddd0, #00b0a5);
        }
        .apfm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 24px 28px 0;
        }
        .apfm-header-tag {
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.22em; text-transform: uppercase; color: #00b0a5;
        }
        .apfm-header-title {
          font-size: 1.3rem; font-weight: 800;
          color: #0d2b2b; letter-spacing: -0.03em;
          margin-top: 4px;
        }
        .apfm-modal.dark .apfm-header-title { color: #e2e8f0; }
        .apfm-close {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(0,176,165,0.08);
          border: 1px solid rgba(0,176,165,0.2);
          color: #3a5a5a; font-size: 15px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s ease;
        }
        .apfm-close:hover { background: rgba(0,176,165,0.15); }
        .apfm-modal.dark .apfm-close {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          color: #cbd5e1;
        }

        .apfm-rule { height: 1px; margin: 18px 28px 0; background: linear-gradient(90deg, rgba(0,176,165,0.2), transparent); }

        .apfm-body {
          padding: 22px 28px 28px;
          display: flex; flex-direction: column; gap: 20px;
          max-height: 75vh; overflow-y: auto;
        }

        /* Section label */
        .apfm-section {
          font-size: 9px; font-weight: 800;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #7a9a9a; margin-top: 6px;
          display: flex; align-items: center; gap: 10px;
        }
        .apfm-modal.dark .apfm-section { color: #94a3b8; }
        .apfm-section::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,rgba(0,176,165,0.15),transparent); }

        /* Select */
        .apfm-select {
          padding: 10px 14px; border-radius: 9px;
          border: 1.5px solid rgba(0,176,165,0.22);
          background: #f7fffe; color: #0d2b2b;
          font-size: 13.5px; outline: none;
          font-family: inherit; cursor: pointer;
          transition: border-color 0.2s;
          width: 100%;
        }
        .apfm-select:focus { border-color: #00b0a5; background: #fff; }
        .apfm-select.error { border-color: #cc3344; }
        .apfm-modal.dark .apfm-select {
          background: #0b1220;
          border-color: rgba(255,255,255,0.14);
          color: #e2e8f0;
        }
        .apfm-modal.dark .apfm-select:focus { background: #0f172a; }

        /* Highlight row */
        .apfm-hl-row { display: flex; gap: 8px; align-items: center; }
        .apfm-hl-input {
          flex: 1; padding: 9px 13px; border-radius: 9px;
          border: 1.5px solid rgba(0,176,165,0.2);
          background: #f7fffe; color: #0d2b2b;
          font-size: 13px; outline: none; font-family: inherit;
          transition: border-color 0.2s;
        }
        .apfm-hl-input:focus { border-color: #00b0a5; background: #fff; }
        .apfm-modal.dark .apfm-hl-input {
          background: #0b1220;
          border-color: rgba(255,255,255,0.14);
          color: #e2e8f0;
        }
        .apfm-modal.dark .apfm-hl-input:focus { background: #0f172a; }
        .apfm-hl-remove {
          width: 28px; height: 28px; border-radius: '50%';
          background: rgba(204,51,68,0.07); border: 1px solid rgba(204,51,68,0.18);
          color: #cc3344; font-size: 12px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border-radius: 50%;
        }

        /* Add buttons */
        .apfm-add-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 9px;
          border: 1.5px dashed rgba(0,176,165,0.3);
          background: rgba(0,176,165,0.04);
          color: #00b0a5; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; width: 100%;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .apfm-add-btn:hover { background: rgba(0,176,165,0.09); border-color: #00b0a5; }
        .apfm-modal.dark .apfm-add-btn {
          background: rgba(15,23,42,0.7);
          border-color: rgba(255,255,255,0.2);
          color: #2dd4bf;
        }

        /* Footer */
        .apfm-footer {
          display: flex; gap: 10px;
          padding: 20px 28px 24px;
          border-top: 1px solid rgba(0,176,165,0.1);
        }
        .apfm-modal.dark .apfm-footer { border-top: 1px solid rgba(255,255,255,0.1); }
        .apfm-save {
          flex: 1; padding: 13px; border-radius: 10px;
          background: #00b0a5; border: none; color: #fff;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 5px 20px rgba(0,176,165,0.4);
          transition: all 0.25s ease;
        }
        .apfm-save:hover { background: #009e94; transform: translateY(-1px); }
        .apfm-cancel {
          padding: 13px 24px; border-radius: 10px;
          border: 1.5px solid rgba(0,176,165,0.2);
          background: transparent; color: #5a8080;
          font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s ease;
        }
        .apfm-cancel:hover { border-color: #00b0a5; color: #00b0a5; }
        .apfm-modal.dark .apfm-cancel {
          border-color: rgba(255,255,255,0.16);
          color: #cbd5e1;
        }

        /* 2-col grid */
        .apfm-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width:560px){ .apfm-2col { grid-template-columns: 1fr; } }
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

                <Field label="Cover Image URL *" error={errors.image} dark={dark}>
                 
                  <input type="file" accept="image/*" style={{ marginTop: 8 }} onChange={e => set('packageImageFile', e.target.files[0])} />
                  {form.image && (
                    <img src={form.image} alt="" style={{ height:'100px', borderRadius:'10px', objectFit:'cover', width:'100%', marginTop:'4px' }} onError={e => e.target.style.display='none'} />
                  )}
                  {form.packageImageFile && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#5a8080' }}>{form.packageImageFile.name}</div>
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