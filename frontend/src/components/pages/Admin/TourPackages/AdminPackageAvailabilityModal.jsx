import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CircleAlert, Save, X } from 'lucide-react';
import { packageStore } from './adminPackagesData';

const parsePackageId = (id) => {
  const match = String(id || '').match(/(\d+)/);
  return match ? match[1] : null;
};

const normalizeStatus = (value) => {
  const status = String(value || '').trim().toUpperCase();
  return status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
};

const AdminPackageAvailabilityModal = ({ pkg, onClose, dark = false }) => {
  const [status, setStatus] = useState('AVAILABLE');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pkg) return;

    let cancelled = false;

    const loadAvailability = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await packageStore.getAvailability(pkg.id);
        if (!cancelled) {
          setStatus(normalizeStatus(data.status));
        }
      } catch (err) {
        if (!cancelled) {
          setStatus(normalizeStatus(pkg.availability?.status));
          setError(err.message || 'Failed to load availability.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [pkg]);

  const handleSave = async () => {
    if (!pkg) return;

    try {
      setSaving(true);
      setError('');
      await packageStore.setAvailability(pkg.id, status);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  const pkgId = parsePackageId(pkg?.id);
  const isAvailable = normalizeStatus(status) === 'AVAILABLE';

  return (
    <AnimatePresence>
      {pkg && (
        <motion.div
          className="apa-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`apa-modal ${dark ? 'dark' : ''}`}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <style>{`
              .apa-backdrop {
                position: fixed;
                inset: 0;
                z-index: 260;
                background: rgba(0, 20, 18, 0.72);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .apa-modal {
                width: min(420px, 100%);
                border-radius: 22px;
                background: linear-gradient(180deg, #ffffff, #f7fffe);
                border: 1px solid rgba(0, 176, 165, 0.16);
                box-shadow: 0 26px 64px rgba(0, 60, 50, 0.26);
                overflow: hidden;
              }
              .apa-modal.dark {
                background: linear-gradient(180deg, #0f172a, #0b1220);
                border-color: rgba(255, 255, 255, 0.08);
              }
              .apa-header {
                position: relative;
                padding: 18px 18px 14px;
                background: linear-gradient(135deg, rgba(0, 176, 165, 0.12), rgba(0, 176, 165, 0.03));
                border-bottom: 1px solid rgba(0, 176, 165, 0.12);
              }
              .apa-modal.dark .apa-header {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01));
                border-bottom-color: rgba(255, 255, 255, 0.08);
              }
              .apa-close {
                position: absolute;
                top: 14px;
                right: 14px;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                border: 1px solid rgba(0, 176, 165, 0.18);
                background: rgba(255, 255, 255, 0.75);
                display: grid;
                place-items: center;
                color: #0d2b2b;
                cursor: pointer;
              }
              .apa-modal.dark .apa-close {
                background: rgba(15, 23, 42, 0.8);
                color: #e2e8f0;
                border-color: rgba(255, 255, 255, 0.14);
              }
              .apa-kicker {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.22em;
                text-transform: uppercase;
                color: #5a8080;
              }
              .apa-modal.dark .apa-kicker { color: #94a3b8; }
              .apa-title {
                margin-top: 8px;
                font-size: 1.2rem;
                font-weight: 900;
                letter-spacing: -0.03em;
                color: #0d2b2b;
              }
              .apa-modal.dark .apa-title { color: #e2e8f0; }
              .apa-sub {
                margin-top: 5px;
                font-size: 13px;
                color: #5a8080;
                line-height: 1.6;
              }
              .apa-modal.dark .apa-sub { color: #94a3b8; }
              .apa-body {
                padding: 16px 18px 18px;
                display: grid;
                gap: 14px;
              }
              .apa-panel {
                padding: 14px;
                border-radius: 16px;
                background: rgba(255, 255, 255, 0.78);
                border: 1px solid rgba(0, 176, 165, 0.12);
              }
              .apa-modal.dark .apa-panel {
                background: rgba(2, 6, 23, 0.55);
                border-color: rgba(255, 255, 255, 0.08);
              }
              .apa-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
              }
              .apa-label {
                font-size: 12px;
                font-weight: 800;
                color: #0d2b2b;
                margin-bottom: 6px;
              }
              .apa-modal.dark .apa-label { color: #e2e8f0; }
              .apa-options {
                display: grid;
                gap: 10px;
              }
              .apa-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 12px 14px;
                border-radius: 14px;
                border: 1px solid rgba(0, 176, 165, 0.14);
                background: rgba(255, 255, 255, 0.76);
                cursor: pointer;
                transition: all 0.18s ease;
              }
              .apa-modal.dark .apa-option {
                background: rgba(15, 23, 42, 0.65);
                border-color: rgba(255, 255, 255, 0.08);
              }
              .apa-option.active.available {
                border-color: rgba(34, 197, 94, 0.35);
                box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.08);
              }
              .apa-option.active.unavailable {
                border-color: rgba(204, 51, 68, 0.35);
                box-shadow: inset 0 0 0 1px rgba(204, 51, 68, 0.08);
              }
              .apa-option-title {
                font-size: 13px;
                font-weight: 900;
                color: #0d2b2b;
              }
              .apa-modal.dark .apa-option-title { color: #e2e8f0; }
              .apa-option-sub {
                margin-top: 2px;
                font-size: 11px;
                color: #6c8a88;
              }
              .apa-modal.dark .apa-option-sub { color: #94a3b8; }
              .apa-radio {
                width: 18px;
                height: 18px;
                accent-color: #00b0a5;
                flex-shrink: 0;
              }
              .apa-preview {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 14px;
                border-radius: 14px;
                background: rgba(0, 176, 165, 0.08);
                border: 1px solid rgba(0, 176, 165, 0.16);
                font-size: 12px;
                font-weight: 700;
                color: #0d2b2b;
              }
              .apa-modal.dark .apa-preview {
                background: rgba(0, 176, 165, 0.12);
                color: #e2e8f0;
              }
              .apa-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
              }
              .apa-action-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 11px 14px;
                border-radius: 10px;
                border: 1px solid rgba(0, 176, 165, 0.18);
                background: #fff;
                color: #0d2b2b;
                cursor: pointer;
                font-size: 12px;
                font-weight: 800;
              }
              .apa-modal.dark .apa-action-btn {
                background: #0b1220;
                color: #e2e8f0;
                border-color: rgba(255, 255, 255, 0.1);
              }
              .apa-save {
                flex: 1 1 180px;
                background: #00b0a5;
                color: #fff;
                border-color: #00b0a5;
              }
              .apa-save:hover { background: #009e94; }
              .apa-error {
                padding: 10px 12px;
                border-radius: 12px;
                border: 1px solid rgba(204, 51, 68, 0.18);
                background: rgba(204, 51, 68, 0.06);
                color: #cc3344;
                font-size: 12px;
                font-weight: 600;
                line-height: 1.5;
              }
              .apa-loading {
                padding: 8px 0 0;
                color: #5a8080;
                font-size: 13px;
                font-weight: 700;
              }
            `}</style>

            <div className="apa-header">
              <button className="apa-close" onClick={onClose} type="button" aria-label="Close availability modal">
                <X size={18} />
              </button>
              <div className="apa-kicker">
                <CircleAlert size={14} /> Package Availability
              </div>
              <div className="apa-title">Update status for {pkg.title}</div>
              <div className="apa-sub">
                Use the action field to mark this package available or unavailable.
              </div>
            </div>

            <div className="apa-body">
              <div className="apa-panel">
                <div className="apa-label">Current status</div>
                {loading ? (
                  <div className="apa-loading">Loading package status...</div>
                ) : (
                  <div className="apa-options">
                    <label className={`apa-option available ${isAvailable ? 'active' : ''}`}>
                      <div>
                        <div className="apa-option-title">Available</div>
                        <div className="apa-option-sub">Customers can book this package.</div>
                      </div>
                      <input
                        className="apa-radio"
                        type="radio"
                        name="package-availability"
                        checked={isAvailable}
                        onChange={() => setStatus('AVAILABLE')}
                      />
                    </label>

                    <label className={`apa-option unavailable ${!isAvailable ? 'active' : ''}`}>
                      <div>
                        <div className="apa-option-title">Unavailable</div>
                        <div className="apa-option-sub">Hide this package from active booking.</div>
                      </div>
                      <input
                        className="apa-radio"
                        type="radio"
                        name="package-availability"
                        checked={!isAvailable}
                        onChange={() => setStatus('UNAVAILABLE')}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="apa-preview">
                {isAvailable ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
                Package #{pkgId || pkg.id} will be saved as {normalizeStatus(status)}.
              </div>

              {error && <div className="apa-error">{error}</div>}

              <div className="apa-actions">
                <button type="button" className="apa-action-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="apa-action-btn apa-save" onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Status'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminPackageAvailabilityModal;
