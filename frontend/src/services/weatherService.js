// Shared Open-Meteo weather utilities (no database — live API only)

export const getWeatherInfo = (code) => {
  if (code === 0)                            return { label: "Sunny",            icon: "☀️" };
  if (code >= 1  && code <= 3)               return { label: "Partly Cloudy",    icon: "⛅" };
  if (code === 45 || code === 48)            return { label: "Foggy",            icon: "🌫️" };
  if (code >= 51  && code <= 55)             return { label: "Drizzle",          icon: "🌦️" };
  if (code === 56 || code === 57)            return { label: "Freezing Drizzle", icon: "🌨️" };
  if (code >= 61  && code <= 65)             return { label: "Rainy",            icon: "🌧️" };
  if (code === 66 || code === 67)            return { label: "Freezing Rain",    icon: "🌨️" };
  if (code >= 71  && code <= 77)             return { label: "Snowy",            icon: "❄️" };
  if (code >= 80  && code <= 82)             return { label: "Showers",          icon: "🌧️" };
  if (code === 85 || code === 86)            return { label: "Snow Showers",     icon: "❄️" };
  if (code >= 95  && code <= 99)             return { label: "Thunderstorm",     icon: "⛈️" };
  return { label: "Unknown", icon: "❓" };
};

export const formatHour = (timeStr = "") => {
  const timePart = timeStr.split("T")[1] || "";
  const h = parseInt(timePart.split(":")[0], 10);
  if (isNaN(h)) return timeStr;
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${suffix}`;
};

export const formatShortHour = (timeStr = "") => {
  const h = parseInt(timeStr.split("T")[1]?.split(":")[0], 10);
  if (isNaN(h)) return timeStr;
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
};

export const parseForecast = (hourly) => {
  const days = [];
  if (!hourly?.time) return days;
  for (let d = 0; d < 7; d++) {
    const baseIdx = d * 24;
    const dateStr = hourly.time[baseIdx];
    if (!dateStr) break;
    const dateObj = new Date(dateStr);
    const label = dateObj.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    const hours = [];
    for (let h = 0; h < 24; h++) {
      const i = baseIdx + h;
      if (i >= hourly.time.length) break;
      hours.push({
        time:        hourly.time[i],
        temp:        hourly.temperature_2m[i],
        weatherCode: hourly.weather_code[i],
        precipProb:  hourly.precipitation_probability[i],
        windSpeed:   hourly.wind_speed_10m[i],
      });
    }
    days.push({ label, hours });
  }
  return days;
};

export const geocodeLocation = async (name) => {
  const trySearch = async (query) => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=3&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding API returned ${res.status}`);
    const data = await res.json();
    return data.results?.length > 0 ? data.results[0] : null;
  };

  let result = await trySearch(name);
  if (result) return result;

  result = await trySearch(`${name}, Sri Lanka`);
  return result || null;
};

export const fetchForecast = async (latitude, longitude) => {
  const url = [
    `https://api.open-meteo.com/v1/forecast`,
    `?latitude=${latitude}`,
    `&longitude=${longitude}`,
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m`,
    `&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m`,
    `&timezone=auto`,
    `&forecast_days=7`,
  ].join("");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
  const data = await res.json();
  if (!data.current) throw new Error("Unexpected weather response format");
  return data;
};

export const loadLocationWeather = async (locationName) => {
  const geo = await geocodeLocation(locationName);
  if (!geo) throw new Error(`Location "${locationName}" not found.`);

  const { latitude, longitude, name, country } = geo;
  const displayName = [name, country].filter(Boolean).join(", ");
  const data = await fetchForecast(latitude, longitude);

  return { displayName, weatherData: data };
};

const RAIN_CODES = new Set([
  51, 52, 53, 54, 55, 56, 57, 61, 62, 63, 64, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

export const isRainyCode = (code) => RAIN_CODES.has(code);

export const isHeavyRainCode = (code) =>
  (code >= 61 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;

export const getTodayDateStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const summarizeLocationWeather = (weatherData) => {
  const current = weatherData?.current;
  if (!current) return { summary: "Unavailable", isRainy: false, maxTemp: null };

  const currentInfo = getWeatherInfo(current.weather_code);
  const hourly = weatherData.hourly;
  const todayStr = getTodayDateStr();
  const nowHour = new Date().getHours();

  const todayHours = [];
  if (hourly?.time) {
    for (let i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i]?.startsWith(todayStr)) {
        todayHours.push({
          time: hourly.time[i],
          weatherCode: hourly.weather_code[i],
          precipProb: hourly.precipitation_probability[i],
          temp: hourly.temperature_2m[i],
        });
      }
    }
  }

  const maxTemp = todayHours.length
    ? Math.max(...todayHours.map((h) => h.temp ?? 0))
    : current.temperature_2m;

  const isRainyHour = (h) =>
    isRainyCode(h.weatherCode) || (h.precipProb ?? 0) >= 50;

  let firstRain = null;
  for (const h of todayHours) {
    const hour = parseInt(h.time.split("T")[1]?.split(":")[0], 10);
    if (Number.isNaN(hour) || hour <= nowHour) continue;
    if (isRainyHour(h)) {
      firstRain = h;
      break;
    }
  }

  if (firstRain) {
    const rainInfo = getWeatherInfo(firstRain.weatherCode);
    const intensity = isHeavyRainCode(firstRain.weatherCode) ? "Heavy Rain" : rainInfo.label;
    return {
      summary: `${intensity} expected after ${formatShortHour(firstRain.time)}`,
      isRainy: true,
      maxTemp,
    };
  }

  if (isRainyCode(current.weather_code) || todayHours.some(isRainyHour)) {
    return { summary: currentInfo.label, isRainy: true, maxTemp };
  }

  return { summary: currentInfo.label, isRainy: false, maxTemp };
};

export const buildWeatherRecommendation = (locationForecasts) => {
  const tips = [];
  const anyRain = locationForecasts.some(
    (f) => f.isRainy || /rain|shower|drizzle|thunder/i.test(f.summary)
  );
  const anySunny = locationForecasts.some((f) => /sunny/i.test(f.summary));
  const anyHot = locationForecasts.some((f) => (f.maxTemp ?? 0) >= 32);
  const anyStorm = locationForecasts.some((f) => /thunder/i.test(f.summary));

  if (anyRain) tips.push("Carry an umbrella and waterproof footwear.");
  if (anyStorm) tips.push("Avoid open areas during afternoon storms.");
  if (anySunny && !anyRain) tips.push("Apply sunscreen and bring a hat.");
  if (anyHot) tips.push("Stay hydrated throughout the day.");

  return tips.join(" ") || "Have a wonderful day on your tour!";
};
