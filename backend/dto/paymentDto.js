/**
 * Payment Data Transfer Object (DTO)
 * Normalizes payment submission payloads, references, amounts, and row representations.
 */

const { getBookingReference, formatDate } = require('./bookingDto');

const formatLKR = (val) => {
  return `LKR ${Number(val || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const mapPaymentRow = (r) => ({
  id: `PAY${String(r.payment_id).padStart(3, '0')}`,
  rawId: r.payment_id,
  bookingId: getBookingReference(r.tour_type, r.booking_id),
  booking_id: r.booking_id,
  tourType: r.tour_type === 'PACKAGE' ? 'Package Tour' : r.tour_type === 'CUSTOM' ? 'Customized' : 'P2P Tour',
  customerName: r.customer_name,
  customerPhone: r.customer_phone,
  customerEmail: r.customer_email,
  type: r.installment === 'DEPOSIT' ? 'Deposit' : r.installment === 'FINAL' ? 'Final' : r.installment === 'ADDITIONAL' ? 'Additional Charges' : r.installment === 'PARTIAL' ? 'Installment' : 'Full Payment',
  typePercent: r.installment === 'FULL' ? '100%' : r.installment === 'PARTIAL' ? 'Variable amount' : r.installment === 'ADDITIONAL' ? 'Extra' : 'Legacy installment',
  amount: formatLKR(r.amount),
  rawAmount: parseFloat(r.amount),
  method: r.payment_method === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash',
  date: r.received_date ? (r.received_date instanceof Date ? r.received_date.toISOString().split('T')[0] : String(r.received_date).slice(0, 10)) : 'Pending',
  time: '12:00 PM',
  status: r.status ? r.status.toLowerCase() : 'pending',
  notes: r.notes,
  recordedBy: r.recorded_by_name || 'Customer',
  baseAmount: formatLKR(r.quoted_price || 0),
  additionalCharges: formatLKR(r.additional_charges || 0),
  rawAdditionalCharges: parseFloat(r.additional_charges || 0),
  totalAmount: formatLKR(parseFloat(r.quoted_price || 0) + parseFloat(r.additional_charges || 0)),
  remainingAmount: formatLKR(r.outstanding_balance || 0),
  pendingAmount: formatLKR(r.pending_amount || 0),
  payableAmount: formatLKR(Math.max(0, Number(r.outstanding_balance || 0) - Number(r.pending_amount || 0))),
  tourDates: r.start_date && r.end_date
    ? `${(r.start_date instanceof Date ? r.start_date.toISOString().split('T')[0] : String(r.start_date).slice(0, 10))} to ${(r.end_date instanceof Date ? r.end_date.toISOString().split('T')[0] : String(r.end_date).slice(0, 10))}`
    : 'N/A',
  isBasePricePaid: parseFloat(r.total_paid || 0) >= parseFloat(r.quoted_price || 0),
  slip: r.slip_url ? {
    filename: r.slip_url.split('/').pop().slice(-20),
    size: 'Cloudinary Upload',
    uploadedAt: r.received_date ? (r.received_date instanceof Date ? r.received_date.toISOString().split('T')[0] : String(r.received_date).slice(0, 10)) : 'Pending',
    previewUrl: r.slip_url,
  } : null,
});

const mapTransactionRow = (p, bookingRef) => ({
  id: `TX${String(p.payment_id).padStart(3, '0')}`,
  rawId: p.payment_id,
  date: p.received_date ? (p.received_date instanceof Date ? p.received_date.toISOString().split('T')[0] : String(p.received_date).slice(0, 10)) : 'Pending',
  type: p.installment === 'DEPOSIT' ? 'Deposit' : p.installment === 'FINAL' ? 'Final Payment' : p.installment === 'ADDITIONAL' ? 'Additional Charges' : p.installment === 'PARTIAL' ? 'Installment' : 'Full Payment',
  amount: formatLKR(p.amount),
  rawAmount: Number(p.amount),
  method: p.payment_method === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash',
  status: p.status === 'APPROVED' ? 'VERIFIED' : p.status === 'REJECTED' ? 'REJECTED' : 'PENDING VERIFICATION',
  recordedBy: p.recorded_by_name || 'Customer',
  notes: p.notes,
  slipUrl: p.slip_url,
  tourId: bookingRef || (p.tour_type && p.booking_id ? getBookingReference(p.tour_type, p.booking_id) : '—'),
});

const extractPaymentPayload = (body = {}) => {
  const amountText = String(body.amount ?? '').trim();
  const amountNum = Number(amountText);
  return {
    bookingId: Number(body.booking_id || body.bookingId),
    installment: body.installment ? String(body.installment).trim().toUpperCase() : null,
    amount: !amountText || !Number.isFinite(amountNum) ? null : amountNum,
    amountPrecisionValid: /^\d+(?:\.\d{1,2})?$/.test(amountText),
    paymentMethod: body.payment_method || body.paymentMethod || 'CASH',
    receivedDate: body.received_date || body.receivedDate || new Date().toISOString().slice(0, 10),
    slipUrl: (body.slip_url || body.slipUrl || '').trim() || null,
    notes: body.notes ? String(body.notes).trim() : null,
  };
};

const validatePaymentPayload = (payload) => {
  if (!payload.bookingId || !payload.installment || payload.amount === null || payload.amount <= 0 || !payload.amountPrecisionValid || !payload.receivedDate) {
    return { valid: false, message: 'All required payment fields (booking_id, installment, valid amount, received_date) must be provided.' };
  }
  return { valid: true };
};

module.exports = {
  getBookingReference,
  formatDate,
  formatLKR,
  mapPaymentRow,
  mapTransactionRow,
  extractPaymentPayload,
  validatePaymentPayload,
};
