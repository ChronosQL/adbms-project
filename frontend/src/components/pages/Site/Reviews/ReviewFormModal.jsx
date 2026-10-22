import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import ReviewForm from './ReviewForm';
// ── Auth gate shown when user is not logged in ───────────────
const AuthGate = ({ onClose, t }) => (
  <>
    <style>{`
      .rvm-auth {
        display: flex; flex-direction: column; align-items: center;
        gap: 20px; padding: 16px 8px; text-align: center;
      }
      .rvm-auth-icon {
        width: 72px; height: 72px; border-radius: 50%;
        background: linear-gradient(135deg, rgba(0,176,165,0.12), rgba(0,176,165,0.22));
        border: 1.5px solid rgba(0,176,165,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 32px;
      }
      .rvm-auth-title {
        font-size: 1.4rem; font-weight: 800;
        color: #0d2b2b; letter-spacing: -0.03em;
      }
      .rvm-auth-sub {
        font-size: 14px; font-weight: 300;
        color: #5a8080; max-width: 320px; line-height: 1.7;
        margin-top: -8px;
      }
      .rvm-auth-note {
        padding: 14px 20px; border-radius: 12px;
        background: rgba(0,176,165,0.06);
        border: 1px solid rgba(0,176,165,0.18);
        font-size: 12px; font-weight: 400; color: #3a6a6a;
        line-height: 1.6; max-width: 380px;
      }
      .rvm-auth-note strong { font-weight: 700; color: #EF8354; }
      .rvm-auth-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
      .rvm-login-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 13px 28px; border-radius: 10px;
        background: #EF8354; color: #fff;
        font-size: 13px; font-weight: 700;
        letter-spacing: 0.1em; text-transform: uppercase;
        text-decoration: none;
        box-shadow: 0 6px 24px -4px rgba(0,176,165,0.45);
        transition: all 0.25s ease;
      }
      .rvm-login-btn:hover { background: #4F5D75; transform: translateY(-1px); }
      .rvm-signup-btn {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 13px 24px; border-radius: 10px;
        border: 1.5px solid rgba(0,176,165,0.3);
        background: transparent; color: #3a5a5a;
        font-size: 13px; font-weight: 700;
        letter-spacing: 0.1em; text-transform: uppercase;
        text-decoration: none;
        transition: all 0.2s ease;
      }
      .rvm-signup-btn:hover { border-color: #EF8354; color: #EF8354; }
    `}</style>

    <div className="rvm-auth">
      <div className="rvm-auth-icon">🔐</div>
      <div className="rvm-auth-title">{"Log in to write a review"}</div>
      <div className="rvm-auth-sub">
        {"Share your Sri Lanka experience with fellow travellers. Sign in to get started."}
      </div>
      <div className="rvm-auth-note">
        <strong>{"✦ Note:"}</strong> {"Reviews are only available once our team marks your tour status as"} <strong>{"Completed"}</strong>{". You will be notified when you can leave a review."}
      </div>
      <div className="rvm-auth-btns">
        <Link
          to="/login?redirect=/reviews&action=review"
          className="rvm-login-btn"
          onClick={onClose}
        >
          {"Log In"}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <Link
          to="/register?redirect=/reviews&action=review"
          className="rvm-signup-btn"
          onClick={onClose}
        >
          {"Create Account"}
        </Link>
      </div>
    </div>
  </>
);

// ── Modal shell ──────────────────────────────────────────────
const ReviewFormModal = ({ isOpen, isLoggedIn, reviewableTours, onClose, onSubmit }) => {
  
  return (
  <>
    <style>{`
      .rvm-backdrop {
        position: fixed; inset: 0; z-index: 100;
        background: rgba(0,20,18,0.72);
        backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
      }
      .rvm-modal {
        background: #fff;
        border-radius: 24px;
        max-width: 560px; width: 100%;
        max-height: 90vh; overflow-y: auto;
        box-shadow: 0 40px 80px rgba(0,60,50,0.28);
      }

      /* Header */
      .rvm-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 24px 28px 0;
      }
      .rvm-header-left { display: flex; flex-direction: column; gap: 4px; }
      .rvm-header-tag {
        font-size: 9px; font-weight: 800;
        letter-spacing: 0.22em; text-transform: uppercase;
        color: #EF8354;
      }
      .rvm-header-title {
        font-size: 1.35rem; font-weight: 800;
        color: #0d2b2b; letter-spacing: -0.03em;
      }
      .rvm-close {
        width: 36px; height: 36px; border-radius: 50%;
        background: rgba(0,176,165,0.08);
        border: 1px solid rgba(0,176,165,0.2);
        color: #3a5a5a; font-size: 16px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
      .rvm-close:hover { background: rgba(0,176,165,0.15); color: #0d2b2b; }

      /* Rule */
      .rvm-rule {
        height: 1px; margin: 20px 28px 0;
        background: linear-gradient(90deg, rgba(0,176,165,0.2), transparent);
      }

      /* Body */
      .rvm-body { padding: 24px 28px 28px; }
    `}</style>

    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="rvm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="rvm-modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="rvm-header">
              <div className="rvm-header-left">
                <span className="rvm-header-tag">{"✦ Share Your Experience"}</span>
                <div className="rvm-header-title">
                  {isLoggedIn ? "Write a Review" : "Login Required"}
                </div>
              </div>
              <button className="rvm-close" onClick={onClose}>✕</button>
            </div>
            <div className="rvm-rule" />

            {/* Body */}
            <div className="rvm-body">
              {isLoggedIn
                ? <ReviewForm reviewableTours={reviewableTours} onSubmit={onSubmit} onCancel={onClose} />
                : <AuthGate onClose={onClose} t={t} />
              }
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
};

export default ReviewFormModal;
