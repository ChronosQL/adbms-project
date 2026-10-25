import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useBookings } from "../../../../context/BookingsContext.jsx";
import MyBookingCard from "./MyBookingCard";
import MyBookingDetail from "./MyBookingDetail";
import MyBookingEmpty from "./MyBookingEmpty";
import Pagination from "../../../common/Pagination";

const MyBookings = ({ isEmbedded = false }) => {
  const { bookings, getCustomerBookings } = useBookings();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(5);

  useEffect(() => {
    getCustomerBookings()
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const selectedBooking = bookings.find((b) => b.id === selectedId) || null;

  const totalPages = Math.ceil(bookings.length / limit) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedBookings = bookings.slice((currentPage - 1) * limit, currentPage * limit);

  if (loading) return (
    <div className="p-12 flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3 text-[#4F5D75]">
        <svg className="animate-spin w-8 h-8 text-[#EF8354]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-sm font-medium">Loading your bookings...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center text-red-500 text-sm font-medium">{error}</div>
  );

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className={isEmbedded ? "p-8 sm:p-10 h-full flex flex-col" : "w-full flex flex-col"}
    >
      {!selectedBooking && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#2D3142] mb-1">My Bookings</h2>
          <p className="text-[#4F5D75] text-sm">
            View and manage all your tour bookings.
          </p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {bookings.length === 0 ? (
          <MyBookingEmpty key="empty" navigate={navigate} />
        ) : selectedBooking ? (
          <MyBookingDetail
            key={selectedBooking.id}
            booking={selectedBooking}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 space-y-4 overflow-y-auto"
          >
            {paginatedBookings.map((booking) => (
              <MyBookingCard
                key={booking.id}
                booking={booking}
                onClick={() => setSelectedId(booking.id)}
              />
            ))}
            {bookings.length > limit && (
              <div className="pt-4">
                <Pagination
                  pagination={{
                    page: currentPage,
                    totalPages,
                    total: bookings.length,
                    limit,
                  }}
                  onPageChange={setPage}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                  limitOptions={[5, 10, 20]}
                  itemLabel="bookings"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 lg:px-8 flex justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-br from-[#EF8354] to-[#4F5D75] -z-10 shadow-lg" />
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 p-8 sm:p-10 z-10 min-h-[500px]">
        {content}
      </div>
    </div>
  );
};

export default MyBookings;
