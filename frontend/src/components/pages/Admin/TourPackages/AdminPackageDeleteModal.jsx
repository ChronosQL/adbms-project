import { motion, AnimatePresence } from 'framer-motion';

const AdminPackageDeleteModal = ({ pkg, onConfirm, onCancel, dark = false }) => (
  <>
    <style>{`
      .apdm-backdrop {
        position: fixed; inset: 0; z-index: 200;
        background: rgba(0,20,18,0.72); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
      }
      .apdm-modal {
        background: #fff; border-radius: 20px;
        max-width: 420px; width: 100%;
        box-shadow: 0 32px 64px rgba(0,0,0,0.25);
        overflow: hidden;
      }
      .apdm-modal.dark {
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.12);
      }
      /* Red top strip */
      .apdm-strip {
        height: 4px;
        background: linear-gradient(90deg, #cc3344, #ff6b7a);
      }
      .apdm-body {
        padding: 32px 28px 28px;
        display: flex; flex-direction: column; align-items: center;
        gap: 16px; text-align: center;
      }
      .apdm-icon {
        width: 60px; height: 60px; border-radius: 50%;
        background: rgba(204,51,68,0.08);
        border: 1.5px solid rgba(204,51,68,0.2);
        display: flex; align-items: center; justify-content: center;
        font-size: 26px;
      }
      .apdm-title {
        font-size: 1.25rem; font-weight: 800;
        color: #0d2b2b; letter-spacing: -0.03em;
      }
      .apdm-modal.dark .apdm-title { color: #e2e8f0; }
      .apdm-sub {
        font-size: 13.5px; font-weight: 300; color: #5a8080;
        line-height: 1.7; max-width: 320px;
      }
      .apdm-modal.dark .apdm-sub { color: #94a3b8; }
      /* Package preview chip */
      .apdm-pkg-chip {
        display: inline-flex; align-items: center; gap: 10px;
        padding: 10px 16px; border-radius: 12px;
        background: rgba(0,176,165,0.06);
        border: 1px solid rgba(0,176,165,0.2);
        margin-top: 4px;
      }
      .apdm-modal.dark .apdm-pkg-chip {
        background: rgba(15,23,42,0.7);
        border-color: rgba(255,255,255,0.14);
      }
      .apdm-chip-thumb {
        width: 40px; height: 32px; border-radius: 6px;
        object-fit: cover; flex-shrink: 0;
      }
      .apdm-chip-title {
        font-size: 13px; font-weight: 700; color: #0d2b2b;
        letter-spacing: -0.02em;
      }
      .apdm-modal.dark .apdm-chip-title { color: #e2e8f0; }
      .apdm-chip-meta {
        font-size: 10px; font-weight: 400; color: #7a9a9a;
        margin-top: 2px;
      }
      .apdm-modal.dark .apdm-chip-meta { color: #94a3b8; }
      /* Warning note */
      .apdm-warning {
        padding: 12px 16px; border-radius: 10px;
        background: rgba(204,51,68,0.05);
        border: 1px solid rgba(204,51,68,0.15);
        font-size: 12px; font-weight: 400; color: #cc3344;
        line-height: 1.6;
      }
      .apdm-modal.dark .apdm-warning {
        background: rgba(239,68,68,0.08);
        border-color: rgba(239,68,68,0.3);
        color: #fca5a5;
      }
      /* Buttons */
      .apdm-btns { display: flex; gap: 10px; width: 100%; margin-top: 4px; }
      .apdm-cancel {
        flex: 1; padding: 13px; border-radius: 10px;
        border: 1.5px solid rgba(0,176,165,0.2);
        background: transparent; color: #5a8080;
        font-size: 13px; font-weight: 700;
        letter-spacing: 0.06em; text-transform: uppercase;
        cursor: pointer; transition: all 0.2s ease;
      }
      .apdm-cancel:hover { border-color: #00b0a5; color: #00b0a5; }
      .apdm-modal.dark .apdm-cancel {
        border-color: rgba(255,255,255,0.18);
        color: #cbd5e1;
      }
      .apdm-confirm {
        flex: 1; padding: 13px; border-radius: 10px;
        background: #cc3344; border: none; color: #fff;
        font-size: 13px; font-weight: 700;
        letter-spacing: 0.06em; text-transform: uppercase;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(204,51,68,0.35);
        transition: all 0.2s ease;
      }
      .apdm-confirm:hover { background: #b52d3c; transform: translateY(-1px); }
    `}</style>

    <AnimatePresence>
      {pkg && (
        <motion.div
          className="apdm-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className={`apdm-modal ${dark ? 'dark' : ''}`}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="apdm-strip" />
            <div className="apdm-body">
              <div className="apdm-icon">🗑️</div>
              <div className="apdm-title">Delete Package?</div>
              <p className="apdm-sub">
                This will permanently remove the package from the database and it will no longer appear on the user-facing site.
              </p>

              {/* Package preview */}
              <div className="apdm-pkg-chip">
                {pkg.image
                  ? <img src={pkg.image} alt={pkg.title} className="apdm-chip-thumb" />
                  : <div style={{ width:40, height:32, borderRadius:6, background:'rgba(0,176,165,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📦</div>
                }
                <div>
                  <div className="apdm-chip-title">{pkg.title}</div>
                  <div className="apdm-chip-meta">{pkg.type} · {pkg.days} Days · {pkg.destinations.length} stops</div>
                </div>
              </div>

              <div className="apdm-warning">
                ⚠️ This action cannot be undone. All associated destination and highlight data will also be removed.
              </div>

              <div className="apdm-btns">
                <button className="apdm-cancel" onClick={onCancel}>Cancel</button>
                <button className="apdm-confirm" onClick={() => onConfirm(pkg.id)}>
                  Yes, Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);

export default AdminPackageDeleteModal;