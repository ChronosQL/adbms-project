import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../config/api";

const BookingsContext = createContext();

export const BookingsProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);

  // ── Fetch customer's own bookings ──────────────────────────────────────────
  const getCustomerBookings = useCallback(async () => {
    const data = await api.get("/bookings/my");
    setBookings(data.bookings);
    return data.bookings;
  }, []);

  // ── Fetch ALL bookings (admin) ─────────────────────────────────────────────
  const getAllBookings = useCallback(async () => {
    const data = await api.get("/bookings");
    setBookings(data.bookings);
    return data.bookings;
  }, []);

  // ── Admin: set quoted price + vehicle ──────────────────────────────────────
  const setQuotedPrice = useCallback(async (bookingId, price, vehicleInfo = null, adminNote = null) => {
    await api.patch(`/bookings/${bookingId}/quote`, {
      quotedPrice: price,
      vehicleId: vehicleInfo?.id || null,
      adminNote,
    });
    await getAllBookings();
  }, [getAllBookings]);

  // ── Admin: set additional charges ──────────────────────────────────────────
  const updateAdditionalCharges = useCallback(async (bookingId, additionalCharges) => {
    const res = await api.patch(`/bookings/${bookingId}/additional-charges`, { additionalCharges });
    await getAllBookings();
    return res;
  }, [getAllBookings]);


  // ── Update booking status ──────────────────────────────────────────────────
  const updateBookingStatus = useCallback(async (bookingId, status, adminNote = undefined) => {
    await api.patch(`/bookings/${bookingId}/status`, { status, adminNote });
    // Refresh whichever list is loaded
    try { await getAllBookings(); } catch { await getCustomerBookings(); }
  }, [getAllBookings, getCustomerBookings]);

  // ── Customer: accept / reject / cancel ────────────────────────────────────
  const acceptQuote    = (id) => updateBookingStatus(id, "ACCEPTED");
  const rejectQuote    = (id) => updateBookingStatus(id, "REJECTED");
  const cancelBooking  = (id) => updateBookingStatus(id, "CANCELLED");

  const downloadConfirmationPdf = useCallback(async (bookingId) => {
    const { blob, fileName } = await api.getBlob(`/bookings/${bookingId}/confirmation-pdf`);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName || `booking-confirmation-${bookingId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const downloadPaymentInvoice = useCallback(async (bookingId) => {
    const { blob, fileName } = await api.getBlob(`/payments/booking/${bookingId}/invoice`);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName || `invoice-${bookingId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }, []);

  const downloadPaymentReceipt = useCallback(async (paymentId) => {
    const { downloadUrl, fileName } = await api.get(`/payments/${paymentId}/receipt/download-url`);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = fileName || `payment-receipt-${paymentId}`;
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, []);

  // ── Payments Integration ──────────────────────────────────────────────────
  const getPaymentsForBooking = useCallback(async (bookingId) => {
    return await api.get(`/payments/booking/${bookingId}`);
  }, []);

  const getAllPayments = useCallback(async () => {
    const data = await api.get(`/payments`);
    setPayments(data.payments || []);
    return data.payments;
  }, []);

  const recordPayment = useCallback(async (paymentData) => {
    const res = paymentData instanceof FormData
      ? await api.upload(`/payments`, paymentData)
      : await api.post(`/payments`, paymentData);
    await getAllPayments();
    try { await getAllBookings(); } catch { await getCustomerBookings(); }
    return res;
  }, [getAllBookings, getCustomerBookings, getAllPayments]);

  const uploadPaymentSlip = useCallback(async (formData) => {
    return await api.upload('/payments/upload-slip', formData);
  }, []);

  const approvePayment = useCallback(async (paymentId, notes) => {
    const res = await api.patch(`/payments/${paymentId}/approve`, { notes });
    await getAllPayments();
    return res;
  }, [getAllPayments]);

  const rejectPayment = useCallback(async (paymentId, notes) => {
    const res = await api.patch(`/payments/${paymentId}/reject`, { notes });
    await getAllPayments();
    return res;
  }, [getAllPayments]);

  // ── Pending count for admin badge ─────────────────────────────────────────
  const getPendingCount = () => bookings.filter((b) => b.status === "PENDING").length;
  const getPendingPaymentsCount = () => payments.filter((p) => p.status === "pending").length;

  return (
    <BookingsContext.Provider
      value={{
        bookings,
        payments,
        getCustomerBookings,
        getAllBookings,
        setQuotedPrice,
        updateAdditionalCharges,
        updateBookingStatus,
        acceptQuote,
        rejectQuote,
        cancelBooking,
        downloadConfirmationPdf,
        downloadPaymentInvoice,
        downloadPaymentReceipt,
        getPendingCount,
        getPendingPaymentsCount,
        getPaymentsForBooking,
        recordPayment,
        getAllPayments,
        uploadPaymentSlip,
        approvePayment,
        rejectPayment,
      }}
    >
      {children}
    </BookingsContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingsContext);
  if (!context) throw new Error("useBookings must be used within a BookingsProvider");
  return context;
};
