// components/pages/Admin/ApproveBookings/ApproveBookings.jsx
import { useState, useEffect } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import { useBookings } from "../../../../context/BookingsContext";
import { STATUS_CFG } from "./BookingConstants";
import { BRAND, FONT, getTheme } from "../AdminDashboard/adminTheme";
import BookingFilters from "./BookingFilters";
import BookingTable   from "./BookingTable";
import BookingModal   from "./BookingModal";

export default function ApproveBookings() {
  const context = useOutletContext();
  const dark = context?.dark ?? false;
  const t = getTheme(dark);
  const location = useLocation();

  const { bookings, getAllBookings, setQuotedPrice, updateBookingStatus } = useBookings();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllBookings()
      .then((fetchedBookings) => {
        if (location.state?.bookingId) {
          const targetId = location.state.bookingId;
          const found = fetchedBookings.find(
            b => b.id === targetId || String(b.booking_id) === String(targetId) || b.id?.toLowerCase() === targetId.toLowerCase()
          );
          if (found) {
            setSelected(found);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [location.state, getAllBookings]);

  const [search,       setSearch]      = useState("");
  const [statusFilter, setStatus]      = useState("ALL");
  const [typeFilter,   setTypeFilter]  = useState("ALL");
  const [selected,     setSelected]    = useState(null);

  // Status counts for filter badges
  const counts = Object.keys(STATUS_CFG).reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length;
    return acc;
  }, {});

  // Apply filters
  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const bookingId = b.id != null ? String(b.id).toLowerCase() : "";
    const bookingRef = b.booking_id != null ? String(b.booking_id).toLowerCase() : "";
    const customerName = b.customerName?.toLowerCase() || "";
    const pickupLocation = (b.pickupLocation || b.startLocation || "").toLowerCase();
    const dropoffLocation = (b.dropoffLocation || b.endLocation || "").toLowerCase();
    const packageName = (b.packageName || "").toLowerCase();
    const destination = (b.destination || "").toLowerCase();

    const matchSearch = !q ||
      bookingId.includes(q) ||
      bookingRef.includes(q) ||
      customerName.includes(q) ||
      pickupLocation.includes(q) ||
      dropoffLocation.includes(q) ||
      packageName.includes(q) ||
      destination.includes(q);
    const matchStatus = statusFilter === "ALL" || b.status === statusFilter;
    const matchType   = typeFilter   === "ALL" || b.tourType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Modal handlers — async, re-sync selected booking after mutations
  const handleSetQuote = async (id, price, vehicleInfo) => {
    await setQuotedPrice(id, price, vehicleInfo);
    const updated = bookings.find(b => b.id === id);
    if (updated) setSelected({ ...updated, status: "QUOTED", quotedPrice: price, assignedVehicle: vehicleInfo });
  };

  const handleUpdateStatus = async (id, status) => {
    await updateBookingStatus(id, status);
    const updated = bookings.find(b => b.id === id);
    if (updated) setSelected({ ...updated, status });
    else setSelected(null);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <svg style={{ animation: "spin 1s linear infinite", width: 32, height: 32 }} viewBox="0 0 24 24" fill="none">
        <style>{"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
        <circle cx="12" cy="12" r="10" stroke={BRAND.coral} strokeWidth="4" opacity=".25"/>
        <path fill={BRAND.coral} d="M4 12a8 8 0 018-8v8z" opacity=".75"/>
      </svg>
    </div>
  );

  return (
    <div className="max-w-[1320px] mx-auto px-6 py-8">

      {/* Contextual summary — page title itself now lives in the layout header */}
      <p style={{ fontFamily: FONT.body, color: t.textSecondary, fontSize: 13, margin: "0 0 20px" }}>
        {bookings.length} total · {counts.PENDING || 0} pending · {counts.ACCEPTED || 0} awaiting confirmation
      </p>

      {/* Filters */}
      <BookingFilters
        dark={dark}
        search={search}       onSearch={setSearch}
        statusFilter={statusFilter} onStatus={setStatus}
        typeFilter={typeFilter}     onType={setTypeFilter}
        counts={counts}
        total={bookings.length}
      />

      {/* Table */}
      <BookingTable
        bookings={filtered}
        dark={dark}
        onView={setSelected}
      />

      {/* Detail modal */}
      {selected && (
        <BookingModal
          booking={selected}
          dark={dark}
          onClose={() => setSelected(null)}
          onSetQuote={handleSetQuote}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

    </div>
  );
}
