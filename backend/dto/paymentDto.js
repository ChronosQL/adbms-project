/**
 * Payment Data Transfer Object (DTO)
 * Normalizes payment submission payloads, references, and amounts.
 */

const normalizeTourType = (value) => String(value || 'P2P').toUpperCase();

const getBookingReference = (tourType, bookingId) => {
  const type = normalizeTourType(tourType);
  const typeCode = type === 'PACKAGE' ? 'PKG' : type === 'CUSTOM' ? 'CUS' : 'P2P';
  return `CBT-${typeCode}-${bookingId}`;
};

const formatLKR = (val) => {
  return `LKR ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const extractPaymentPayload = (body = {}) => {
  const amountNum = parseFloat(body.amount);
  return {
    bookingId: Number(body.booking_id || body.bookingId),
    installment: body.installment ? String(body.installment).trim().toUpperCase() : null,
    amount: isNaN(amountNum) ? null : amountNum,
    paymentMethod: body.payment_method || body.paymentMethod || 'CASH',
    receivedDate: body.received_date || body.receivedDate || new Date().toISOString().slice(0, 10),
    notes: body.notes ? String(body.notes).trim() : null,
  };
};

const validatePaymentPayload = (payload) => {
  if (!payload.bookingId || !payload.installment || payload.amount === null || payload.amount <= 0) {
    return { valid: false, message: 'Valid booking_id, installment, and a positive amount are required.' };
  }
  return { valid: true };
};

module.exports = {
  normalizeTourType,
  getBookingReference,
  formatLKR,
  extractPaymentPayload,
  validatePaymentPayload,
};
