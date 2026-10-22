import React, { useState, useEffect, useCallback } from "react";
import {
  Cloud, ChevronDown, ChevronUp, RefreshCw, CloudRain, Wind,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import { buildApiUrl } from "../../../../config/api";
import {
  getWeatherInfo, parseForecast, formatHour, loadLocationWeather,
} from "../../../../services/weatherService";

const HourlyForecastTable = ({ days }) => {
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const selectedDay = days[activeDayIdx] || null;

  if (!days.length) {
    return <p className="text-xs text-slate-400 py-4 text-center">No forecast data available.</p>;
  }

  return (
    <div className="mt-3 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
      <div className="flex gap-2 p-3 overflow-x-auto border-b border-slate-100 bg-white">
        {days.map((day, idx) => {
          const isActive = idx === activeDayIdx;
          const noon = day.hours[12] || day.hours[0];
          const wInfo = getWeatherInfo(noon?.weatherCode);
          const parts = day.label.split(",");
          return (
            <button
              key={idx}
              onClick={() => setActiveDayIdx(idx)}
              className={`min-w-[80px] px-2 py-2 rounded-xl flex flex-col items-center gap-0.5 flex-shrink-0 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#EF8354] text-white shadow-md shadow-[#EF8354]/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-[10px] font-bold">{idx === 0 ? "Today" : parts[0]?.trim()}</span>
              <span className="text-lg">{wInfo.icon}</span>
              <span className="text-xs font-black">{Math.round(noon?.temp ?? 0)}°C</span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                {["Time", "Condition", "Temp", "Rain", "Wind"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedDay.hours.map((hour, hIdx) => {
                const wInfo = getWeatherInfo(hour.weatherCode);
                return (
                  <tr key={hIdx} className={hIdx % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>
                    <td className="px-3 py-2 font-semibold text-slate-600 whitespace-nowrap">{formatHour(hour.time)}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>{wInfo.icon}</span>{wInfo.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-black text-slate-800">{Math.round(hour.temp)}°C</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-sky-600 font-semibold">
                        <CloudRain className="w-3 h-3" />{hour.precipProb ?? 0}%
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1 text-slate-500 font-semibold">
                        <Wind className="w-3 h-3" />{hour.windSpeed ?? 0} km/h
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const BookingWeatherPanel = ({ booking }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [places, setPlaces] = useState([]);
  const [weatherByPlace, setWeatherByPlace] = useState({});
  const [expandedPlaceId, setExpandedPlaceId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWeather = useCallback(async () => {
    if (!booking?.packageId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(buildApiUrl(`/packages/${booking.packageId}`));
      const pkg = await res.json();
      if (!res.ok) throw new Error(pkg.error || "Failed to load package destinations.");

      const destinations = pkg.destinations || [];
      setPlaces(destinations);

      const results = await Promise.all(
        destinations.map(async (place) => {
          try {
            const { displayName, weatherData } = await loadLocationWeather(place.name);
            return {
              placeId: place.id,
              displayName,
              weatherData,
              error: null,
            };
          } catch (err) {
            return {
              placeId: place.id,
              displayName: null,
              weatherData: null,
              error: err.message || "Weather unavailable",
            };
          }
        })
      );

      const map = {};
      results.forEach((r) => { map[r.placeId] = r; });
      setWeatherByPlace(map);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to load weather data.");
    } finally {
      setLoading(false);
    }
  }, [booking?.packageId]);

  useEffect(() => {
    if (!expanded) return;
    loadWeather();
  }, [expanded, loadWeather, refreshKey]);

  useEffect(() => {
    if (!expanded) return;
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [expanded]);

  if (booking.tourType !== "PACKAGE" || !booking.packageId) return null;

  const togglePlace = (placeId) => {
    setExpandedPlaceId((prev) => (prev === placeId ? null : placeId));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#EF8354]/10 rounded-xl flex items-center justify-center">
            <Cloud className="w-5 h-5 text-[#EF8354]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">Package Weather Forecast</p>
            <p className="text-xs text-slate-500">
              Live weather for each destination in {booking.packageName || "your package"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#EF8354]">
          <span className="text-xs font-bold hidden sm:inline">
            {expanded ? "Hide" : "Show"} Forecast
          </span>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="flex items-center justify-between mt-4 mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Current + 7-Day Hourly Forecast
            </p>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-[10px] text-slate-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                disabled={loading}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#EF8354] hover:text-[#4F5D75] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {loading && places.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-[#EF8354]" />
              <span className="text-sm font-semibold">Fetching live weather for all destinations…</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-700">{error}</p>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  className="mt-2 text-xs font-bold text-[#EF8354] hover:underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {places.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full border-collapse text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Location", "Tour Day", "Current", "Condition", "Humidity", "Wind", "7-Day Forecast"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {places.map((place) => {
                    const entry = weatherByPlace[place.id];
                    const current = entry?.weatherData?.current;
                    const wInfo = current ? getWeatherInfo(current.weather_code) : null;
                    const days = entry?.weatherData?.hourly
                      ? parseForecast(entry.weatherData.hourly)
                      : [];
                    const isOpen = expandedPlaceId === place.id;

                    return (
                      <React.Fragment key={place.id}>
                        <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-bold text-slate-800">{place.name}</p>
                              {entry?.displayName && entry.displayName !== place.name && (
                                <p className="text-[10px] text-[#EF8354] font-semibold mt-0.5">{entry.displayName}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">Day {place.dayNumber}</td>
                          <td className="px-4 py-3">
                            {entry?.error ? (
                              <span className="text-xs text-amber-600 font-semibold">—</span>
                            ) : current ? (
                              <span className="text-base font-black text-slate-800">{Math.round(current.temperature_2m)}°C</span>
                            ) : (
                              <RefreshCw className="w-4 h-4 text-[#EF8354] animate-spin" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {wInfo ? (
                              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                <span className="text-lg">{wInfo.icon}</span>
                                {wInfo.label}
                              </span>
                            ) : entry?.error ? (
                              <span className="text-xs text-amber-600">{entry.error}</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">
                            {current ? `${current.relative_humidity_2m}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">
                            {current ? `${current.wind_speed_10m} km/h` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {days.length > 0 ? (
                              <div className="flex items-center gap-2">
                                {days.slice(0, 7).map((day, idx) => {
                                  const noon = day.hours[12] || day.hours[0];
                                  const dInfo = getWeatherInfo(noon?.weatherCode);
                                  return (
                                    <div key={idx} className="flex flex-col items-center min-w-[36px]" title={day.label}>
                                      <span className="text-[9px] font-bold text-slate-400">{idx === 0 ? "Now" : day.label.split(",")[0]?.trim().slice(0, 3)}</span>
                                      <span className="text-sm">{dInfo.icon}</span>
                                      <span className="text-[10px] font-black text-slate-700">{Math.round(noon?.temp ?? 0)}°</span>
                                    </div>
                                  );
                                })}
                                <button
                                  onClick={() => togglePlace(place.id)}
                                  className="ml-1 flex items-center gap-0.5 text-[10px] font-bold text-[#EF8354] hover:text-[#4F5D75] whitespace-nowrap cursor-pointer"
                                >
                                  Hourly
                                  <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                </button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                        {isOpen && days.length > 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-3 bg-slate-50/80">
                              <p className="text-xs font-bold text-slate-600 mb-1">
                                7-Day Hourly Forecast — {place.name}
                              </p>
                              <HourlyForecastTable days={days} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-[10px] text-slate-400 font-medium">
            Powered by Open-Meteo · Auto-refreshes every 30 minutes while open
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingWeatherPanel;
