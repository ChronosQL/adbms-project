import React, { useEffect, useRef } from "react";
import { X, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { BRAND, FONT, STATE } from "../pages/Admin/AdminDashboard/adminTheme";

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};

/**
 * Standard accessible modal dialog adhering to Ceylon Best Tours design system.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  dark = false,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const bgSurface = dark ? "#1e293b" : "#ffffff";
  const borderSurface = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const textPrimary = dark ? "#f1f5f9" : BRAND.gunmetal;
  const textSecondary = dark ? "#94a3b8" : BRAND.payneGray;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`relative w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.md} rounded-2xl shadow-2xl transition-all my-8 overflow-hidden`}
        style={{
          background: bgSurface,
          border: `1px solid ${borderSurface}`,
          fontFamily: FONT.body,
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="flex items-start justify-between p-5 border-b"
            style={{ borderColor: borderSurface }}
          >
            <div>
              {title && (
                <h3
                  id="modal-title"
                  className="text-lg font-bold"
                  style={{ fontFamily: FONT.heading, color: textPrimary }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs mt-1" style={{ color: textSecondary }}>
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-4 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-800/20"
            style={{ borderColor: borderSurface }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Standard confirmation popup dialog for destructive or state-changing actions.
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  loading = false,
  dark = false,
}) => {
  const TYPE_CONFIG = {
    danger: {
      icon: AlertTriangle,
      iconColor: STATE.danger,
      iconBg: `${STATE.danger}15`,
      confirmBtnBg: STATE.danger,
    },
    warning: {
      icon: AlertCircle,
      iconColor: STATE.warning,
      iconBg: `${STATE.warning}15`,
      confirmBtnBg: "#d97706",
    },
    info: {
      icon: Info,
      iconColor: STATE.info,
      iconBg: `${STATE.info}15`,
      confirmBtnBg: BRAND.coral,
    },
  };

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.danger;
  const IconComponent = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      dark={dark}
      showCloseButton={!loading}
      footer={
        <>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{ background: config.confirmBtnBg }}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-2xl shrink-0"
          style={{ background: config.iconBg }}
        >
          <IconComponent className="w-6 h-6" style={{ color: config.iconColor }} />
        </div>
        <div>
          <h4
            className="text-base font-bold text-[#2D3142] dark:text-slate-100 mb-1"
            style={{ fontFamily: FONT.heading }}
          >
            {title}
          </h4>
          <p className="text-xs text-[#4F5D75] dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;
