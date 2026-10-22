import React, { useState, useEffect, useCallback } from "react";
import { DollarSign, Search, CheckCircle, AlertCircle, Clock, RefreshCw, ChevronDown } from "lucide-react";
import { useBookings } from "../../../../context/BookingsContext";
import { useOutletContext } from "react-router-dom";
import { BRAND, FONT, getTheme } from "../AdminDashboard/adminTheme";

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

// Statuses where cash payment recording is appropriate
const PAYABLE_STATUSES = ["COMPLETED", "CONFIRMED", "TOUR_STARTED", "CLOSED"];

function StatusBadge({ status }) {
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

export default function CashPaymentPage() {
  const context = useOutletContext();
  const dark = context?.dark ?? false;
  const t = getTheme(dark);
  const { bookings, getAllBookings, recordPayment, getPaymentsForBooking } = useBookings();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingPayments, setBookingPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form state
  const [form, setForm] = useState({
    amount: "",
    received_date: new Date().toISOString().split("T")[0],
    notes: "",
    installment: "FULL",
  });
  const [formError, setFormError] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    getAllBookings().finally(() => setLoading(false));
  }, [getAllBookings]);

  const handleSelectBooking = useCallback(
    async (booking) => {
      setSelectedBooking(booking);
      setForm({
        amount: "",
        received_date: new Date().toISOString().split("T")[0],
        notes: "",
        installment: "FULL",
      });
      setFormError("");
      setPaymentsLoading(true);
      try {
        const data = await getPaymentsForBooking(booking.id);
        setBookingPayments(data.payments || []);
      } catch {
        setBookingPayments([]);
      } finally {
        setPaymentsLoading(false);
      }
    },
    [getPaymentsForBooking]
  );

  const handleSubmitPayment = async () => {
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setFormError("Please enter a valid amount greater than zero.");
      return;
    }
    if (!form.received_date) {
      setFormError("Please select the date the cash was received.");
      return;
    }

    const confirmed = window.confirm(
      `Record cash payment of LKR ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2 })} for booking ${
        selectedBooking.bookingRef || "#" + selectedBooking.id
      }?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    setFormError("");
    try {
      // Send both booking_id (required by backend) and bookingId for safety
      await recordPayment({
        booking_id: selectedBooking.id,
        bookingId: selectedBooking.id,
        amount,
        payment_method: "CASH",
        received_date: form.received_date,
        notes: form.notes || null,
        installment: form.installment,
      });
      showToast("Cash payment recorded successfully.", "success");
      // Refresh payments for this booking
      const data = await getPaymentsForBooking(selectedBooking.id);
      setBookingPayments(data.payments || []);
      setForm({
        amount: "",
        received_date: new Date().toISOString().split("T")[0],
        notes: "",
        installment: "FULL",
      });
    } catch (err) {
      showToast(err.message || "Failed to record payment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

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

  const approvedPayments = bookingPayments.filter(
    (p) => p.status === "approved" || p.status === "APPROVED"
  );
  const totalPaid = approvedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const quotedPrice = selectedBooking?.quotedPrice || 0;
  const outstanding = Math.max(0, quotedPrice - totalPaid);

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
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "8px 24px 40px", fontFamily: FONT.body }}>
      <style>{`
        .pay-row:hover { background: ${dark ? "rgba(255,255,255,0.04)" : "#f8fafc"} !important; cursor: pointer; }
        .pay-row.selected { background: ${dark ? "rgba(239,131,84,0.15)" : "rgba(239,131,84,0.08)"} !important; border-left: 3px solid ${BRAND.coral}; }
      `}</style>

      {/* Info Banner */}
      <div
        style={{
          padding: "12px 18px",
          borderRadius: 12,
          marginBottom: 24,
          background: dark ? "rgba(239,131,84,0.1)" : "rgba(239,131,84,0.06)",
          border: `1px solid ${dark ? "rgba(239,131,84,0.3)" : "rgba(239,131,84,0.2)"}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: BRAND.coral,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <DollarSign size={16} />
        Cash payments are recorded here after a trip is completed. Customers pay in cash — no online payment is collected.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}>
        {/* ── LEFT: Booking List ── */}
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
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 34 }}
              />
            </div>
            <div style={{ position: "relative" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: t.textSecondary }}>Loading bookings…</div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: t.textSecondary, fontSize: 13 }}>
              No bookings match your filter.
            </div>
          ) : (
            <div style={{ overflowY: "auto", maxHeight: 580 }}>
              {filteredBookings.map((b) => (
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
                    <StatusBadge status={b.status} />
                    {b.quotedPrice && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.textPrimary }}>
                        ${b.quotedPrice}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Record Payment Panel ── */}
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
              <p>Select a booking from the list to record a cash payment.</p>
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
                  <StatusBadge status={selectedBooking.status} />
                  {!PAYABLE_STATUSES.includes(selectedBooking.status) && (
                    <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>
                      ⚠ Trip not yet completed
                    </span>
                  )}
                </div>

                {quotedPrice > 0 && (
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
                      <span style={{ fontWeight: 700, color: t.textPrimary }}>${quotedPrice}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                      <span style={{ color: t.textSecondary }}>Total Paid (approved)</span>
                      <span style={{ fontWeight: 700, color: "#22c55e" }}>
                        LKR {totalPaid.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {outstanding > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                        <span style={{ color: t.textSecondary }}>Outstanding</span>
                        <span style={{ fontWeight: 700, color: BRAND.coral }}>
                          LKR {outstanding.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Record Payment Form */}
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
                  Record Cash Payment
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, display: "block", marginBottom: 6 }}>
                      Notes (optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Full payment received in cash at end of trip"
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
                    onClick={handleSubmitPayment}
                    disabled={submitting}
                    style={{
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      cursor: submitting ? "not-allowed" : "pointer",
                      background: submitting ? "#94a3b8" : BRAND.coral,
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
                        <DollarSign size={15} /> Record Cash Payment
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Payment History */}
              <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 16, padding: 20 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: t.textSecondary,
                    marginBottom: 12,
                  }}
                >
                  Payment History
                </p>
                {paymentsLoading ? (
                  <div style={{ textAlign: "center", color: t.textSecondary, padding: 20 }}>
                    <Clock size={20} style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                ) : bookingPayments.length === 0 ? (
                  <p style={{ fontSize: 12, color: t.textSecondary, textAlign: "center", padding: "16px 0" }}>
                    No payments recorded yet.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {bookingPayments.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                          border: `1px solid ${t.divider}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: t.textPrimary }}>
                              {p.amount
                                ? `LKR ${parseFloat(p.amount).toLocaleString("en-LK", {
                                    minimumFractionDigits: 2,
                                  })}`
                                : "—"}
                            </span>
                            <span style={{ fontSize: 11, color: t.textSecondary, marginLeft: 8 }}>
                              {p.payment_method || "CASH"} · {p.installment || "FULL"}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 999,
                              color:
                                p.status === "approved" || p.status === "APPROVED"
                                  ? "#166534"
                                  : p.status === "rejected" || p.status === "REJECTED"
                                  ? "#991b1b"
                                  : "#92400e",
                              background:
                                p.status === "approved" || p.status === "APPROVED"
                                  ? "#dcfce7"
                                  : p.status === "rejected" || p.status === "REJECTED"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                            }}
                          >
                            {(p.status || "PENDING").toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 4 }}>
                          {p.received_date || p.date || "—"}
                          {p.notes && ` · ${p.notes}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
