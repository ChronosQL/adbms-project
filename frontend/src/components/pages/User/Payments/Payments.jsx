import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import { Clock } from 'lucide-react';
import { useBookings } from '../../../../context/BookingsContext.jsx';
import BookingHeader from "./BookingHeader";
import PaymentSummary from "./PaymentSummary";
import PaymentProof from "./PaymentProof";
import PaymentReminders from "./PaymentReminders";
import PaymentInformation from "./PaymentInformation";
import PaymentHistory from "./PaymentHistory";

// ─── Page ─────────────────────────────────────────────────────────────────────
const PaymentPage = ({ bookingId = null, onRequestOpenTab }) => {
  const navigate = useNavigate();
  const { bookings, getPaymentsForBooking, uploadPaymentSlip, downloadPaymentInvoice, downloadPaymentReceipt } = useBookings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [toast, setToast] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const booking = bookings?.find(b => b.id === bookingId || b.booking_id === bookingId || String(b.id) === String(bookingId)) || null;

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getPaymentsForBooking(bookingId)
      .then(data => {
        setPaymentData(data);
        setPayAmount(String(data.payableAmount ?? data.remainingAmount ?? ""));
      })
      .catch(err => {
        console.error("Error loading payment details:", err);
        setError(err.message || "Failed to load payment details.");
      })
      .finally(() => setLoading(false));
  }, [bookingId, getPaymentsForBooking]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <svg className="animate-spin h-8 w-8 text-[#EF8354]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <div className="max-w-md mx-auto my-10 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
        <p className="text-red-700 font-semibold mb-2">Error Loading Payment Info</p>
        <p className="text-red-500 text-sm mb-4">{error || "No booking selected or booking has no price set."}</p>
        <button
          onClick={() => {
            if (typeof onRequestOpenTab === 'function') {
              onRequestOpenTab('bookings');
            } else {
              navigate('/user/profile', { state: { activeTab: 'bookings' } });
            }
          }}
          className="text-xs font-semibold text-white bg-[#EF8354] hover:bg-[#4F5D75] px-4 py-2 rounded-xl transition cursor-pointer"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const price = paymentData.totalAmount || 0;
  const paid = paymentData.paidAmount || 0;
  const remaining = paymentData.remainingAmount !== undefined ? paymentData.remainingAmount : price;
  
  const paymentStatus = remaining <= 0 ? 'FULLY PAID' : (paid > 0 ? 'PARTIALLY PAID' : 'PENDING PAYMENT');
  const effectiveStatus = booking?.status || paymentData?.bookingStatus || 'PENDING';
  const tourStarted = ['TOUR_STARTED', 'COMPLETED', 'CLOSED'].includes(effectiveStatus);

  const paidPercent = price > 0 ? Math.round((paid / price) * 100) : 0;
  const remainingPercent = price > 0 ? Math.round((remaining / price) * 100) : 100;

  // Build reminders dynamically
  const reminders = [];
  if (!tourStarted) {
    reminders.push({
      type: "info",
      message: "Payment options will become available once your tour has commenced."
    });
  } else if (remaining > 0) {
    reminders.push({
      type: "warning",
      message: paymentData.nextPaymentNote || `Please complete your payment before deadline.`
    });
  } else {
    reminders.push({
      type: "info",
      message: "Your tour is fully paid! Thank you for choosing Ceylon Best Tours."
    });
  }

  const handleUpload = async ({ file, notes }) => {
    if (!paymentMethod) {
      showToast("Choose cash or bank transfer for this payment.", "error");
      return;
    }
    if (paymentMethod === 'BANK_TRANSFER' && !file) return;

    const amount = Number(payAmount);
    const payableAmount = Number(paymentData.payableAmount ?? remaining);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Please enter a valid positive payment amount.", "error");
      return;
    }
    if (Math.round(amount * 100) > Math.round(payableAmount * 100)) {
      showToast(`Warning: The entered amount (LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}) exceeds the remaining payable balance of LKR ${payableAmount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}.`, "warning");
      return;
    }

    const formData = new FormData();
    formData.append('booking_id', bookingId);
    formData.append('installment', amount >= payableAmount ? 'FULL' : 'PARTIAL');
    formData.append('payment_method', paymentMethod);
    formData.append('amount', amount.toFixed(2));
    formData.append('notes', notes || '');
    if (paymentMethod === 'BANK_TRANSFER' && file) formData.append('slip', file);

    try {
      setSubmitting(true);
      await uploadPaymentSlip(formData);
      showToast("Payment submitted successfully. It is awaiting admin verification.", "success");
      try {
        const updated = await getPaymentsForBooking(bookingId);
        setPaymentData(updated);
        setPayAmount(String(updated.payableAmount ?? updated.remainingAmount ?? ""));
      } catch (refreshError) {
        console.error("Receipt submitted but payment history could not refresh:", refreshError);
        showToast("Receipt submitted. Payment history could not refresh; reload this page to see its status.", "info");
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to upload payment slip.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const currentPaidInstallments = paymentData.installments.filter(i => i.status === 'PAID');
  const pendingTx = paymentData.transactions.find(t => t.status === 'PENDING VERIFICATION');

  const uploadedMessageText = pendingTx 
    ? "Payment submitted for verification"
    : (currentPaidInstallments.length > 0 
      ? `${currentPaidInstallments.map(i => i.type).join(' & ')} Paid`
      : null);

  const uploadedSubtextText = pendingTx
    ? `Your ${pendingTx.method.toLowerCase()} payment is awaiting admin verification.`
    : (currentPaidInstallments.length > 0
      ? `LKR ${paid.toLocaleString('en-LK', { minimumFractionDigits: 2 })} successfully received and verified.`
      : null);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <BookingHeader
              bookingId={paymentData.bookingReference}
              tourName={booking?.packageName || (paymentData.tourType === 'P2P' ? 'Point-to-Point Tour' : paymentData.tourType === 'CUSTOM' ? 'Customized Tour' : 'Package Tour')}
              tourStatus={booking?.status || 'CONFIRMED'}
              onBack={() => {
                if (typeof onRequestOpenTab === 'function') {
                  onRequestOpenTab('bookings', bookingId);
                } else {
                  navigate('/user/profile', { state: { activeTab: 'bookings' } });
                }
              }}
            />

            {/* Payment Summary */}
            <PaymentSummary
              totalAmount={`LKR ${price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`}
              paidAmount={`LKR ${paid.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`}
              remainingAmount={`LKR ${remaining.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`}
              paymentStatus={paymentStatus}
              paidSubtext={paid > 0 ? `${paidPercent}% of total` : ''}
              remainingSubtext={price > 0 ? `${remainingPercent}% due after approved payments` : ''}
              nextPaymentNote={paymentData.nextPaymentNote}
            />

            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-500">Approved payments</p><p className="font-semibold text-green-700 tabular-nums">LKR {paid.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p></div>
              <div><p className="text-xs text-gray-500">Pending verification</p><p className="font-semibold text-amber-700 tabular-nums">LKR {Number(paymentData.pendingAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p></div>
              <div><p className="text-xs text-gray-500">Due after approved payments</p><p className="font-semibold text-[#EF8354] tabular-nums">LKR {remaining.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p></div>
            </div>

            {/* Two-column section */}
            <div className="grid grid-cols-3 gap-5">
              {/* Left: Proof upload */}
              <div className="col-span-2">
                {!tourStarted ? (
                  <div className="bg-white rounded-2xl border border-[#EF8354]/20 shadow-sm p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-[#EF8354]/10 text-[#EF8354] flex items-center justify-center mb-4">
                      <Clock size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Payment Option Unavailable</h3>
                    <p className="text-sm text-gray-500 max-w-sm mb-4 leading-relaxed">
                      In accordance with our booking policy, payment options and receipt upload become available once your tour has commenced (Tour Status: TOUR_STARTED).
                    </p>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Current Booking Status: {effectiveStatus.replace("_", " ")}
                    </span>
                  </div>
                ) : remaining > 0 ? (
                  <PaymentProof
                    uploadedMessage={uploadedMessageText}
                    uploadedSubtext={uploadedSubtextText}
                    uploadLabel="Upload Receipt Copy"
                    uploadSublabel="(Offline verification)"
                    amount={payAmount}
                    paymentMethod={paymentMethod}
                    onPaymentMethodChange={setPaymentMethod}
                    maxAmount={Number(paymentData.payableAmount ?? remaining)}
                    onAmountChange={setPayAmount}
                    submitting={submitting}
                    onUpload={handleUpload}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Tour Fully Paid</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      We have verified your payments. No further transactions or uploads are required for this booking.
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Reminders + Info */}
              <div className="col-span-1 flex flex-col gap-4">
                <PaymentReminders reminders={reminders} />
                <PaymentInformation
                  paymentMethod={paymentMethod === 'CASH' ? 'Cash (admin verification)' : paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Select per payment'}
                  bankName="Commercial Bank"
                  accountNumber="1234 5678 9012"
                  accountName="Ceylon Best Tours (Pvt) Ltd"
                  onDownloadInvoice={async () => {
                    try { await downloadPaymentInvoice(bookingId); }
                    catch (err) { showToast(err.message || "Failed to download invoice.", "error"); }
                  }}
                />
              </div>
            </div>

            {/* History */}
            <div className="mt-5">
              <PaymentHistory
                transactions={paymentData.transactions}
                downloadPaymentReceipt={downloadPaymentReceipt}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all duration-300 transform translate-y-0 scale-100 ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : toast.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {toast.type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</div>
          ) : toast.type === 'warning' ? (
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">!</div>
          ) : toast.type === 'error' ? (
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">!</div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">i</div>
          )}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
