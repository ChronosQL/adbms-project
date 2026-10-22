import { useState, useRef, useEffect } from "react";
import { RefreshCw, MapPin, CloudSun } from "lucide-react";
import { useWeatherNotifications } from "../../context/WeatherNotificationContext";

/* ── Attractive animated weather icon (sun + cloud) ─────────────────────────
   Uses lucide-react CloudSun wrapped in a styled container so it renders beautifully on any theme */
const WeatherIcon = ({ pulse = false }) => (
  <div className={`relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md text-white border border-amber-300/50 ${pulse ? 'animate-pulse' : ''}`}>
    <CloudSun size={18} strokeWidth={2.5} />
  </div>
);

const NotificationCard = ({ notification }) => (
  <div className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
    <p className="text-sm font-black text-slate-800 mb-3">Good Morning!</p>

    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      Today&apos;s Destinations
    </p>
    <ul className="mb-3 space-y-0.5">
      {notification.destinations.map((name) => (
        <li key={name} className="text-sm text-slate-700 flex items-center gap-1.5">
          <span className="text-[#EF8354]">•</span> {name}
        </li>
      ))}
    </ul>

    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      Weather Forecast
    </p>
    <ul className="mb-3 space-y-0.5">
      {notification.forecasts.map((f) => (
        <li key={f.name} className="text-sm text-slate-700 flex items-start gap-1.5">
          <span className="text-[#EF8354] mt-0.5">•</span>
          <span>
            <span className="font-semibold">{f.name}</span>
            {" — "}
            {f.summary}
          </span>
        </li>
      ))}
    </ul>

    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      Recommendation
    </p>
    <p className="text-sm text-slate-700 leading-relaxed">{notification.recommendation}</p>

    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
      <MapPin className="w-3 h-3" />
      {notification.packageName} · Day {notification.tourDay}
    </div>
  </div>
);

const NotificationBell = () => {
  const { notifications, unreadCount, loading, refreshNotifications, markAllRead, isCustomer, hasActiveTour } =
    useWeatherNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Only render for customers who currently have an active (started) tour
  if (!isCustomer || (!hasActiveTour && !loading)) return null;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      markAllRead();
      if (!notifications.length && !loading) refreshNotifications();
    }
  };

  return (
    <>
      <div className="relative" ref={panelRef}>
        <button
          onClick={handleToggle}
          className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-amber-50/50 transition-colors cursor-pointer"
          aria-label="Weather notifications"
          title="Tour weather notifications"
        >
          <WeatherIcon pulse={unreadCount > 0} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#EF8354] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute top-[120%] right-0 w-[min(100vw-2rem,380px)] bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-2xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WeatherIcon />
                <div>
                  <p className="text-sm font-bold text-slate-800">Weather Alerts</p>
                  <p className="text-[10px] text-slate-400 font-medium">Daily tour forecasts</p>
                </div>
              </div>
              <button
                onClick={refreshNotifications}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-[#EF8354] disabled:opacity-50 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading && notifications.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#EF8354]" />
                  <span className="text-sm font-semibold">Loading forecasts…</span>
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="py-10 px-6 text-center">
                  <WeatherIcon />
                  <p className="text-sm font-bold text-slate-600 mt-3">No weather alerts</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Daily weather updates appear here when your package tour has started.
                  </p>
                </div>
              )}

              {notifications.map((n) => (
                <NotificationCard key={n.id} notification={n} />
              ))}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  Powered by Open-Meteo · Refreshes hourly
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;
