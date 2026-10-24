import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  FileCheck2,
  PlusCircle,
  CreditCard,
  Building2,
  Banknote,
} from "lucide-react";
import { useBookings } from "../../../../context/BookingsContext";
import { useOutletContext } from "react-router-dom";
import { BRAND, FONT, getTheme } from "../AdminDashboard/adminTheme";
import Pagination from "../../../common/Pagination";
import PaymentStatsBar from "./Paymentstatsbar";
import PaymentFilters from "./Paymentfilters";
import PaymentTable from "./Paymenttable";
import PaymentDetailPanel from "./Paymentdetailpanel";

const STATUS_CFG = {
  PENDING:      { label: "Pending",      color: "#f59e0b" },
  QUOTED:       { label: "Quoted",       color: "#6366f1" },
  ACCEPTED:     { label: "Accepted",     color: "#10b981" },
  CONFIRMED:    { label: "Confirmed",    color: "#2F9E44" },
  TOUR_STARTED: { label: "Tour Started", color: "#0891b2" },
  COMPLETED:    { label: "Completed",    color: "#4F5D75" },
  CLOSED:       { label: "Closed",       color: "#94a3b8" },
  CANCELLED:    { label: "Cancelled",    color: "#ef4444" },
  REJECTED:     { label: "Rejected",     color: "#ef4444" },
};

// Statuses where offline payment recording is appropriate
const PAYABLE_STATUSES = ["COMPLETED", "CONFIRMED", "TOUR_STARTED", "CLOSED", "ACCEPTED"];

function BookingStatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: "#94a3b8" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: cfg.color,
        background: `${cfg.color}18`,
        fontFamily: FONT.body,
      }}
    >
      {cfg.label}
    </span>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const isError = type === "error";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        borderRadius: 16,
        background: isError ? "#fff1f2" : "#f0fdf4",
        border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
        fontFamily: FONT.body,
        fontWeight: 600,
        fontSize: 14,
        color: isError ? "#991b1b" : "#166534",
      }}
    >
      {isError ? <AlertCircle size={18} color="#ef4444" /> : <CheckCircle size={18} color="#22c55e" />}
      {message}
    </div>
  );
}

export default function PaymentApprovalsPage() {
  const context = useOutletContext();
  const dark = context?.dark ?? false;
  const t = getTheme(dark);
  const {
    bookings,
    getAllBookings,
    getAllPayments,
    recordPayment,
    getPaymentsForBooking,
    approvePayment,
    rejectPayment,
  } = useBookings();

  // ── Top Navigation View Switcher ──
  const [activeView, setActiveView] = useState("audit"); // "audit" | "record"

  // ── Audit View State ──
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters for Audit View
  const [activeTab, setActiveTab] = useState("all");
  const [auditFilters, setAuditFilters] = useState({ search: "", type: "", method: "" });
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(10);

  // ── Record Payment View State (Preserved Bookings Register) ──
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingPayments, setBookingPayments] = useState([]);
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingLimit, setBookingLimit] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    amount: "",
    payment_method: "CASH", // "CASH" or "BANK_TRANSFER"
    received_date: new Date().toISOString().split("T")[0],
    slipFile: null,
    notes: "",
    installment: "FULL",
  });

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  // Fetch all payments for Audit log
  const fetchAllPaymentsList = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const data = await getAllPayments();
      setPayments(data || []);
    } catch (err) {
      console.error("Error loading payments:", err);
      showToast(err.message || "Failed to load payments audit log.", "error");
    } finally {
      setPaymentsLoading(false);
    }
  }, [getAllPayments, showToast]);

  useEffect(() => {
    fetchAllPaymentsList();
    getAllBookings().catch(console.error);
  }, [fetchAllPaymentsList, getAllBookings]);

  // Handle select payment in Audit table
  const handleSelectPayment = useCallback(async (payment) => {
    setSelectedPayment(payment);
    setPanelLoading(true);

    const detail = {
      id: payment.id,
      status: payment.status,
      receivedAt: `${payment.date} at ${payment.time}`,
      bookingId: payment.bookingId,
      booking_id: payment.booking_id,
      tourType: payment.tourType,
      route: "–",
      tourDates: payment.tourDates,
      vehicle: "–",
      paymentType: `${payment.type} (${payment.typePercent})`,
      amountPaid: payment.amount,
      totalAmount: payment.totalAmount || payment.amount,
      remainingAmount: payment.payableAmount || payment.remainingAmount || "–",
      paymentMethod: payment.method,
      bankName: payment.method === "Bank Transfer" ? "Commercial Bank" : null,
      referenceNumber: payment.method === "Bank Transfer" ? `REF${payment.rawId}` : null,
      paymentDate: payment.date,
      slip: payment.slip,
      notes: payment.notes,
      rawAdditionalCharges: payment.rawAdditionalCharges,
    };

    setDetailData(detail);
    setPanelLoading(false);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedPayment(null);
    setDetailData(null);
  }, []);

  // Handle Approve bank transfer
  const handleApprove = useCallback(
    async (paymentId, notes) => {
      setActionLoading(true);
      try {
        const targetPayment = payments.find((p) => p.id === paymentId);
        const rawId = targetPayment ? targetPayment.rawId : paymentId;
        await approvePayment(rawId, notes);
        showToast("Payment approved successfully!", "success");
        await fetchAllPaymentsList();
        handleClosePanel();
      } catch (err) {
        console.error(err);
        showToast(err.message || "Failed to approve payment.", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [payments, approvePayment, fetchAllPaymentsList, handleClosePanel, showToast]
  );

  // Handle Reject bank transfer
  const handleReject = useCallback(
    async (paymentId, notes) => {
      setActionLoading(true);
      try {
        const targetPayment = payments.find((p) => p.id === paymentId);
        const rawId = targetPayment ? targetPayment.rawId : paymentId;
        await rejectPayment(rawId, notes);
        showToast("Payment rejected successfully!", "success");
        await fetchAllPaymentsList();
        handleClosePanel();
      } catch (err) {
        console.error(err);
        showToast(err.message || "Failed to reject payment.", "error");
      } finally {
        setActionLoading(false);
      }
    },
    [payments, rejectPayment, fetchAllPaymentsList, handleClosePanel, showToast]
  );

  // Handle select booking in Record Payment view
  const handleSelectBooking = async (b) => {
    setSelectedBooking(b);
    setFormError("");
    try {
      const data = await getPaymentsForBooking(b.id);
      setBookingPayments(data.transactions || []);
    } catch {
      setBookingPayments([]);
    }
  };

  // Submit recorded payment (Cash or Bank Transfer)
  const handleSubmitPayment = async () => {
    if (!selectedBooking) return;
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setFormError("Please enter a valid positive amount.");
      return;
    }
    if (!form.received_date) {
      setFormError("Please select the date received.");
      return;
    }

    const isCash = form.payment_method === "CASH";
    const isCashAllowed = selectedBooking.status === "TOUR_STARTED" || selectedBooking.status === "COMPLETED";
    if (isCash && !isCashAllowed) {
      setFormError(`Cash payment can only be recorded when the tour is TOUR_STARTED or COMPLETED (current status: ${selectedBooking.status}).`);
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const paymentPayload = new FormData();
      paymentPayload.append("booking_id", selectedBooking.id);
      paymentPayload.append("amount", String(amount));
      paymentPayload.append("payment_method", form.payment_method);
      paymentPayload.append("received_date", form.received_date);
      paymentPayload.append("notes", form.notes || "");
      paymentPayload.append("installment", amount >= payableBooking ? "FULL" : "PARTIAL");
      if (form.slipFile) paymentPayload.append("slip", form.slipFile);
      await recordPayment(paymentPayload);

      const methodLabel = form.payment_method === "BANK_TRANSFER" ? "Bank Transfer" : "Cash payment";
      showToast(`${methodLabel} recorded successfully.`, "success");

      // Refresh payments for this booking & full audit list
      const data = await getPaymentsForBooking(selectedBooking.id);
      setBookingPayments(data.transactions || []);
      await fetchAllPaymentsList();

      setForm({
        amount: "",
        payment_method: "CASH",
        received_date: new Date().toISOString().split("T")[0],
        slipFile: null,
        notes: "",
        installment: "FULL",
      });
    } catch (err) {
      showToast(err.message || "Failed to record payment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Calculations for Audit View ──
  const filteredPayments = payments.filter((p) => {
    if (activeTab !== "all" && p.status !== activeTab) return false;
    if (auditFilters.type && p.type.toLowerCase() !== auditFilters.type) return false;
    if (auditFilters.method) {
      const pMethod = (p.method || "").toLowerCase();
      if (auditFilters.method === "cash" && !pMethod.includes("cash")) return false;
      if (auditFilters.method === "bank_transfer" && !pMethod.includes("bank")) return false;
    }
    if (auditFilters.search) {
      const q = auditFilters.search.toLowerCase();
      const match = [p.id, p.bookingId, p.customerName, p.customerPhone, p.method].some(
        (v) => v && String(v).toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    return true;
  });

  const totalAuditPages = Math.max(1, Math.ceil(filteredPayments.length / auditLimit));
  const currentAuditPage = Math.min(auditPage, totalAuditPages);
  const paginatedAuditPayments = filteredPayments.slice(
    (currentAuditPage - 1) * auditLimit,
    currentAuditPage * auditLimit
  );

  const counts = {
    all: payments.length,
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };

  const totalReceivedVal = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + (p.rawAmount || 0), 0);
  const totalReceivedLabel = `LKR ${totalReceivedVal.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const stats = {
    pendingCount: counts.pending,
    approvedCount: counts.approved,
    rejectedCount: counts.rejected,
    totalReceivedLabel: totalReceivedLabel,
    totalPaymentsCount: payments.filter((p) => p.status === "approved").length,
  };

  // ── Calculations for Record Payment Register (Preserved Bookings) ──
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    if (!matchesStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (b.bookingRef || "").toLowerCase().includes(q) ||
      (b.customerName || "").toLowerCase().includes(q) ||
      String(b.id).includes(q)
    );
  });

  const totalBookingPages = Math.ceil(filteredBookings.length / bookingLimit) || 1;
  const currentBookingPage = Math.min(bookingPage, totalBookingPages);
  const paginatedBookings = filteredBookings.slice(
    (currentBookingPage - 1) * bookingLimit,
    currentBookingPage * bookingLimit
  );

  const approvedBookingPayments = bookingPayments.filter((p) => p.status === "VERIFIED");
  const pendingBookingPayments = bookingPayments.filter((p) => p.status === "PENDING VERIFICATION");
  const totalPaidBooking = approvedBookingPayments.reduce(
    (sum, p) => sum + Number(p.rawAmount || 0),
    0
  );
  const pendingPaidBooking = pendingBookingPayments.reduce((sum, p) => sum + Number(p.rawAmount || 0), 0);
  const quotedPriceBooking = Number(selectedBooking?.quotedPrice || 0) + Number(selectedBooking?.additionalCharges || 0);
  const outstandingBooking = Math.max(0, quotedPriceBooking - totalPaidBooking);
  const payableBooking = Math.max(0, outstandingBooking - pendingPaidBooking);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
    background: dark ? "#1e293b" : "#f8fafc",
    color: dark ? "#f1f5f9" : "#1e293b",
    fontSize: 14,
    fontFamily: FONT.body,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, padding: "28px 32px", fontFamily: FONT.body }}>
      {/* ── Top Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: BRAND.coral,
              margin: 0,
            }}
          >
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <h1
            style={{
              fontFamily: FONT.heading,
              fontSize: 28,
              fontWeight: 900,
              color: t.textPrimary,
              margin: "4px 0 0",
              letterSpacing: "-0.02em",
            }}
          >
            Payments & Cash Register
          </h1>
          <p style={{ fontSize: 13, color: t.textSecondary, margin: "4px 0 0" }}>
            Audit all Cash and Bank Transfer transactions, verify customer payment slips, or record offline payments.
          </p>
        </div>

        {/* ── View Switcher Buttons ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: dark ? "#1e293b" : "#f1f5f9",
            padding: 4,
            borderRadius: 12,
            gap: 4,
            border: `1px solid ${t.cardBorder}`,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveView("audit")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: FONT.body,
              transition: "all 0.15s ease",
              background: activeView === "audit" ? (dark ? "#0f172a" : "#fff") : "transparent",
              color: activeView === "audit" ? BRAND.coral : t.textSecondary,
              boxShadow: activeView === "audit" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <FileCheck2 size={15} />
            <span>Audit & Approvals</span>
            {counts.pending > 0 && (
              <span
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 999,
                }}
              >
                {counts.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView("record")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: FONT.body,
              transition: "all 0.15s ease",
              background: activeView === "record" ? (dark ? "#0f172a" : "#fff") : "transparent",
              color: activeView === "record" ? BRAND.coral : t.textSecondary,
              boxShadow: activeView === "record" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <PlusCircle size={15} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div style={{ marginBottom: 20 }}>
        <PaymentStatsBar stats={stats} />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: AUDIT & APPROVALS (All CASH & BANK_TRANSFER)
      ───────────────────────────────────────────────────────────── */}
      {activeView === "audit" && (
        <div>
          <PaymentFilters
            counts={counts}
            filters={auditFilters}
            onFilterChange={(key, val) => {
              setAuditFilters((prev) => ({ ...prev, [key]: val }));
              setAuditPage(1);
            }}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setAuditPage(1);
            }}
          />

          <PaymentTable
            payments={paginatedAuditPayments}
            selectedId={selectedPayment?.id ?? null}
            onSelect={handleSelectPayment}
            pagination={{
              current: currentAuditPage,
              total: totalAuditPages,
              totalItems: filteredPayments.length,
              perPage: auditLimit,
            }}
            onPageChange={setAuditPage}
            onLimitChange={(newLimit) => {
              setAuditLimit(newLimit);
              setAuditPage(1);
            }}
            loading={paymentsLoading}
          />

          {selectedPayment && (
            <PaymentDetailPanel
              payment={panelLoading ? { ...selectedPayment, status: selectedPayment.status } : detailData}
              onClose={handleClosePanel}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={actionLoading || panelLoading}
            />
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VIEW 2: RECORD PAYMENT REGISTER (Preserving Pagination)
      ───────────────────────────────────────────────────────────── */}
      {activeView === "record" && (
        <div>
          {/* Informational banner */}
          <div
            style={{
              background: dark ? "rgba(239,131,84,0.1)" : "#fff7ed",
              border: `1px solid ${dark ? "rgba(239,131,84,0.3)" : "#fed7aa"}`,
              borderRadius: 14,
              padding: "12px 18px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: dark ? "#fdba74" : "#c2410c",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <Banknote size={18} />
            Record payments collected in Cash or via direct Bank Transfer for any booking. All recorded transactions immediately sync with the audit log.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
            {/* ── LEFT: Booking List with Pagination ── */}
            <div style={{ background: t.cardBg, borderRadius: 16, border: `1px solid ${t.cardBorder}`, overflow: "hidden" }}>
              {/* Search + Filter */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${t.divider}`,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, position: "relative", minWidth: 200 }}>
                  <Search
                    size={15}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: t.textSecondary,
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search by booking ref, customer name…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setBookingPage(1);
                    }}
                    style={{ ...inputStyle, paddingLeft: 34 }}
                  />
                </div>
                <div style={{ position: "relative" }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setBookingPage(1);
                    }}
                    style={{ ...inputStyle, width: "auto", paddingRight: 32, appearance: "none" }}
                  >
                    <option value="ALL">All Statuses</option>
                    {Object.entries(STATUS_CFG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: t.textSecondary,
                    }}
                  />
                </div>
              </div>

              {/* Booking rows */}
              {filteredBookings.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: t.textSecondary, fontSize: 13 }}>
                  No bookings match your filter.
                </div>
              ) : (
                <>
                  <div style={{ overflowY: "auto", maxHeight: 560 }}>
                    {paginatedBookings.map((b) => (
                      <div
                        key={b.id}
                        className={`pay-row${selectedBooking?.id === b.id ? " selected" : ""}`}
                        onClick={() => handleSelectBooking(b)}
                        style={{
                          padding: "14px 20px",
                          borderBottom: `1px solid ${t.divider}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          transition: "background 0.15s",
                          cursor: "pointer",
                          background: selectedBooking?.id === b.id ? (dark ? "rgba(239,131,84,0.15)" : "#fff7ed") : "transparent",
                        }}
                      >
                        <div>
                          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 13, color: BRAND.coral }}>
                            {b.bookingRef || `#${b.id}`}
                          </div>
                          <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                            {b.customerName || "—"} ·{" "}
                            {b.tourType === "PACKAGE"
                              ? b.packageName || "Package"
                              : `${b.startLocation || "?"} → ${b.endLocation || "?"}`}
                          </div>
                          <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 1 }}>
                            {b.startDate || "—"}
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <BookingStatusBadge status={b.status} />
                          {b.quotedPrice && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary }}>
                              ${b.quotedPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredBookings.length > bookingLimit && (
                    <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.divider}` }}>
                      <Pagination
                        pagination={{
                          page: currentBookingPage,
                          totalPages: totalBookingPages,
                          total: filteredBookings.length,
                          limit: bookingLimit,
                        }}
                        onPageChange={setBookingPage}
                        onLimitChange={(newLimit) => {
                          setBookingLimit(newLimit);
                          setBookingPage(1);
                        }}
                        limitOptions={[6, 8, 16]}
                        itemLabel="bookings"
                        scrollToRef={false}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── RIGHT: Record Payment Form ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {!selectedBooking ? (
                <div
                  style={{
                    background: t.cardBg,
                    border: `1px solid ${t.cardBorder}`,
                    borderRadius: 16,
                    padding: 40,
                    textAlign: "center",
                    color: t.textSecondary,
                    fontSize: 13,
                  }}
                >
                  <DollarSign size={40} style={{ marginBottom: 12, opacity: 0.3, color: t.textSecondary }} />
                  <p>Select a booking from the list to record a payment.</p>
                </div>
              ) : (
                <>
                  {/* Booking Summary */}
                  <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: 20 }}>
                    <p
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: t.textSecondary,
                        marginBottom: 8,
                      }}
                    >
                      Selected Booking
                    </p>
                    <div style={{ fontFamily: FONT.heading, fontSize: 18, fontWeight: 900, color: BRAND.coral }}>
                      {selectedBooking.bookingRef || `#${selectedBooking.id}`}
                    </div>
                    <div style={{ fontSize: 13, color: t.textPrimary, marginTop: 4, fontWeight: 600 }}>
                      {selectedBooking.customerName || "—"}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                      {selectedBooking.tourType === "PACKAGE"
                        ? selectedBooking.packageName || "Package Tour"
                        : `${selectedBooking.startLocation || "?"} → ${selectedBooking.endLocation || "?"}`}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                      <BookingStatusBadge status={selectedBooking.status} />
                      {!PAYABLE_STATUSES.includes(selectedBooking.status) && (
                        <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>
                          ⚠ Trip not yet completed / confirmed
                        </span>
                      )}
                    </div>

                    {quotedPriceBooking > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                          border: `1px solid ${t.divider}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: t.textSecondary }}>Quoted Price</span>
                          <span style={{ fontWeight: 700, color: t.textPrimary }}>${quotedPriceBooking}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                          <span style={{ color: t.textSecondary }}>Total Paid (approved)</span>
                          <span style={{ fontWeight: 700, color: "#22c55e" }}>
                            LKR {totalPaidBooking.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                          <span style={{ color: t.textSecondary }}>Receipts pending review</span>
                          <span style={{ fontWeight: 700, color: "#E3A857" }}>
                            LKR {pendingPaidBooking.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {outstandingBooking > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                            <span style={{ color: t.textSecondary }}>Outstanding</span>
                            <span style={{ fontWeight: 700, color: BRAND.coral }}>
                              LKR {outstandingBooking.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {bookingPayments.length > 0 && (
                      <div style={{ marginTop: 12, borderTop: `1px solid ${t.divider}`, paddingTop: 10 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary, marginBottom: 6 }}>Payment history</p>
                        {bookingPayments.map((payment) => (
                          <div key={payment.rawId} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", fontSize: 11, borderBottom: `1px solid ${t.divider}` }}>
                            <span style={{ color: t.textSecondary }}>{payment.date} · {payment.type} · {payment.status}</span>
                            <span style={{ color: t.textPrimary, fontWeight: 700, whiteSpace: "nowrap" }}>LKR {Number(payment.rawAmount || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Recording Form */}
                  <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: 20 }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: t.textSecondary,
                        marginBottom: 16,
                      }}
                    >
                      Record Payment
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Payment Method Selector */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, display: "block", marginBottom: 6 }}>
                          Payment Method *
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, payment_method: "CASH" }))}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              padding: "10px",
                              borderRadius: 10,
                              cursor: "pointer",
                              border: form.payment_method === "CASH" ? "2px solid #2F9E44" : `1px solid ${t.cardBorder}`,
                              background: form.payment_method === "CASH" ? (dark ? "rgba(47,158,68,0.2)" : "#f0fdf4") : "transparent",
                              color: form.payment_method === "CASH" ? "#2F9E44" : t.textSecondary,
                              fontWeight: 700,
                              fontSize: 13,
                              fontFamily: FONT.body,
                            }}
                          >
                            <span>💵 Cash</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, payment_method: "BANK_TRANSFER" }))}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              padding: "10px",
                              borderRadius: 10,
                              cursor: "pointer",
                              border: form.payment_method === "BANK_TRANSFER" ? "2px solid #6366f1" : `1px solid ${t.cardBorder}`,
                              background: form.payment_method === "BANK_TRANSFER" ? (dark ? "rgba(99,102,241,0.2)" : "#eef2ff") : "transparent",
                              color: form.payment_method === "BANK_TRANSFER" ? "#6366f1" : t.textSecondary,
                              fontWeight: 700,
                              fontSize: 13,
                              fontFamily: FONT.body,
                            }}
                          >
                            <span>🏦 Bank Transfer</span>
                          </button>
                        </div>

                        {selectedBooking && selectedBooking.status !== "TOUR_STARTED" && selectedBooking.status !== "COMPLETED" && (
                          <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(227,168,87,0.12)", border: "1px solid #E3A857" }}>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#E3A857" }}>
                              ⚠️ Cash collection is restricted until tour is in <strong>TOUR STARTED</strong> or <strong>COMPLETED</strong> status. (Current status: {selectedBooking.status})
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Receipt file (when Bank Transfer is selected) */}
                      {form.payment_method === "BANK_TRANSFER" && (
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, display: "block", marginBottom: 6 }}>
                            Bank Receipt *
                          </label>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            onChange={(e) => setForm((f) => ({ ...f, slipFile: e.target.files?.[0] || null }))}
                            style={inputStyle}
                          />
                        </div>
                      )}

                      {/* Amount */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, display: "block", marginBottom: 6 }}>
                          Amount Received (LKR) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g. 25000.00"
                          value={form.amount}
                          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>

                      {/* Date */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, display: "block", marginBottom: 6 }}>
                          Date Received *
                        </label>
                        <input
                          type="date"
                          value={form.received_date}
                          onChange={(e) => setForm((f) => ({ ...f, received_date: e.target.value }))}
                          style={inputStyle}
                        />
                      </div>

                      {/* Installment Type */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, display: "block", marginBottom: 6 }}>
                          Payment Type
                        </label>
                        <select
                          value={form.installment}
                          onChange={(e) => setForm((f) => ({ ...f, installment: e.target.value }))}
                          style={inputStyle}
                        >
                          <option value="FULL">Full Payment</option>
                          <option value="DEPOSIT">Deposit</option>
                          <option value="FINAL">Final Payment</option>
                          <option value="ADDITIONAL">Additional Charges</option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, display: "block", marginBottom: 6 }}>
                          Notes / Reference (optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder={
                            form.payment_method === "BANK_TRANSFER"
                              ? "e.g. Bank slip transfer reference or teller receipt #..."
                              : "e.g. Full payment received in cash at end of trip"
                          }
                          value={form.notes}
                          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                          style={{ ...inputStyle, resize: "vertical" }}
                        />
                      </div>

                      {formError && (
                        <div style={{ fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", gap: 6 }}>
                          <AlertCircle size={14} /> {formError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSubmitPayment}
                        disabled={submitting || (form.payment_method === "CASH" && selectedBooking && selectedBooking.status !== "TOUR_STARTED" && selectedBooking.status !== "COMPLETED")}
                        style={{
                          padding: "12px",
                          borderRadius: 10,
                          border: "none",
                          cursor: (submitting || (form.payment_method === "CASH" && selectedBooking && selectedBooking.status !== "TOUR_STARTED" && selectedBooking.status !== "COMPLETED")) ? "not-allowed" : "pointer",
                          background: (form.payment_method === "CASH" && selectedBooking && selectedBooking.status !== "TOUR_STARTED" && selectedBooking.status !== "COMPLETED") ? "#94a3b8" : (submitting ? "#94a3b8" : BRAND.coral),
                          color: "#fff",
                          fontFamily: FONT.body,
                          fontWeight: 700,
                          fontSize: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          transition: "background 0.15s",
                        }}
                      >
                        {submitting ? (
                          <>
                            <RefreshCw size={15} style={{ animation: "spin 1s linear infinite" }} /> Recording…
                          </>
                        ) : (
                          <>
                            <DollarSign size={15} />
                            <span>
                              Record {form.payment_method === "BANK_TRANSFER" ? "Bank Transfer" : "Cash Payment"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
