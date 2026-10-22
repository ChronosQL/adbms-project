// components/pages/Admin/AdminDashboard/AdminLayout.jsx
import { useState, useEffect, useRef, useContext } from "react";
import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext";
import {
  Sun, Moon, Home, User, LogIn,
  LayoutDashboard, CalendarCheck, Wallet, Car,
  PackageSearch, MessageSquare, BarChart3,
} from "lucide-react";
import logo from "../../../../assets/logo4.png";
import { useBookings } from "../../../../context/BookingsContext";
import { useMessages } from "../../../../context/useMessages.js";
import { BRAND, FONT, FONT_IMPORT, getTheme } from "./adminTheme";

function buildNavItems(pendingCount, unreadCount) {
  return [
    { label: "Overview",  path: "/admin/admin-dashboard",  id: "overview", icon: LayoutDashboard, badge: 0 },
    { label: "Bookings",  path: "/admin/approve-bookings", id: "bookings", icon: CalendarCheck,   badge: pendingCount },
    { label: "Payments",  path: "/admin/seasonal-pricing", id: "payments", icon: Wallet,           badge: 0 },
    { label: "Fleet",     path: "/admin/fleet-management", id: "fleet",    icon: Car,              badge: 0 },
    { label: "Packages",  path: "/admin/tour-packages",    id: "packages", icon: PackageSearch,    badge: 0 },
    { label: "Messages",  path: "/admin/messages",         id: "messages", icon: MessageSquare,    badge: unreadCount },
    { label: "Reports",   path: "/admin/report",           id: "reports",  icon: BarChart3,        badge: 0 },
  ];
}


// Icon button used both for nav items and the bottom rail (theme toggle, home)
function IconTile({ active, onClick, to, children, tooltip, badge, style = {} }) {
  const [hover, setHover] = useState(false);
  const [coords, setCoords] = useState(null);
  const ref = useRef(null);

  const handleMouseEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCoords(rect);
    setHover(true);
  };

  const handleMouseLeave = () => {
    setHover(false);
    setCoords(null);
  };

  const tile = (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        position: "relative",
        width: 46, height: 46,
        zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 14, cursor: "pointer",
        background: active ? BRAND.coral : (hover ? "var(--tile-hover)" : "transparent"),
        color: active ? "#FFFFFF" : "var(--tile-fg)",
        transition: "background .15s, color .15s",
        ...style,
      }}
    >
      {children}
      {badge > 0 && (
        <span style={{
          position: "absolute", top: -3, right: -3,
          minWidth: 16, height: 16, padding: "0 4px",
          borderRadius: 9999, background: active ? "#FFFFFF" : BRAND.coral,
          color: active ? BRAND.coral : "#FFFFFF",
          fontSize: 9, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT.body,
        }}>
          {badge}
        </span>
      )}
      {hover && tooltip && coords && (
        <span style={{
          position: "fixed", left: coords.right + 10, top: coords.top + coords.height / 2,
          transform: "translateY(-50%)",
          background: BRAND.gunmetal, color: "#fff",
          fontSize: 12, fontWeight: 700, fontFamily: FONT.body,
          padding: "6px 12px", borderRadius: 8, whiteSpace: "nowrap",
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)", zIndex: 99999,
          pointerEvents: "none",
        }}>
          {tooltip}
        </span>
      )}
    </div>
  );

  return to ? <NavLink to={to} style={{ textDecoration: "none" }}>{tile}</NavLink> : tile;
}

export default function AdminLayout() {
  const [dark, setDark] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const t = getTheme(dark);

  const { bookings } = useBookings();
  const { messages, getAdminNotificationCount } = useMessages();
  const pendingCount = bookings?.filter(b => b.status === "PENDING").length || 0;
  const unreadCount = messages?.length ? getAdminNotificationCount() : 0;
  const NAV_ITEMS = buildNavItems(pendingCount, unreadCount);

  const currentNav = NAV_ITEMS.find(n => location.pathname.startsWith(n.path)) || NAV_ITEMS[0];

  const handleLogout = () => { logout(); navigate("/"); };

  useEffect(() => {
    const body = document.body;
    const root = document.getElementById("root");
    const prev = {
      bodyDisplay: body.style.display, bodyPlace: body.style.placeItems, bodyBg: body.style.backgroundColor,
      rootWidth: root ? root.style.width : "", rootMaxWidth: root ? root.style.maxWidth : "", rootMargin: root ? root.style.margin : "",
    };
    body.style.display = "block";
    body.style.placeItems = "unset";
    body.style.backgroundColor = "transparent";
    if (root) { root.style.width = "100%"; root.style.maxWidth = "100%"; root.style.margin = "0"; }
    return () => {
      body.style.display = prev.bodyDisplay;
      body.style.placeItems = prev.bodyPlace;
      body.style.backgroundColor = prev.bodyBg;
      if (root) { root.style.width = prev.rootWidth; root.style.maxWidth = prev.rootMaxWidth; root.style.margin = prev.rootMargin; }
    };
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      style={{
        display: "flex", minHeight: "100vh", width: "100%",
        background: t.pageBg, fontFamily: FONT.body,
        "--tile-hover": t.dark ? "rgba(255,255,255,0.08)" : "#F0F0F2",
        "--tile-fg": t.textSecondary,
      }}
    >
      <style>{`
        ${FONT_IMPORT}
        @keyframes pulse-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      `}</style>

      {/* ══════ ICON-ONLY SIDEBAR ══════ */}
      <aside style={{
        width: 72, minWidth: 72, flexShrink: 0,
        position: "sticky", top: 0, height: "100vh",
        display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center",
        background: t.cardBg, borderRight: `1px solid ${t.cardBorder}`,
        padding: "10px 0",
        boxSizing: "border-box",
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, flexShrink: 0,
          background: BRAND.coral,
        }}>
          <img src={logo} alt="Ceylon Best Tours" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>

        {/* Nav icons */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, padding: "4px 0" }}>
          {NAV_ITEMS.map(({ label, path, id, icon: Icon, badge }) => (
            <IconTile key={id} to={path} active={currentNav.id === id} tooltip={label} badge={badge}>
              <Icon size={19} strokeWidth={2} />
            </IconTile>
          ))}
        </nav>

        {/* Bottom controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", paddingTop: 10, marginTop: 10, borderTop: `1px solid ${t.cardBorder}`, width: "100%" }}>
          <IconTile onClick={() => navigate("/")} tooltip="Back to Website">
            <Home size={18} strokeWidth={2} />
          </IconTile>
          <IconTile onClick={() => setDark(d => !d)} tooltip={dark ? "Light mode" : "Dark mode"} style={{ color: dark ? "#F0C170" : BRAND.coral }}>
            {dark ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
          </IconTile>

          {user ? (
            <div className="group" style={{ position: "relative" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: BRAND.payneGray,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}>
                <User size={16} color="#fff" strokeWidth={2} />
              </div>

              {/* Dropdown — flies out to the right */}
              <div className="
                absolute bottom-0 left-[calc(100%+10px)] w-[200px]
                bg-white border border-gray-100 rounded-2xl py-2
                shadow-[0_20px_50px_rgba(0,0,0,0.18)]
                opacity-0 invisible translate-x-2 scale-95
                group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 group-hover:scale-100
                transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-50
              ">
                <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}>
                  <p style={{ margin: 0, fontSize: 10, color: "#4F5D75", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Signed in as</p>
                  <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 800, color: BRAND.gunmetal }}>{user.name}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", paddingTop: 4 }}>
                  <Link
                    to="/admin/profile"
                    style={{ padding: "10px 20px", fontSize: 14, fontWeight: 600, color: "#334155", borderRadius: 8, margin: "0 8px", fontFamily: FONT.body }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,131,84,0.12)"; e.currentTarget.style.color = BRAND.coral; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#334155"; }}
                  >
                    My Profile
                  </Link>
                  <div style={{ height: 1, background: "#f1f5f9", margin: "4px 12px" }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      textAlign: "left", padding: "10px 20px", fontSize: 14, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 8,
                      color: "#f87171", background: BRAND.gunmetal, border: "none", cursor: "pointer",
                      borderRadius: "0 0 16px 16px", width: "100%",
                    }}
                  >
                    <LogIn size={15} style={{ transform: "rotate(180deg)" }} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <IconTile onClick={() => navigate("/login")} tooltip="Login">
              <LogIn size={18} strokeWidth={2} />
            </IconTile>
          )}
        </div>
      </aside>
      {/* ══════ END SIDEBAR ══════ */}

      {/* ══════ RIGHT CONTENT ══════ */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflowX: "hidden", maxWidth: "calc(100vw - 72px)" }}>

        {/* Dynamic page title — updates with the active nav item */}
        <div style={{ padding: "28px 32px 6px" }}>
          <p style={{ fontFamily: FONT.body, color: t.textSecondary, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            {today}
          </p>
          <h1 style={{ fontFamily: FONT.heading, color: t.textPrimary, fontWeight: 900, fontSize: 28, margin: "2px 0 0", letterSpacing: "-0.5px" }}>
            {currentNav.label}
          </h1>
        </div>

        <main style={{ flex: 1, width: "100%" }}>
          <Outlet context={{ dark }} />
        </main>
      </div>

    </div>
  );
}
