import { CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

const MyBookingEmpty = ({ navigate }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
    <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mb-6">
      <CalendarDays size={40} />
    </div>
    <h3 className="text-xl font-semibold text-slate-800 mb-2">No bookings yet</h3>
    <p className="text-slate-500 max-w-sm mb-6">
      Ready to explore Sri Lanka? Book your first tour now.
    </p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate("/tour-booking")}
      className="flex items-center gap-2 bg-[#EF8354] hover:bg-[#4F5D75] text-white px-6 py-2.5 rounded-full font-semibold shadow-md shadow-[#EF8354]/20 transition-all cursor-pointer"
    >
      Browse Tours
    </motion.button>
  </div>
);

export default MyBookingEmpty;
