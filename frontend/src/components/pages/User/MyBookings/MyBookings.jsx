import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useBookings } from "../../../../context/BookingsContext.jsx";
import MyBookingCard from "./MyBookingCard";
import MyBookingDetail from "./MyBookingDetail";
import MyBookingEmpty from "./MyBookingEmpty";

const MyBookings = () => {
  const { bookings, getCustomerBookings } = useBookings();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    getCustomerBookings()
      .catch(() => setError("Failed to load bookings."))
      .finally(() => setLoading(false));
  }, []);

  const selectedBooking = bookings.find((b) => b.id === selectedId) || null;

  if (loading) return (
    <div className="p-10 flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-sm">Loading your bookings...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center text-red-500 text-sm">{error}</div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="p-8 sm:p-10 h-full flex flex-col"
    >
      {!selectedBooking && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">My Bookings</h2>
          <p className="text-slate-500 text-sm">
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
            {bookings.map((booking) => (
              <MyBookingCard
                key={booking.id}
                booking={booking}
                onClick={() => setSelectedId(booking.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyBookings;
