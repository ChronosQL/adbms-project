// components/pages/Admin/ApproveBookings/BookingChips.jsx
import { MapPin, Package, Compass } from "lucide-react";
import { STATUS_CFG, TOUR_TYPE_CFG } from "./BookingConstants";

const TOUR_ICONS = { P2P: MapPin, PACKAGE: Package, CUSTOM: Compass };

export function StatusChip({ status }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.PENDING;
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "3px 11px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {c.label}
    </span>
  );
}

export function TourTypeChip({ tourType, short = false }) {
  const cfg = TOUR_TYPE_CFG[tourType];
  if (!cfg) return null;
  const Icon = TOUR_ICONS[tourType];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: "2px 8px", borderRadius: 20,
      fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 3,
    }}>
      {Icon && <Icon size={10} strokeWidth={2.5} />}
      {short ? cfg.short : cfg.label}
    </span>
  );
}
