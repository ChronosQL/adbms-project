import { SRI_LANKA_LOCATIONS } from "../components/pages/Site/TourBooking/PointToPoint/sriLankaLocations";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";
const queryCache = new Map();

/**
 * Categorize Mapbox place types into user-friendly badge labels.
 */
function resolveCategory(feature) {
  const cat = feature.properties?.category;
  if (cat) {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  }

  const placeType = feature.place_type?.[0];
  switch (placeType) {
    case "poi":
      return "Point of Interest";
    case "address":
      return "Address";
    case "neighborhood":
      return "Neighborhood";
    case "locality":
    case "place":
      return "City / Town";
    case "district":
    case "region":
      return "Region";
    default:
      return "Location";
  }
}

/**
 * Search locations in Sri Lanka using Mapbox Geocoding API with local curated fallback.
 * @param {string} query - Location search string
 * @param {object} options - Optional parameters
 * @returns {Promise<Array<{ label: string, shortName: string, category: string, lat: number, lng: number }>>}
 */
export async function searchLocations(query, options = {}) {
  const q = (query || "").trim();

  // If empty query, return top curated Sri Lanka transit and airport hubs
  if (!q) {
    return SRI_LANKA_LOCATIONS.slice(0, 10).map((loc) => ({
      label: loc.label,
      shortName: loc.label.split(",")[0],
      category: loc.category || "Popular Hub",
      lat: loc.lat,
      lng: loc.lng,
    }));
  }

  // Check cache
  const cacheKey = q.toLowerCase();
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey);
  }

  // 1. Try Mapbox Geocoding if token is available
  if (MAPBOX_TOKEN) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        q
      )}.json?country=lk&proximity=79.8612,6.9271&types=poi,address,neighborhood,locality,place,district&limit=8&access_token=${MAPBOX_TOKEN}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const features = data.features || [];

        if (features.length > 0) {
          const results = features.map((f) => ({
            label: f.place_name,
            shortName: f.text || f.place_name.split(",")[0],
            category: resolveCategory(f),
            lat: f.geometry?.coordinates?.[1] ?? null,
            lng: f.geometry?.coordinates?.[0] ?? null,
          }));

          queryCache.set(cacheKey, results);
          return results;
        }
      }
    } catch (err) {
      console.warn("[locationService] Mapbox lookup failed, falling back to local registry:", err);
    }
  }

  // 2. Try OpenStreetMap Photon Geocoder for Sri Lanka if Mapbox is unavailable
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&bbox=79.5,5.8,82.0,9.9&limit=8`;
    const pRes = await fetch(photonUrl);
    if (pRes.ok) {
      const pData = await pRes.json();
      const features = pData.features || [];
      if (features.length > 0) {
        const results = features.map(f => {
          const props = f.properties || {};
          const name = props.name || q;
          const details = [props.city, props.state, props.country].filter(Boolean).join(', ');
          const label = details ? `${name}, ${details}` : name;
          return {
            label,
            shortName: name,
            category: props.osm_value ? (props.osm_value.charAt(0).toUpperCase() + props.osm_value.slice(1)) : 'Location',
            lat: f.geometry?.coordinates?.[1] ?? null,
            lng: f.geometry?.coordinates?.[0] ?? null,
          };
        });
        queryCache.set(cacheKey, results);
        return results;
      }
    }
  } catch (err) {
    console.warn("[locationService] Photon lookup failed, falling back to local registry:", err);
  }

  // 3. Fallback: Search local curated registry
  const lowerQ = q.toLowerCase();
  const localMatches = SRI_LANKA_LOCATIONS.filter((loc) =>
    (loc.label || String(loc)).toLowerCase().includes(lowerQ)
  )
    .slice(0, 10)
    .map((loc) => ({
      label: loc.label,
      shortName: loc.label.split(",")[0],
      category: loc.category || "Location",
      lat: loc.lat,
      lng: loc.lng,
    }));

  queryCache.set(cacheKey, localMatches);
  return localMatches;
}

export default {
  searchLocations,
};
