import { motion } from "framer-motion";
import { ChevronRight, MapPin, Package } from "lucide-react";
import { getBookingReferenceForBooking } from "../../../../utils/bookingReference";
 
export const STATUS_STYLES = {
  PENDING:      "bg-yellow-100 text-yellow-800",
  QUOTED:       "bg-blue-100 text-blue-800",
  ACCEPTED:     "bg-emerald-100 text-emerald-800",
  REJECTED:     "bg-red-100 text-red-800",
  CONFIRMED:    "bg-indigo-100 text-indigo-800",
  TOUR_STARTED: "bg-purple-100 text-purple-800",
  COMPLETED:    "bg-green-100 text-green-800",
  CLOSED:       "bg-slate-100 text-slate-600",
  CANCELLED:    "bg-red-100 text-red-700",
};
 
export const TOUR_TYPE_LABEL = {
  P2P:     "Point-to-Point",
  PACKAGE: "Package Tour",
};
 
const TOUR_TYPE_ICON = {
  P2P:     MapPin,
  PACKAGE: Package,
};
 
const MyBookingCard = ({ booking, onClick }) => {
  const Icon = TOUR_TYPE_ICON[booking.tourType] || MapPin;
 
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="w-full text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#EF8354]/40 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EF8354]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[#EF8354]" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{booking.bookingRef || getBookingReferenceForBooking(booking)}</p>
            <p className="text-xs text-slate-500">{TOUR_TYPE_LABEL[booking.tourType] || booking.tourType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_STYLES[booking.status] || "bg-slate-100 text-slate-600"}`}>
            {booking.status}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
 
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-400">Start Date</p>
          <p className="font-semibold text-slate-700 text-xs mt-0.5">{booking.startDate || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">End Date</p>
          <p className="font-semibold text-slate-700 text-xs mt-0.5">{booking.endDate || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Submitted</p>
          <p className="font-semibold text-slate-700 text-xs mt-0.5">{booking.createdAt}</p>
        </div>
      </div>
 
      {booking.tourType === "P2P" && booking.startLocation && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">{booking.startLocation}</span>
          <span className="text-slate-400 mx-2">→</span>
          <span className="font-semibold text-slate-700">{booking.endLocation}</span>
        </div>
      )}
 
      {booking.quotedPrice && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-400">Quoted Price</p>
          <p className="text-base font-bold text-[#EF8354]">${booking.quotedPrice}</p>
        </div>
      )}
    </motion.button>
  );
};
 
export default MyBookingCard;
 