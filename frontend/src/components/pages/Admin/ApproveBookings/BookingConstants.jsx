// components/pages/Admin/ApproveBookings/BookingConstants.js

export const STATUS_CFG = {
  PENDING:      { label: "Pending",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  QUOTED:       { label: "Quoted",       color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
  ACCEPTED:     { label: "Accepted",     color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  REJECTED:     { label: "Rejected",     color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  CONFIRMED:    { label: "Confirmed",    color: "#2F9E44", bg: "rgba(47,158,68,0.12)"    },
  TOUR_STARTED: { label: "Tour Started", color: "#0891b2", bg: "rgba(8,145,178,0.12)"   },
  COMPLETED:    { label: "Completed",    color: "#4F5D75", bg: "rgba(79,93,117,0.12)" },
  CANCELLED:    { label: "Cancelled",    color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
  CLOSED:       { label: "Closed",       color: "#4F5D75", bg: "rgba(191,192,192,0.35)" },
};

export const TOUR_TYPE_CFG = {
  P2P:     { label: "Point-to-Point", short: "P2P",     color: "#0891b2", bg: "rgba(8,145,178,0.10)"   },
  PACKAGE: { label: "Package Tour",   short: "Package", color: "#8b5cf6", bg: "rgba(139,92,246,0.10)"  },
};

export const VEHICLE_LABELS = {
  mini_car:   "Mini Car",
  normal_car: "Normal Car",
  sedan_car:  "Sedan Car",
  mpv:        "MPV",
  suv:        "SUV",
  mini_van:   "Mini Van",
  van:        "Van",
  large_van:  "Large Van",
};

export const STATUS_PILLS = [
  "ALL", "PENDING", "QUOTED", "ACCEPTED",
  "CONFIRMED", "TOUR_STARTED", "COMPLETED", "CANCELLED",
];

// Safely format phone — avoids "undefined undefined"
export function formatPhone(phone) {
  if (!phone) return "—";
  const cleaned = phone.replace(/undefined/g, "").trim();
  return cleaned || "—";
}

// Get route info based on tour type
export function getRoute(b) {
  if (b.tourType === "P2P") {
    const from = b.pickupLocation || b.startLocation;
    const to   = b.dropoffLocation || b.endLocation;
    return { type: "p2p", from: from || "—", to: to || "—" };
  }
  if (b.tourType === "PACKAGE") {
    return { type: "label", label: b.packageName || b.tourPackage || "Package Tour" };
  }
  // Fallback
  const from = b.pickupLocation || b.startLocation;
  const to   = b.dropoffLocation || b.endLocation;
  if (from || to) return { type: "p2p", from: from || "—", to: to || "—" };
  return { type: "label", label: "—" };
}
