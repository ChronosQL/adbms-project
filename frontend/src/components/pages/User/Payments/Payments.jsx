import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import { useBookings } from '../../../../context/BookingsContext.jsx';
import BookingHeader from "./BookingHeader";
import PaymentSummary from "./PaymentSummary";
import PaymentBreakdown from "./PaymentBreakdown";
import PaymentProof from "./PaymentProof";
import PaymentReminders from "./PaymentReminders";
import PaymentInformation from "./PaymentInformation";
import PaymentHistory from "./PaymentHistory";

// ─── Page ─────────────────────────────────────────────────────────────────────
const PaymentPage = ({ bookingId = null, onRequestOpenTab }) => {
  const navigate = useNavigate();
  const { bookings, getPaymentsForBooking, uploadPaymentSlip } = useBookings();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [toast, setToast] = useState(null);

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
        <svg className="animate-spin h-8 w-8 text-teal-600" viewBox="0 0 24 24" fill="none">
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
          className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition"
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
  const paidPercent = price > 0 ? Math.round((paid / price) * 100) : 0;
  const remainingPercent = price > 0 ? Math.round((remaining / price) * 100) : 100;

  // Build reminders dynamically
  const reminders = [];
  if (remaining > 0) {
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
    if (!file) return;

    const currentPendingInstallment = paymentData.installments.find(i => i.status === 'PENDING' || i.status === 'OVERDUE');
    const installmentType = currentPendingInstallment 
      ? (currentPendingInstallment.type === 'Deposit' ? 'DEPOSIT' : currentPendingInstallment.type === 'Final Payment' ? 'FINAL' : currentPendingInstallment.type === 'Additional Charges' ? 'ADDITIONAL' : 'FULL')
      : 'FULL';
    
    const installmentAmount = Math.min(
      currentPendingInstallment ? currentPendingInstallment.rawAmount : remaining,
      remaining
    );

    const formData = new FormData();
    formData.append('booking_id', bookingId);
    formData.append('installment', installmentType);
    formData.append('amount', installmentAmount);
    formData.append('notes', notes || '');
    formData.append('slip', file);

    try {
      setLoading(true);
      await uploadPaymentSlip(formData);
      showToast("Payment slip uploaded successfully! Under review.", "success");
      const updated = await getPaymentsForBooking(bookingId);
      setPaymentData(updated);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to upload payment slip.", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentPaidInstallments = paymentData.installments.filter(i => i.status === 'PAID');
  const pendingTx = paymentData.transactions.find(t => t.status === 'PENDING VERIFICATION');

  const uploadedMessageText = pendingTx 
    ? "Payment slip uploaded!" 
    : (currentPaidInstallments.length > 0 
      ? `${currentPaidInstallments.map(i => i.type).join(' & ')} Paid`
      : null);

  const uploadedSubtextText = pendingTx
    ? "Your payment proof is under verification by admin."
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
              remainingSubtext={price > 0 ? `${remainingPercent}% remaining` : ''}
              nextPaymentNote={paymentData.nextPaymentNote}
            />

            {/* Breakdown */}
            <PaymentBreakdown
              installments={paymentData.installments}
              onViewDetails={(item) => showToast(`${item.type} (LKR ${item.amount}): Due ${item.dueDate} - ${item.dueDateNote}`, "info")}
              onPayNow={(item) => showToast(`Please transfer due amount to bank details below. Admin will confirm receipt.`, "info")}
            />

            {/* Two-column section */}
            <div className="grid grid-cols-3 gap-5">
              {/* Left: Proof upload */}
              <div className="col-span-2">
                {remaining > 0 ? (
                  <PaymentProof
                    uploadedMessage={uploadedMessageText}
                    uploadedSubtext={uploadedSubtextText}
                    uploadLabel="Upload Receipt Copy"
                    uploadSublabel="(Offline verification)"
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
                  paymentMethod="Bank Transfer"
                  bankName="Commercial Bank"
                  accountNumber="1234 5678 9012"
                  accountName="Ceylon Best Tours (Pvt) Ltd"
                  onDownloadInvoice={() => showToast("Invoice download function will be available shortly.", "info")}
                />
              </div>
            </div>

            {/* History */}
            <div className="mt-5">
              <PaymentHistory
                transactions={paymentData.transactions}
                onViewSlip={(tx) => showToast(`TX details: Received on ${tx.date} via ${tx.method}. Recorded by ${tx.recordedBy}. Notes: ${tx.notes || 'None'}`, "info")}
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
              ? 'bg-red-50 border-red-100 text-red-800'
              : toast.type === 'info'
              ? 'bg-blue-50 border-blue-100 text-blue-800'
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}
        >
          {toast.type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</div>
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