import { buildApiUrl } from "../config/api";
import {
  loadLocationWeather,
  summarizeLocationWeather,
  buildWeatherRecommendation,
} from "../services/weatherService";

const READ_STORAGE_KEY = "cbt_weather_notifications_read";

export const getTodayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const parseDateOnly = (dateStr) => {
  if (!dateStr) return null;
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

export const isTourActiveToday = (startDate, today = new Date()) => {
  const start = parseDateOnly(startDate);
  if (!start) return false;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return t >= start;
};

export const getTourDayNumber = (startDate, today = new Date()) => {
  const start = parseDateOnly(startDate);
  if (!start) return 1;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((t - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
};

export const getNotificationId = (bookingId, dateStr = getTodayDateStr()) =>
  `${bookingId}-${dateStr}`;

export const getReadNotificationIds = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "{}");
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    const pruned = {};
    let changed = false;
    for (const [id, ts] of Object.entries(raw)) {
      if (ts > cutoff) {
        pruned[id] = ts;
      } else {
        changed = true; // this entry has expired
      }
    }
    if (changed) localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(pruned));
    return pruned;
  } catch {
    return {};
  }
};

export const markNotificationRead = (notificationId) => {
  const read = getReadNotificationIds();
  read[notificationId] = Date.now();
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(read));
};

export const markNotificationsRead = (notificationIds) => {
  const read = getReadNotificationIds();
  const now = Date.now();
  notificationIds.forEach((id) => { read[id] = now; });
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(read));
};

export const isActivePackageTour = (booking) =>
  booking?.tourType === "PACKAGE"
  && (booking?.status === "TOUR_STARTED" || booking?.status === "CONFIRMED")
  && booking?.packageId
  && isTourActiveToday(booking.startDate);

export const buildDailyWeatherNotification = async (booking) => {
  const dateStr = getTodayDateStr();
  const tourDay = getTourDayNumber(booking.startDate);
  const notificationId = getNotificationId(booking.id, dateStr);

  const res = await fetch(buildApiUrl(`/packages/${booking.packageId}`));
  const pkg = await res.json();
  if (!res.ok) throw new Error(pkg.error || "Failed to load package.");

  const todayPlaces = (pkg.destinations || []).filter(
    (p) => Number(p.dayNumber) === tourDay
  );

  if (todayPlaces.length === 0) return null;

  const weatherResults = await Promise.all(
    todayPlaces.map(async (place) => {
      try {
        const { weatherData } = await loadLocationWeather(place.name);
        const forecast = summarizeLocationWeather(weatherData);
        return {
          name: place.name,
          ...forecast,
          error: null,
        };
      } catch (err) {
        return {
          name: place.name,
          summary: "Weather unavailable",
          isRainy: false,
          maxTemp: null,
          error: err.message,
        };
      }
    })
  );

  const recommendation = buildWeatherRecommendation(weatherResults);

  return {
    id: notificationId,
    bookingId: booking.id,
    packageName: booking.packageName || pkg.title || "Package Tour",
    tourDay,
    dateStr,
    destinations: todayPlaces.map((p) => p.name),
    forecasts: weatherResults,
    recommendation,
    createdAt: Date.now(),
  };
};

export const fetchActiveTourNotifications = async (bookings) => {
  const active = (bookings || []).filter(isActivePackageTour);
  if (!active.length) return [];

  const results = await Promise.all(
    active.map((b) => buildDailyWeatherNotification(b).catch(() => null))
  );

  return results.filter(Boolean);
};
