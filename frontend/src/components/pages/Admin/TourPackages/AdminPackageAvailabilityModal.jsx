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
                background: rgba(45, 49, 66, 0.72);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .apa-modal {
                width: min(440px, 100%);
                border-radius: 22px;
                background: #ffffff;
                border: 1px solid #E8E8EA;
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
                overflow: hidden;
              }
              .apa-modal.dark {
                background: #383C4E;
                border-color: rgba(255, 255, 255, 0.1);
                box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
              }
              .apa-header {
                position: relative;
                padding: 20px 22px 16px;
                background: #F7F7F8;
                border-bottom: 1px solid #EEEEF0;
              }
              .apa-modal.dark .apa-header {
                background: rgba(255, 255, 255, 0.03);
                border-bottom-color: rgba(255, 255, 255, 0.08);
              }
              .apa-close {
                position: absolute;
                top: 16px;
                right: 16px;
                width: 34px;
                height: 34px;
                padding: 0;
                margin: 0;
                border-radius: 50%;
                border: 1px solid #E8E8EA;
                background: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #4F5D75;
                cursor: pointer;
                transition: all 0.15s ease;
                box-sizing: border-box;
                z-index: 10;
              }
              .apa-close:hover {
                color: #EF8354;
                border-color: #EF8354;
                background: rgba(239, 131, 84, 0.08);
              }
              .apa-modal.dark .apa-close {
                background: #2D3142;
                color: #B7BAC7;
                border-color: rgba(255, 255, 255, 0.12);
              }
              .apa-modal.dark .apa-close:hover {
                color: #EF8354;
                border-color: #EF8354;
              }
              .apa-kicker {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: #EF8354;
              }
              .apa-title {
                margin-top: 6px;
                font-size: 1.25rem;
                font-weight: 800;
                letter-spacing: -0.02em;
                color: #2D3142;
              }
              .apa-modal.dark .apa-title { color: #F5F5F6; }
              .apa-sub {
                margin-top: 4px;
                font-size: 13px;
                color: #4F5D75;
                line-height: 1.5;
              }
              .apa-modal.dark .apa-sub { color: #B7BAC7; }
              .apa-body {
                padding: 20px 22px;
                display: grid;
                gap: 16px;
              }
              .apa-panel {
                padding: 14px;
                border-radius: 16px;
                background: #FAFAFB;
                border: 1px solid #EEEEF0;
              }
              .apa-modal.dark .apa-panel {
                background: rgba(255, 255, 255, 0.03);
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
                color: #2D3142;
                margin-bottom: 6px;
              }
              .apa-modal.dark .apa-label { color: #F5F5F6; }
              .apa-options {
                display: grid;
                gap: 10px;
              }
              .apa-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 14px 16px;
                border-radius: 14px;
                border: 1.5px solid #E8E8EA;
                background: #ffffff;
                cursor: pointer;
                transition: all 0.18s ease;
              }
              .apa-modal.dark .apa-option {
                background: rgba(255, 255, 255, 0.03);
                border-color: rgba(255, 255, 255, 0.1);
              }
              .apa-option.active.available {
                border-color: #2F9E44;
                background: rgba(47, 158, 68, 0.06);
                box-shadow: inset 0 0 0 1px #2F9E44;
              }
              .apa-option.active.unavailable {
                border-color: #E0483B;
                background: rgba(224, 72, 59, 0.06);
                box-shadow: inset 0 0 0 1px #E0483B;
              }
              .apa-option-title {
                font-size: 13.5px;
                font-weight: 800;
                color: #2D3142;
              }
              .apa-modal.dark .apa-option-title { color: #F5F5F6; }
              .apa-option-sub {
                margin-top: 2px;
                font-size: 11px;
                color: #4F5D75;
              }
              .apa-modal.dark .apa-option-sub { color: #B7BAC7; }
              .apa-radio {
                width: 18px;
                height: 18px;
                accent-color: #EF8354;
                flex-shrink: 0;
              }
              .apa-preview {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 14px;
                border-radius: 14px;
                background: rgba(239, 131, 84, 0.08);
                border: 1px solid rgba(239, 131, 84, 0.2);
                font-size: 12px;
                font-weight: 700;
                color: #2D3142;
              }
              .apa-modal.dark .apa-preview {
                background: rgba(239, 131, 84, 0.12);
                color: #F5F5F6;
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
                padding: 12px 16px;
                border-radius: 12px;
                border: 1px solid #E8E8EA;
                background: #fff;
                color: #4F5D75;
                cursor: pointer;
                font-size: 12px;
                font-weight: 800;
                transition: all 0.15s ease;
              }
              .apa-modal.dark .apa-action-btn {
                background: #2D3142;
                color: #F5F5F6;
                border-color: rgba(255, 255, 255, 0.12);
              }
              .apa-save {
                flex: 1 1 180px;
                background: #EF8354;
                color: #fff;
                border-color: #EF8354;
              }
              .apa-save:hover { background: #d96e41; border-color: #d96e41; }
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
