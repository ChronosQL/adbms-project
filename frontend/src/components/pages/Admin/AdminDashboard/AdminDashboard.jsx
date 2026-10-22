// components/pages/Admin/AdminDashboard/AdminDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { CalendarCheck, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { useBookings } from "../../../../context/BookingsContext";
import { useMessages } from "../../../../context/useMessages.js";
import { STATUS_CFG, getRoute } from "../ApproveBookings/BookingConstants";
import { StatusChip } from "../ApproveBookings/BookingChips";
import { BRAND, STATE, FONT, getTheme } from "./adminTheme";
import { getBookingReferenceForBooking } from "../../../../utils/bookingReference";

// Statuses shown in the "Booking Status" breakdown, in display order
const BREAKDOWN_STATUSES = ["CONFIRMED", "PENDING", "CANCELLED", "COMPLETED"];

function StatCard({ label, value, delta, color, icon: Icon, t, index }) {
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  useEffect(() => {
    if (!visible) return;
    let n = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const iv = setInterval(() => {
      n += step;
      if (n >= value) { setCount(value); clearInterval(iv); }
      else setCount(n);
    }, 18);
    return () => clearInterval(iv);
  }, [visible, value]);

  return (
    <div
      className="relative rounded-2xl border p-6 overflow-hidden cursor-default transition-all duration-300 hover:-translate-y-1"
      style={{
        background: t.cardBg,
        borderColor: t.cardBorder,
        boxShadow: t.dark ? "0 12px 32px rgba(0,0,0,.4)" : "0 1px 2px rgba(45,49,66,.05)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity .4s ease, transform .4s ease, box-shadow .3s ease",
      }}
    >
      <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-10" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-[11px] font-semibold uppercase tracking-widest mb-2">
            {label}
          </p>
          <p style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="text-4xl font-extrabold leading-none mb-1 tabular-nums">
            {count}
          </p>
          <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-[12px]">{delta}</p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: `${color}18`, color }}>
          <Icon size={22} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, pct, color, t, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 500 + delay);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5">
        <span style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-[13px] font-medium">{label}</span>
        <span style={{ fontFamily: FONT.heading, color }} className="text-[13px] font-extrabold">{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: t.dark ? "rgba(255,255,255,0.08)" : "#EEEEF0" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, background: color, boxShadow: `0 0 8px ${color}55`, transition: "width 1.1s cubic-bezier(.4,0,.2,1)" }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const context = useOutletContext();
  const dark = context?.dark ?? false;
  const t = getTheme(dark);
  const navigate = useNavigate();

  const { bookings, getAllBookings } = useBookings();
  const { messages, loading: messagesLoading, getAdminNotificationCount } = useMessages();

  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    getAllBookings().finally(() => setBookingsLoading(false));
  }, [getAllBookings]);

  const loading = bookingsLoading || messagesLoading;

  // ── Derive everything from real data — nothing hardcoded below ──────────
  const counts = useMemo(() => {
    return Object.keys(STATUS_CFG).reduce((acc, status) => {
      acc[status] = bookings.filter(b => b.status === status).length;
      return acc;
    }, {});
  }, [bookings]);

  const total = bookings.length;
  const pendingCount = counts.PENDING || 0;
  const confirmedCount = counts.CONFIRMED || 0;
  const unreadMessages = messages?.length ? getAdminNotificationCount() : 0;

  const confirmedRate = total ? Math.round((confirmedCount / total) * 100) : 0;

  const STATS = [
    {
      label: "Total Bookings", value: total, color: BRAND.coral, icon: CalendarCheck,
      delta: total ? `${pendingCount} pending · ${confirmedCount} confirmed` : "No bookings yet",
    },
    {
      label: "Pending", value: pendingCount, color: STATE.warning, icon: Clock,
      delta: pendingCount ? "Needs review" : "All clear",
    },
    {
      label: "Confirmed", value: confirmedCount, color: STATE.success, icon: CheckCircle2,
      delta: total ? `${confirmedRate}% of total` : "No bookings yet",
    },
    {
      label: "Unread Messages", value: unreadMessages, color: STATE.info, icon: MessageSquare,
      delta: unreadMessages ? "Needs a reply" : "All caught up",
    },
  ];

  const statusBars = useMemo(() => {
    return BREAKDOWN_STATUSES.map(status => ({
      label: STATUS_CFG[status].label,
      color: status === "CONFIRMED" ? STATE.success
           : status === "PENDING"   ? STATE.warning
           : status === "CANCELLED" ? STATE.danger
           : BRAND.payneGray,
      pct: total ? Math.round(((counts[status] || 0) / total) * 100) : 0,
    }));
  }, [counts, total]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => (b.id > a.id ? 1 : -1))
      .slice(0, 6);
  }, [bookings]);

  const quickActions = [
    { label: `Review Pending (${pendingCount})`, onClick: () => navigate("/admin/approve-bookings") },
    { label: `Reply to Messages (${unreadMessages})`, onClick: () => navigate("/admin/messages") },
    { label: "Open Reports", onClick: () => navigate("/admin/report") },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <svg style={{ animation: "spin 1s linear infinite", width: 32, height: 32 }} viewBox="0 0 24 24" fill="none">
          <style>{"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
          <circle cx="12" cy="12" r="10" stroke={BRAND.coral} strokeWidth="4" opacity=".25" />
          <path fill={BRAND.coral} d="M4 12a8 8 0 018-8v8z" opacity=".75" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-6 py-8" style={{ background: t.pageBg }}>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s, i) => (
          <StatCard key={s.label} {...s} t={t} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

        {/* Recent bookings */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: t.divider }}>
            <div>
              <h2 style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="font-extrabold text-[15px]">Recent Bookings</h2>
              <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-[12px] mt-0.5">
                {recentBookings.length ? `Latest ${recentBookings.length} of ${total} reservations` : "No reservations yet"}
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/approve-bookings")}
              className="px-4 py-1.5 rounded-lg border text-[12px] font-bold transition-all duration-200"
              style={{ fontFamily: FONT.body, color: BRAND.coral, borderColor: t.dark ? "rgba(255,255,255,0.1)" : "#EEE0D8" }}
              onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              View All →
            </button>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-16" style={{ color: t.textSecondary }}>
              <p className="text-[40px] m-0">📭</p>
              <p style={{ fontFamily: FONT.body }} className="text-[13px] mt-2">Bookings will show up here once customers start booking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: t.headerBg }}>
                    {["ID", "Guest", "Tour", "Date", "Amount", "Status"].map(h => (
                      <th key={h} style={{ fontFamily: FONT.body, color: t.textSecondary, borderColor: t.divider }} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider border-b">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b, i) => {
                    const route = getRoute(b);
                    const tourLabel = route.type === "p2p" ? `${route.from} → ${route.to}` : route.label;
                    return (
                      <tr
                        key={b.id}
                        className="transition-colors duration-100"
                        style={{ borderBottom: i < recentBookings.length - 1 ? `1px solid ${t.divider}` : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ fontFamily: FONT.body, color: BRAND.coral }} className="px-5 py-3.5 text-[12px] font-mono font-medium">{b.bookingRef || getBookingReferenceForBooking(b)}</td>
                        <td style={{ fontFamily: FONT.body, color: t.textPrimary }} className="px-5 py-3.5 text-[13px] font-semibold">{b.customerName || "—"}</td>
                        <td style={{ fontFamily: FONT.body, color: t.textSecondary }} className="px-5 py-3.5 text-[13px] max-w-[200px] truncate">{tourLabel}</td>
                        <td style={{ fontFamily: FONT.body, color: t.textSecondary }} className="px-5 py-3.5 text-[12px] whitespace-nowrap">{b.startDate || "—"}</td>
                        <td style={{ fontFamily: FONT.body, color: t.textPrimary }} className="px-5 py-3.5 text-[13px] font-bold font-mono">
                          {b.quotedPrice ? `$${b.quotedPrice}` : "—"}
                        </td>
                        <td className="px-5 py-3.5"><StatusChip status={b.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl border p-6" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
          <h2 style={{ fontFamily: FONT.heading, color: t.textPrimary }} className="font-extrabold text-[15px] mb-0.5">Booking Status</h2>
          <p style={{ fontFamily: FONT.body, color: t.textSecondary }} className="text-[12px] mb-6">Current distribution</p>
          {statusBars.map((s, i) => (
            <ProgressBar key={s.label} label={s.label} pct={s.pct} color={s.color} t={t} delay={i * 150} />
          ))}
          <div className="mt-5 p-4 rounded-xl border" style={{ background: t.dark ? "rgba(239,131,84,0.12)" : "rgba(239,131,84,0.07)", borderColor: t.dark ? "rgba(239,131,84,0.3)" : "rgba(239,131,84,0.2)" }}>
            <p style={{ fontFamily: FONT.heading, color: BRAND.coral }} className="text-[11px] font-extrabold uppercase tracking-wider mb-3">Quick Actions</p>
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="w-full text-left px-3 py-2 rounded-lg border text-[13px] font-medium mb-2 last:mb-0 transition-all duration-150"
                style={{ fontFamily: FONT.body, color: t.textSecondary, borderColor: t.dark ? "rgba(255,255,255,0.08)" : "#EEE0D8" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND.coral; e.currentTarget.style.color = BRAND.coral; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.dark ? "rgba(255,255,255,0.08)" : "#EEE0D8"; e.currentTarget.style.color = t.textSecondary; }}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
