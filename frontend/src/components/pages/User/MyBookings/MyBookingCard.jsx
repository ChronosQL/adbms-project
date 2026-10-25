import { motion } from "framer-motion";
import { ChevronRight, MapPin, Package } from "lucide-react";
import { getBookingReferenceForBooking } from "../../../../utils/bookingReference";
 
export const STATUS_STYLES = {
  PENDING:      "bg-amber-50 text-amber-800 border border-amber-200",
  QUOTED:       "bg-blue-50 text-blue-800 border border-blue-200",
  ACCEPTED:     "bg-emerald-50 text-emerald-800 border border-emerald-200",
  REJECTED:     "bg-red-50 text-red-800 border border-red-200",
  CONFIRMED:    "bg-indigo-50 text-indigo-800 border border-indigo-200",
  TOUR_STARTED: "bg-purple-50 text-purple-800 border border-purple-200",
  COMPLETED:    "bg-emerald-50 text-emerald-800 border border-emerald-200",
  CLOSED:       "bg-slate-100 text-[#4F5D75] border border-slate-200",
  CANCELLED:    "bg-red-50 text-red-700 border border-red-200",
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
      className="w-full text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-[#EF8354] transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#EF8354]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[#EF8354]" />
          </div>
          <div>
            <p className="font-bold text-[#2D3142] text-sm">{booking.bookingRef || getBookingReferenceForBooking(booking)}</p>
            <p className="text-xs text-[#4F5D75]">{TOUR_TYPE_LABEL[booking.tourType] || booking.tourType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_STYLES[booking.status] || "bg-slate-100 text-[#4F5D75]"}`}>
            {booking.status}
          </span>
          <ChevronRight className="w-4 h-4 text-[#4F5D75]" />
        </div>
      </div>
 
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-[#4F5D75] font-medium">Start Date</p>
          <p className="font-semibold text-[#2D3142] text-xs mt-0.5">{booking.startDate || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[#4F5D75] font-medium">End Date</p>
          <p className="font-semibold text-[#2D3142] text-xs mt-0.5">{booking.endDate || "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[#4F5D75] font-medium">Submitted</p>
          <p className="font-semibold text-[#2D3142] text-xs mt-0.5">{booking.createdAt}</p>
        </div>
      </div>
 
      {booking.tourType === "P2P" && booking.startLocation && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-[#4F5D75]">
          <span className="font-semibold text-[#2D3142]">{booking.startLocation}</span>
          <span className="text-slate-400 mx-2">→</span>
          <span className="font-semibold text-[#2D3142]">{booking.endLocation}</span>
        </div>
      )}
 
      {booking.quotedPrice && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs text-[#4F5D75] font-medium">Quoted Price</p>
          <p className="text-base font-bold text-[#EF8354]">
            LKR {Number(booking.quotedPrice).toLocaleString('en-LK')}
          </p>
        </div>
      )}
    </motion.button>
  );
};
 
export default MyBookingCard;
 