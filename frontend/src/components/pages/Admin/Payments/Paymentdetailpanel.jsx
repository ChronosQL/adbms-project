import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBookings } from "../../../../context/BookingsContext.jsx";
import { BRAND, STATE } from "../AdminDashboard/adminTheme";
import { Download, AlertTriangle, X } from "lucide-react";

const STATUS_CONFIG = {
  pending: { label: "PENDING VERIFICATION", bg: "rgba(227, 168, 87, 0.12)", text: STATE.warning, border: "rgba(227, 168, 87, 0.25)" },
  approved: { label: "APPROVED", bg: "rgba(47, 158, 68, 0.12)", text: STATE.success, border: "rgba(47, 158, 68, 0.25)" },
  rejected: { label: "REJECTED", bg: "rgba(224, 72, 59, 0.12)", text: STATE.danger, border: "rgba(224, 72, 59, 0.25)" },
};

function SectionHeader({ title, color }) {
  return (
    <h3 className="text-sm font-bold mb-3 mt-5 first:mt-0" style={{ color: color || '#2D3142', fontFamily: "'Montserrat', sans-serif" }}>
      {title}
    </h3>
  );
}

function InfoRow({ label, value, highlight, linkLabel, onLink, textPrimary, textSecondary, divider }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b last:border-0" style={{ borderColor: divider || '#EEEEF0' }}>
      <span className="text-xs shrink-0 w-36 font-medium" style={{ color: textSecondary }}>{label}</span>
      <div className="flex items-center gap-2 text-right">
        <span className="text-xs font-semibold" style={{ color: highlight ? BRAND.coral : textPrimary }}>
          {value}
        </span>
        {linkLabel && (
          <button onClick={onLink} className="text-xs font-bold hover:underline cursor-pointer" style={{ color: BRAND.coral }}>
            {linkLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function ReceiptDownload({ slip, dark }) {
  const [fileError, setFileError] = useState('');
  const { downloadPaymentReceipt } = useBookings();

  if (!slip) return null;

  const handleDownload = async () => {
    try {
      setFileError('');
      await downloadPaymentReceipt(slip.paymentId);
    } catch (err) {
      setFileError(err.message || 'Receipt could not be downloaded.');
    }
  };

  return (
    <div
      className="mt-2 rounded-xl p-3 border transition-colors"
      style={{
        background: dark ? 'rgba(255,255,255,0.02)' : '#FAFAFB',
        borderColor: dark ? 'rgba(255,255,255,0.08)' : '#E8E8EA',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: dark ? '#FFFFFF' : BRAND.gunmetal }}>{slip.filename}</p>
          <p className="text-[11px] mt-0.5" style={{ color: dark ? '#94A3B8' : BRAND.payneGray }}>{slip.size}</p>
          <p className="text-[11px]" style={{ color: dark ? '#94A3B8' : BRAND.payneGray }}>Uploaded on {slip.uploadedAt}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            style={{
              background: 'rgba(239, 131, 84, 0.12)',
              color: BRAND.coral,
              border: '1px solid rgba(239, 131, 84, 0.25)',
            }}
          >
            <Download size={12} /> Receipt
          </button>
        </div>
      </div>
      {fileError && <p role="alert" className="mt-2 text-xs font-semibold" style={{ color: STATE.danger }}>{fileError}</p>}
    </div>
  );
}

export default function PaymentDetailPanel({
  payment = null,
  onClose = () => {},
  onApprove = () => {},
  onReject = () => {},
  loading = false,
  dark = false,
  t,
}) {
  const [notes, setNotes] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [isUpdatingCharges, setIsUpdatingCharges] = useState(false);
  const navigate = useNavigate();
  const { updateAdditionalCharges, downloadPaymentInvoice } = useBookings();

  useEffect(() => {
    if (payment) {
      setAdditionalCharges(payment.rawAdditionalCharges || 0);
    }
  }, [payment]);

  if (!payment) return null;

  const cardBg = t ? t.cardBg : (dark ? "#383C4E" : "#FFFFFF");
  const cardBorder = t ? t.cardBorder : (dark ? "rgba(255,255,255,0.08)" : "#E8E8EA");
  const textPrimary = t ? t.textPrimary : (dark ? "#FFFFFF" : BRAND.gunmetal);
  const textSecondary = t ? t.textSecondary : (dark ? "#B7BAC7" : BRAND.payneGray);
  const divider = t ? t.divider : (dark ? "rgba(255,255,255,0.06)" : "#EEEEF0");
  const subtleBoxBg = dark ? "rgba(255,255,255,0.03)" : "#F7F7F8";

  const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const isPending = payment.status === "pending";

  const handleApprove = () => onApprove(payment.id, notes);
  const handleReject = () => onReject(payment.id, notes);

  const handleUpdateCharges = async () => {
    try {
      setIsUpdatingCharges(true);
      await updateAdditionalCharges(payment.booking_id, additionalCharges);
      alert("Additional charges updated successfully. Please close and reopen this panel to see updated totals.");
    } catch (err) {
      console.error(err);
      alert("Failed to update additional charges.");
    } finally {
      setIsUpdatingCharges(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden" onClick={onClose} />

      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-md shadow-2xl z-50 flex flex-col overflow-hidden transition-colors"
        style={{
          background: cardBg,
          borderLeft: `1px solid ${cardBorder}`,
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${divider}` }}>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-extrabold" style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}>Payment Details</h2>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full tracking-wide"
              style={{
                background: statusCfg.bg,
                color: statusCfg.text,
                border: `1px solid ${statusCfg.border}`,
              }}
            >
              {statusCfg.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
            style={{ color: textSecondary }}
            onMouseEnter={e => e.currentTarget.style.color = BRAND.coral}
            onMouseLeave={e => e.currentTarget.style.color = textSecondary}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4">
            <p className="text-xs font-medium" style={{ color: textSecondary }}>Payment ID</p>
            <p className="font-mono font-bold text-base mt-0.5" style={{ color: textPrimary }}>{payment.id}</p>
            <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Received on {payment.receivedAt}</p>
          </div>

          <div className="pt-2" style={{ borderTop: `1px solid ${divider}` }}>
            <SectionHeader title="Booking Information" color={textPrimary} />
            <div className="rounded-xl p-3" style={{ background: subtleBoxBg, border: `1px solid ${divider}` }}>
              <InfoRow label="Booking ID" value={payment.bookingId} linkLabel="View Booking" onLink={() => navigate('/admin/approve-bookings', { state: { bookingId: payment.bookingId } })} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Tour Type" value={payment.tourType} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Route" value={payment.route} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Tour Dates" value={payment.tourDates} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Vehicle" value={payment.vehicle} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
            </div>

            <SectionHeader title="Payment Information" color={textPrimary} />
            <div className="rounded-xl p-3" style={{ background: subtleBoxBg, border: `1px solid ${divider}` }}>
              <InfoRow label="Payment Type" value={payment.paymentType} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Amount Paid" value={payment.amountPaid} highlight textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Base Amount" value={payment.baseAmount} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Additional Charges" value={payment.additionalCharges} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Total Amount" value={payment.totalAmount} highlight textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Approved Payments" value={payment.approvedAmount} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Pending Payments" value={payment.pendingAmount} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Due Balance" value={payment.remainingAmount} highlight textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <InfoRow label="Available to Collect" value={payment.availableAmount || payment.remainingAmount} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              <div className="pt-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setInvoiceError("");
                      await downloadPaymentInvoice(payment.booking_id);
                    } catch (err) {
                      setInvoiceError(err.message || 'Invoice download failed.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  style={{ background: BRAND.coral }}
                  onMouseEnter={e => e.currentTarget.style.background = '#d96e41'}
                  onMouseLeave={e => e.currentTarget.style.background = BRAND.coral}
                >
                  Download Booking Invoice
                </button>
                {invoiceError && <p role="alert" className="mt-2 text-xs font-semibold" style={{ color: STATE.danger }}>{invoiceError}</p>}
              </div>
              <InfoRow label="Payment Method" value={payment.paymentMethod} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
              {payment.bankName && <InfoRow label="Bank Name" value={payment.bankName} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />}
              {payment.referenceNumber && <InfoRow label="Reference Number" value={payment.referenceNumber} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />}
              <InfoRow label="Payment Date" value={payment.paymentDate} textPrimary={textPrimary} textSecondary={textSecondary} divider={divider} />
            </div>

            <SectionHeader title="Payment Slip" color={textPrimary} />
            {payment.slip ? <ReceiptDownload slip={payment.slip} dark={dark} /> : <p className="text-xs italic" style={{ color: textSecondary }}>No payment slip uploaded.</p>}

            {/* Additional Charges - Only for Custom and Package tours */}
            {payment.tourType !== 'P2P Tour' && (
              <div
                className="mb-5 mt-5 rounded-2xl p-4 border"
                style={{
                  background: 'rgba(239, 131, 84, 0.08)',
                  borderColor: 'rgba(239, 131, 84, 0.25)',
                }}
              >
                <p className="text-sm font-bold mb-1" style={{ color: textPrimary, fontFamily: "'Montserrat', sans-serif" }}>Additional Mileage Charges</p>
                <p className="text-xs mb-3" style={{ color: textSecondary }}>Add any extra charges incurred during the tour.</p>
                
                {!payment.isBasePricePaid ? (
                  <div className="p-3 rounded-xl border" style={{ background: cardBg, borderColor: cardBorder }}>
                    <p className="text-xs font-semibold flex items-start gap-1.5" style={{ color: STATE.warning }}>
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      Cannot add additional charges yet. The quoted base price must be fully paid and approved first.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs" style={{ color: BRAND.coral }}>LKR</span>
                      <input 
                        type="number" 
                        value={additionalCharges}
                        onChange={(e) => setAdditionalCharges(e.target.value)}
                        style={{
                          background: dark ? '#242838' : '#FFFFFF',
                          borderColor: cardBorder,
                          color: textPrimary,
                        }}
                        className="w-full pl-11 pr-3 py-2 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354]"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button 
                      onClick={handleUpdateCharges}
                      disabled={isUpdatingCharges || additionalCharges === payment.rawAdditionalCharges}
                      className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      style={{ background: BRAND.coral }}
                    >
                      {isUpdatingCharges ? "Updating..." : "Update"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <SectionHeader title="Admin Notes" color={textPrimary} />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this payment (optional)..."
              rows={4}
              style={{
                background: dark ? '#242838' : '#FFFFFF',
                borderColor: cardBorder,
                color: textPrimary,
              }}
              className="w-full text-sm px-3.5 py-2.5 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#EF8354]/20 focus:border-[#EF8354] transition-all"
            />
          </div>
        </div>

        {isPending && (
          <div className="flex gap-3 px-5 py-4 shrink-0" style={{ borderTop: `1px solid ${divider}`, background: cardBg }}>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              style={{ background: STATE.danger }}
            >
              Reject Payment
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              style={{ background: STATE.success }}
            >
              Approve Payment
            </button>
          </div>
        )}
      </div>
    </>
  );
}
