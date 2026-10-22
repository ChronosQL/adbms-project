// components/pages/Admin/ApproveBookings/BookingTable.jsx
import { Eye } from "lucide-react";
import { StatusChip, TourTypeChip } from "./BookingChips";
import { VEHICLE_LABELS, formatPhone, getRoute } from "./BookingConstants";
import { BRAND, STATE, FONT, getTheme } from "../AdminDashboard/adminTheme";
import { getBookingReferenceForBooking } from "../../../../utils/bookingReference";

// Column header component
function ColHeader({ label, style = {} }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, fontFamily: FONT.body,
      textTransform: "uppercase", letterSpacing: ".07em",
      ...style,
    }}>
      {label}
    </div>
  );
}

// Route cell — adapts to tour type
function RouteCell({ booking, t }) {
  const route = getRoute(booking);
  if (route.type === "p2p") {
    return (
      <div>
        <p style={{ margin: 0, fontSize: 12, fontFamily: FONT.body, color: t.textPrimary }}>
          <span style={{ color: BRAND.coral, fontWeight: 700 }}>↑ </span>{route.from}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 12, fontFamily: FONT.body, color: t.textSecondary }}>
          <span style={{ color: STATE.warning, fontWeight: 700 }}>↓ </span>{route.to}
        </p>
      </div>
    );
  }
  return <p style={{ margin: 0, fontSize: 12, fontFamily: FONT.body, color: t.textPrimary, fontStyle: "italic" }}>{route.label}</p>;
}

export default function BookingTable({ bookings, dark, onView }) {
  const t = getTheme(dark);

  if (bookings.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0", color: t.textSecondary }}>
        <p style={{ fontSize: 44, margin: "0 0 10px" }}>📭</p>
        <p style={{ fontSize: 16, fontWeight: 700, fontFamily: FONT.heading, color: t.textPrimary, margin: "0 0 4px" }}>No bookings found</p>
        <p style={{ fontSize: 13, fontFamily: FONT.body, margin: 0 }}>Try a different filter or search term</p>
      </div>
    );
  }

  // Column definitions — flex ratios control width, no fixed px so nothing overflows
  const cols = [
    { key: "id",       label: "ID",       flex: "0 0 150px"  },
    { key: "type",     label: "Type",     flex: "0 0 110px"  },
    { key: "customer", label: "Customer", flex: "1 1 130px"  },
    { key: "route",    label: "Route",    flex: "2 1 140px"  },
    { key: "dates",    label: "Dates",    flex: "0 0 100px"  },
    { key: "category", label: "Category", flex: "0 0 90px"   },
    { key: "vehicle",  label: "Vehicle",  flex: "0 0 110px"  },
    { key: "quoted",   label: "Quoted",   flex: "0 0 70px"   },
    { key: "status",   label: "Status",   flex: "0 0 110px"  },
    { key: "action",   label: "",         flex: "0 0 70px"   },
  ];

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, overflow: "hidden" }}>

      {/* ── Column headers ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 20px", background: t.headerBg, borderBottom: `1px solid ${t.divider}`, gap: 0 }}>
        {cols.map(col => (
          <div key={col.key} style={{ flex: col.flex, color: t.textSecondary }}>
            <ColHeader label={col.label} />
          </div>
        ))}
      </div>

      {/* ── Rows ── */}
      {bookings.map((b, i) => (
        <BookingRow
          key={b.id}
          booking={b}
          cols={cols}
          t={t}
          isLast={i === bookings.length - 1}
          onView={onView}
        />
      ))}
    </div>
  );
}

function BookingRow({ booking: b, cols, t, isLast, onView }) {
  const cellStyle = (flex) => ({ flex, overflow: "hidden" });

  return (
    <div
      style={{
        display: "flex", alignItems: "center",
        padding: "14px 20px", gap: 0,
        borderBottom: isLast ? "none" : `1px solid ${t.divider}`,
        transition: "background .1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      {/* ID */}
      <div style={cellStyle(cols[0].flex)}>
        <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: BRAND.coral, wordBreak: "break-all" }}>
          {b.bookingRef || getBookingReferenceForBooking(b)}
        </p>
      </div>

      {/* Tour Type */}
      <div style={cellStyle(cols[1].flex)}>
        <TourTypeChip tourType={b.tourType} short />
      </div>

      {/* Customer */}
      <div style={cellStyle(cols[2].flex)}>
        <p style={{ margin: 0, fontSize: 13, fontFamily: FONT.body, fontWeight: 700, color: t.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {b.customerName || "—"}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, fontFamily: FONT.body, color: t.textSecondary }}>{formatPhone(b.customerPhone)}</p>
      </div>

      {/* Route */}
      <div style={cellStyle(cols[3].flex)}>
        <RouteCell booking={b} t={t} />
      </div>

      {/* Dates */}
      <div style={cellStyle(cols[4].flex)}>
        <p style={{ margin: 0, fontSize: 12, fontFamily: FONT.body, color: t.textPrimary }}>{b.startDate || "—"}</p>
        {b.endDate && b.endDate !== b.startDate && (
          <p style={{ margin: "2px 0 0", fontSize: 11, fontFamily: FONT.body, color: t.textSecondary }}>→ {b.endDate}</p>
        )}
      </div>

      {/* Category */}
      <div style={cellStyle(cols[5].flex)}>
        <p style={{ margin: 0, fontSize: 12, fontFamily: FONT.body, color: t.textSecondary }}>
          {b.categoryName || VEHICLE_LABELS[b.categoryId] || b.categoryId || "—"}
        </p>
      </div>

      {/* Vehicle */}
      <div style={cellStyle(cols[6].flex)}>
        {b.assignedVehicle ? (
          <>
            <p style={{ margin: 0, fontSize: 12, fontFamily: FONT.body, fontWeight: 700, color: STATE.info, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {b.assignedVehicle.name}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: t.textSecondary, fontFamily: "monospace" }}>
              {b.assignedVehicle.plateNumber}
            </p>
          </>
        ) : <p style={{ margin: 0, fontSize: 12, fontFamily: FONT.body, color: t.textSecondary }}>—</p>}
      </div>

      {/* Quoted */}
      <div style={cellStyle(cols[7].flex)}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: b.quotedPrice ? STATE.info : t.textSecondary }}>
          {b.quotedPrice ? `$${b.quotedPrice}` : "—"}
        </p>
      </div>

      {/* Status */}
      <div style={cellStyle(cols[8].flex)}>
        <StatusChip status={b.status} />
      </div>

      {/* Action */}
      <div style={cellStyle(cols[9].flex)}>
        <button
          onClick={() => onView(b)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: `${BRAND.coral}18`, color: BRAND.coral,
            border: `1px solid ${BRAND.coral}40`, borderRadius: 8,
            padding: "6px 12px", fontSize: 12, fontWeight: 700, fontFamily: FONT.body, cursor: "pointer",
          }}
        >
          <Eye size={13} /> View
        </button>
      </div>
    </div>
  );
}
