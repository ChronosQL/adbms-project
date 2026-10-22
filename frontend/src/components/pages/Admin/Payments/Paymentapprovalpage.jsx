import React, { useState, useEffect, useCallback } from "react";
import PaymentStatsBar from "./Paymentstatsbar";
import PaymentFilters from "./Paymentfilters";
import PaymentTable from "./Paymenttable";
import PaymentDetailPanel from "./Paymentdetailpanel";
import { useBookings } from "../../../../context/BookingsContext";

export default function PaymentApprovalsPage() {
  const { getAllPayments, approvePayment, rejectPayment } = useBookings();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({ search: "", type: "", status: "", dateRange: "this_month" });
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 5;

  const fetchPayments = useCallback(() => {
    setLoading(true);
    setError(null);
    getAllPayments()
      .then(data => {
        setPayments(data || []);
      })
      .catch(err => {
        console.error("Error loading payments:", err);
        setError(err.message || "Failed to load payments.");
      })
      .finally(() => setLoading(false));
  }, [getAllPayments]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = payments.filter((p) => {
    if (activeTab !== "all" && p.status !== activeTab) return false;
    if (filters.type && p.type.toLowerCase() !== filters.type) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.search && ![p.id, p.bookingId, p.customerName, p.customerPhone].some((v) => v && v.toLowerCase().includes(filters.search.toLowerCase()))) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PER_PAGE));
  const paginated = filteredPayments.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const counts = { 
    all: payments.length, 
    pending: payments.filter((p) => p.status === "pending").length, 
    approved: payments.filter((p) => p.status === "approved").length, 
    rejected: payments.filter((p) => p.status === "rejected").length 
  };

  const totalReceivedVal = payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.rawAmount || 0), 0);
  const totalReceivedLabel = `LKR ${totalReceivedVal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

  const stats = { 
    pendingCount: counts.pending, 
    approvedCount: counts.approved, 
    rejectedCount: counts.rejected, 
    totalReceivedLabel: totalReceivedLabel, 
    totalPaymentsCount: payments.filter(p => p.status === 'approved').length 
  };

  const handleFilterChange = useCallback((key, value) => { setFilters((prev) => ({ ...prev, [key]: value })); setCurrentPage(1); }, []);
  const handleTabChange = useCallback((tab) => { setActiveTab(tab); setCurrentPage(1); }, []);

  const handleClosePanel = useCallback(() => { setSelectedPayment(null); setDetailData(null); }, []);

  const handleSelectPayment = useCallback(async (payment) => {
    setSelectedPayment(payment);
    setPanelLoading(true);
    await new Promise((r) => setTimeout(r, 100));
    
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
      remainingAmount: "–",
      paymentMethod: payment.method,
      bankName: payment.method === 'Bank Transfer' ? 'Commercial Bank' : null,
      referenceNumber: payment.method === 'Bank Transfer' ? `REF${payment.rawId}` : null,
      paymentDate: payment.date,
      slip: payment.slip,
      notes: payment.notes
    };
    
    setDetailData(detail);
    setPanelLoading(false);
  }, []);

  const handleApprove = useCallback(async (paymentId, notes) => {
    setActionLoading(true);
    try {
      const targetPayment = payments.find(p => p.id === paymentId);
      const rawId = targetPayment ? targetPayment.rawId : paymentId;
      await approvePayment(rawId, notes);
      showToast("Payment approved successfully!", "success");
      fetchPayments();
      handleClosePanel();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to approve payment.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [payments, approvePayment, fetchPayments, handleClosePanel, showToast]);

  const handleReject = useCallback(async (paymentId, notes) => {
    setActionLoading(true);
    try {
      const targetPayment = payments.find(p => p.id === paymentId);
      const rawId = targetPayment ? targetPayment.rawId : paymentId;
      await rejectPayment(rawId, notes);
      showToast("Payment rejected successfully!", "success");
      fetchPayments();
      handleClosePanel();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to reject payment.", "error");
    } finally {
      setActionLoading(false);
    }
  }, [payments, rejectPayment, fetchPayments, handleClosePanel, showToast]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="px-6 py-6 max-w-screen-xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Payment Audit Log</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review history of recorded customer payments</p>
        </div>

        <PaymentStatsBar stats={stats} />

        <PaymentFilters counts={counts} filters={filters} onFilterChange={handleFilterChange} activeTab={activeTab} onTabChange={handleTabChange} />

        <PaymentTable payments={paginated} selectedId={selectedPayment?.id ?? null} onSelect={handleSelectPayment} pagination={{ current: currentPage, total: totalPages, totalItems: filteredPayments.length, perPage: PER_PAGE }} onPageChange={setCurrentPage} loading={loading} />
      </div>

      {selectedPayment && (
        <PaymentDetailPanel payment={panelLoading ? { ...selectedPayment, status: selectedPayment.status } : detailData} onClose={handleClosePanel} onApprove={handleApprove} onReject={handleReject} loading={actionLoading || panelLoading} />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all duration-300 transform translate-y-0 scale-100 ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-100 text-red-800'
              : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}
        >
          {toast.type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">!</div>
          )}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
