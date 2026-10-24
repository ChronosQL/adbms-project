import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBookings } from "../../../../context/BookingsContext.jsx";

const STATUS_CONFIG = {
  pending: { label: "PENDING VERIFICATION", className: "bg-amber-100 text-amber-700 border border-amber-300" },
  approved: { label: "APPROVED", className: "bg-green-100 text-green-700 border border-green-300" },
  rejected: { label: "REJECTED", className: "bg-red-100 text-red-700 border border-red-300" },
};

function SectionHeader({ title }) {
  return (
    <h3 className="text-sm font-bold text-gray-800 mb-3 mt-5 first:mt-0">{title}</h3>
  );
}

function InfoRow({ label, value, highlight, linkLabel, onLink }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 w-36">{label}</span>
      <div className="flex items-center gap-2 text-right">
        <span className={`text-xs font-medium ${highlight ? "text-teal-600 font-semibold" : "text-gray-800"}`}>
          {value}
        </span>
        {linkLabel && (
          <button onClick={onLink} className="text-xs text-blue-500 hover:underline font-medium">{linkLabel}</button>
        )}
      </div>
    </div>
  );
}

function ReceiptDownload({ slip }) {
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
    <div className="mt-2 border border-gray-200 rounded-xl p-3">
      <div className="p-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-700 truncate">{slip.filename}</p>
          <p className="text-xs text-gray-400 mt-0.5">{slip.size}</p>
          <p className="text-xs text-gray-400">Uploaded on {slip.uploadedAt}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleDownload} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-[#EF8354]/10 border border-[#EF8354]/20 rounded-lg text-[#EF8354] hover:bg-[#EF8354]/15 transition-colors">Download Receipt</button>
        </div>
      </div>
      {fileError && <p role="alert" className="px-3 pb-3 text-xs text-red-700">{fileError}</p>}
    </div>
  );
}

export default function PaymentDetailPanel({ payment = null, onClose = () => {}, onApprove = () => {}, onReject = () => {}, loading = false }) {
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

  const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const isPending = payment.status === "pending";

  const handleApprove = () => onApprove(payment.id, notes);
  const handleReject = () => onReject(payment.id, notes);

  const handleUpdateCharges = async () => {
    try {
      setIsUpdatingCharges(true);
      await updateAdditionalCharges(payment.booking_id, additionalCharges);
      // It will trigger a re-fetch in context, which flows down to here, though payment object here comes from Payments tab
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
      <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-gray-900">Payment Details</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-md tracking-wide ${statusCfg.className}`}>{statusCfg.label}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-0.5">Payment ID</p>
            <p className="font-mono font-bold text-gray-900 text-base">{payment.id}</p>
            <p className="text-xs text-gray-400 mt-0.5">Received on {payment.receivedAt}</p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <SectionHeader title="Booking Information" />
            <div className="bg-gray-50/60 rounded-xl p-3">
              <InfoRow label="Booking ID" value={payment.bookingId} linkLabel="View Booking" onLink={() => navigate('/admin/approve-bookings', { state: { bookingId: payment.bookingId } })} />
              <InfoRow label="Tour Type" value={payment.tourType} />
              <InfoRow label="Route" value={payment.route} />
              <InfoRow label="Tour Dates" value={payment.tourDates} />
              <InfoRow label="Vehicle" value={payment.vehicle} />
            </div>

            <SectionHeader title="Payment Information" />
            <div className="bg-gray-50/60 rounded-xl p-3">
              <InfoRow label="Payment Type" value={payment.paymentType} />
              <InfoRow label="Amount Paid" value={payment.amountPaid} highlight />
              <InfoRow label="Base Amount" value={payment.baseAmount} />
              <InfoRow label="Additional Charges" value={payment.additionalCharges} />
              <InfoRow label="Total Amount" value={payment.totalAmount} highlight />
              <InfoRow label="Approved Payments" value={payment.approvedAmount} />
              <InfoRow label="Pending Receipts" value={payment.pendingAmount} />
              <InfoRow label="Remaining Amount" value={payment.remainingAmount} highlight />
              <div className="pt-3"><button type="button" onClick={async () => { try { setInvoiceError(""); await downloadPaymentInvoice(payment.booking_id); } catch (err) { setInvoiceError(err.message || 'Invoice download failed.'); } }} className="px-3 py-2 rounded-lg bg-[#EF8354] text-white text-xs font-semibold">Download Booking Invoice</button>{invoiceError && <p role="alert" className="mt-2 text-xs text-red-700">{invoiceError}</p>}</div>
              <InfoRow label="Payment Method" value={payment.paymentMethod} />
              {payment.bankName && <InfoRow label="Bank Name" value={payment.bankName} />}
              {payment.referenceNumber && <InfoRow label="Reference Number" value={payment.referenceNumber} />}
              <InfoRow label="Payment Date" value={payment.paymentDate} />
            </div>

            <SectionHeader title="Payment Slip" />
            {payment.slip ? <ReceiptDownload slip={payment.slip} /> : <p className="text-xs text-gray-400 italic">No payment slip uploaded.</p>}

            {/* Additional Charges - Only for Custom and Package tours */}
            {payment.tourType !== 'P2P Tour' && (
              <div className="mb-5 mt-5 bg-teal-50 border border-teal-100 rounded-xl p-4">
                <p className="text-sm font-bold text-teal-800 mb-1">Additional Mileage Charges</p>
                <p className="text-xs text-teal-600 mb-3">Add any extra charges incurred during the tour.</p>
                
                {!payment.isBasePricePaid ? (
                  <div className="bg-white/60 p-3 rounded-lg border border-teal-200/50">
                    <p className="text-xs font-semibold text-teal-700 flex items-start gap-1.5">
                      <span className="mt-0.5">⚠️</span> 
                      Cannot add additional charges yet. The quoted base price must be fully paid and approved first.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 font-bold text-sm">LKR</span>
                      <input 
                        type="number" 
                        value={additionalCharges}
                        onChange={(e) => setAdditionalCharges(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-sm font-semibold text-gray-800"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <button 
                      onClick={handleUpdateCharges}
                      disabled={isUpdatingCharges || additionalCharges === payment.rawAdditionalCharges}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                      {isUpdatingCharges ? "Updating..." : "Update"}
                    </button>
                  </div>
                )}
              </div>
            )}

            <SectionHeader title="Admin Notes" />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this payment (optional)..." rows={4} className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl bg-white resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-300" />
          </div>
        </div>

        {isPending && (
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0 bg-white">
            <button onClick={handleReject} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Reject Payment</button>
            <button onClick={handleApprove} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Approve Payment</button>
          </div>
        )}
      </div>
    </>
  );
}
