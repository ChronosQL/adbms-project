import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, CloudRain, Wind } from "lucide-react";
import { getWeatherInfo, parseForecast, formatHour } from "../../../../../services/weatherService";

export { getWeatherInfo, parseForecast, formatHour };

/* ─── Modal (portalled to document.body to escape framer-motion transforms) ── */
const WeatherModal = ({ locationName, forecastHourly, onClose }) => {
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  /* Close on Escape key */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const days        = parseForecast(forecastHourly);
  const selectedDay = days[activeDayIdx] || null;

  return ReactDOM.createPortal(
    /* ── Backdrop ────────────────────────────────────────────────────────── */
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999,
               background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
               display: "flex", alignItems: "center", justifyContent: "center",
               padding: "16px" }}
      onClick={onClose}
    >
      {/* ── Panel ──────────────────────────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "860px",
          height: "90vh",
          maxHeight: "90vh",
          boxShadow: "0 32px 80px rgba(75, 55, 55, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "20px 28px",
          borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800,
                         color: "#2D3142", display: "flex", alignItems: "center", gap: "8px" }}>
              📍 {locationName}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "11px", fontWeight: 700,
                        color: "#EF8354", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              7-Day Hourly Weather Forecast
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "#f1f5f9", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748b", fontSize: "14px", flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Day Tabs ───────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: "8px", padding: "12px 20px",
          overflowX: "auto", flexShrink: 0,
          background: "#f8fafc", borderBottom: "1px solid #f1f5f9",
        }}>
          {days.map((day, idx) => {
            const isActive = idx === activeDayIdx;
            const noon     = day.hours[12] || day.hours[0];
            const wInfo    = getWeatherInfo(noon?.weatherCode);
            const parts    = day.label.split(",");
            return (
              <button
                key={idx}
                onClick={() => setActiveDayIdx(idx)}
                style={{
                  minWidth: "90px",
                  padding: "10px 8px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  background: isActive ? "#EF8354" : "#fff",
                  color:      isActive ? "#fff"    : "#475569",
                  boxShadow:  isActive ? "0 4px 14px rgba(0,176,165,0.30)" : "0 1px 4px rgba(0,0,0,0.08)",
                  transition: "all 0.18s",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.04em" }}>
                  {idx === 0 ? "Today" : parts[0]?.trim()}
                </span>
                <span style={{ fontSize: "10px", opacity: 0.75 }}>
                  {parts[1]?.trim() || ""}
                </span>
                <span style={{ fontSize: "22px", margin: "2px 0" }}>{wInfo.icon}</span>
                <span style={{ fontSize: "13px", fontWeight: 900 }}>
                  {Math.round(noon?.temp ?? 0)}°C
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Table ────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#f8fafc" }}>
          {selectedDay ? (
            <div style={{
              background: "#fff", borderRadius: "18px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Time", "Condition", "Temp", "Rain Chance", "Wind"].map((h) => (
                      <th key={h} style={{
                        padding: "14px 16px", textAlign: "left",
                        fontSize: "11px", fontWeight: 800, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedDay.hours.map((hour, hIdx) => {
                    const wInfo = getWeatherInfo(hour.weatherCode);
                    const isEven = hIdx % 2 === 0;
                    return (
                      <tr key={hIdx} style={{ background: isEven ? "#fff" : "#fafbfc" }}>
                        <td style={{ padding: "12px 16px", fontSize: "13px",
                                     fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>
                          {formatHour(hour.time)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "8px",
                                         fontSize: "13px", fontWeight: 700, color: "#2D3142" }}>
                            <span style={{ fontSize: "18px" }}>{wInfo.icon}</span>
                            {wInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "left" }}>
                          <span style={{ fontSize: "15px", fontWeight: 900, color: "#2D3142" }}>
                            {Math.round(hour.temp)}°C
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            background: "#eff6ff", color: "#3b82f6",
                            padding: "4px 10px", borderRadius: "999px",
                            fontSize: "12px", fontWeight: 700,
                          }}>
                            <CloudRain size={13} />
                            {hour.precipProb ?? 0}%
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px",
                                         fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                            <Wind size={13} style={{ color: "#94a3b8" }} />
                            {hour.windSpeed ?? 0} km/h
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}>
              No forecast data available.
            </p>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "16px 28px", background: "#f8fafc",
          borderTop: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            🌐 Powered by Open-Meteo · Updates in real time
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px", background: "#2D3142",
              color: "#fff", border: "none", borderRadius: "12px",
              fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em",
              textTransform: "uppercase", cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#1e293b"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#2D3142"}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body   /* ← portalled: escapes framer-motion transform context */
  );
};

export default WeatherModal;
