import React, { useState, useEffect } from "react";
import { CloudRain, Wind, Calendar, RefreshCw, AlertTriangle } from "lucide-react";
import WeatherModal, { getWeatherInfo } from "./WeatherModal";
import { loadLocationWeather } from "../../../../../services/weatherService";

// ─── Component ────────────────────────────────────────────────────────────────
const LocationWeather = ({ locationName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvedName, setResolvedName] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    if (!locationName) {
      setError("No location name provided.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setWeatherData(null);
      setResolvedName(null);

      try {
        const { displayName, weatherData } = await loadLocationWeather(locationName);

        if (active) {
          setResolvedName(displayName);
          setWeatherData(weatherData);
          setLoading(false);
        }
      } catch (err) {
        console.error("[LocationWeather] Error for", locationName, err);
        if (active) {
          setError(err.message || "Failed to load weather.");
          setLoading(false);
        }
      }
    };

    load();
    return () => { active = false; };
  }, [locationName, refreshTrigger]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mt-3 px-3 py-3 border border-slate-100 bg-slate-50/50 rounded-xl flex items-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 text-[#EF8354] animate-spin flex-shrink-0" />
        <span className="text-[11px] text-slate-400 font-semibold">Fetching live weather…</span>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !weatherData) {
    return (
      <div className="mt-3 px-3 py-3 border border-amber-100 bg-amber-50/30 rounded-xl">
        <div className="flex items-start gap-2 mb-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-amber-700 leading-snug">
            Weather unavailable
          </p>
        </div>
        <p className="text-[10px] text-slate-500 mb-2 pl-5">{error}</p>
        <button
          onClick={() => setRefreshTrigger(v => v + 1)}
          className="ml-5 inline-flex items-center gap-1 text-[10px] font-bold text-[#EF8354] hover:text-[#4F5D75] bg-white border border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  const current = weatherData.current;
  const wInfo = getWeatherInfo(current.weather_code);

  return (
    <div className="mt-3 p-3 border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white rounded-xl relative transition-all duration-300 hover:shadow-sm">

      {/* Resolved city label */}
      {resolvedName && (
        <p className="text-[9px] font-bold text-[#EF8354] uppercase tracking-widest mb-2 flex items-center gap-1">
          <span>🌐</span> {resolvedName}
        </p>
      )}

      {/* Main weather section */}
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{wInfo.icon}</span>
          <div>
            <span className="text-lg font-black text-slate-800 tracking-tight">
              {Math.round(current.temperature_2m)}°C
            </span>
            <p className="text-[10px] font-bold text-slate-500 leading-tight">
              {wInfo.label} · Feels {Math.round(current.apparent_temperature)}°C
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-0.5 bg-[#EF8354] hover:bg-[#4F5D75] text-white px-1 py-0 rounded text-[7px] font-semibold cursor-pointer"
        >
          <Calendar className="w-1.5 h-1.5" />
          Forecast
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
          <CloudRain className="w-3 h-3 text-sky-400" />
          Humidity {current.relative_humidity_2m}%
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
          <Wind className="w-3 h-3 text-slate-400" />
          Wind {current.wind_speed_10m} km/h
        </span>
        <button
          onClick={() => setRefreshTrigger(v => v + 1)}
          className="ml-auto p-1 text-slate-300 hover:text-[#EF8354] rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          title="Refresh weather"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* Forecast modal */}
      {showModal && (
        <WeatherModal
          locationName={resolvedName || locationName}
          forecastHourly={weatherData.hourly}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default LocationWeather;
