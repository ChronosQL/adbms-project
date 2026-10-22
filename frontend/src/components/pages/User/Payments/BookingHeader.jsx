import React from "react";
import { ArrowLeft } from "lucide-react";

const statusStyles = {
  "TOUR STARTED": "bg-purple-100 text-purple-700 border border-purple-200",
  COMPLETED: "bg-green-100 text-green-700 border border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border border-red-200",
  UPCOMING: "bg-blue-100 text-blue-700 border border-blue-200",
};

const BookingHeader = ({
  bookingId = "BK001",
  tourName = "Point-to-Point Tour",
  tourStatus = "TOUR STARTED",
  onBack,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Booking
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{bookingId}</h1>
          <p className="text-sm text-gray-500">{tourName}</p>
        </div>
      </div>

      {/* Right: Status badge */}
      <span
        className={`text-xs font-semibold px-3 py-1.5 rounded-full tracking-wide ${
          statusStyles[tourStatus] || statusStyles["UPCOMING"]
        }`}
      >
        {tourStatus}
      </span>
    </div>
  );
};

export default BookingHeader;