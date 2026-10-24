/**
 * Package Data Transfer Object (DTO)
 * Consolidates package enum mapping, duration parsing, destination extraction,
 * availability status normalization, and row mappers for admin and public catalogs.
 */

const PACKAGE_TYPE_LABEL_TO_ENUM = {
  'Beach Side': 'BEACH SIDE',
  'Hill Country': 'HILL COUNTRY',
  'Safari': 'SAFARI',
  'Cultural Heritage': 'CULTURAL HERITAGE',
  'Adventure': 'ADVENTURE',
  'Wellness & Ayurveda': 'WELLNESS & AYURVEDA',
};

const PACKAGE_TYPE_ENUM_TO_LABEL = Object.entries(PACKAGE_TYPE_LABEL_TO_ENUM)
  .reduce((acc, [label, enumValue]) => {
    acc[enumValue] = label;
    return acc;
  }, {});

const toPackageTypeEnum = (value) => {
  if (value == null) return null;
  const raw = String(value).trim();
  if (PACKAGE_TYPE_LABEL_TO_ENUM[raw]) return PACKAGE_TYPE_LABEL_TO_ENUM[raw];

  const normalized = raw.toUpperCase().replace(/\s+/g, ' ');
  return PACKAGE_TYPE_ENUM_TO_LABEL[normalized] ? normalized : null;
};

const toPackageTypeLabel = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, ' ');
  return PACKAGE_TYPE_ENUM_TO_LABEL[normalized] || value;
};

const toPackageDaysLabel = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  if (normalized.endsWith('DAYS')) return normalized;
  const number = Number(value);
  if (Number.isNaN(number) || number <= 0) return null;
  return `${number} DAYS`;
};

const toPackageDaysNumber = (value) => {
  if (value == null) return null;
  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : Number(value) || null;
};

const normalizeAvailabilityStatus = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  return normalized === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
};

const buildAvailabilityPayload = (status) => ({
  status: normalizeAvailabilityStatus(status),
  isAvailable: normalizeAvailabilityStatus(status) !== 'UNAVAILABLE',
});

const extractAvailabilityStatus = (body = {}, defaultStatus = null) => {
  const hasAvailabilityField = ['availabilityStatus', 'status', 'packageStatus', 'availability']
    .some((key) => Object.prototype.hasOwnProperty.call(body, key));

  if (!hasAvailabilityField) {
    return defaultStatus == null ? null : normalizeAvailabilityStatus(defaultStatus);
  }

  return normalizeAvailabilityStatus(body.availabilityStatus || body.status || body.packageStatus || body.availability);
};

const parseDestinations = (destinationsInput) => {
  if (!destinationsInput) return [];
  if (Array.isArray(destinationsInput)) return destinationsInput;
  try {
    const parsed = JSON.parse(destinationsInput);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const extractPackagePayload = (body = {}) => {
  return {
    title: body.title ? String(body.title).trim() : null,
    typeEnum: toPackageTypeEnum(body.type),
    daysLabel: toPackageDaysLabel(body.days),
    daysNumber: toPackageDaysNumber(body.days),
    description: body.description ? String(body.description).trim() : null,
    destinations: parseDestinations(body.destinations),
    availabilityStatus: extractAvailabilityStatus(body, 'AVAILABLE'),
  };
};

const mapAdminPackage = (r, destinationsByPackage = {}) => {
  const dests = destinationsByPackage[r.package_id] || [];
  const total = dests.length;
  const shown = Math.min(2, total);
  const hidden = Math.max(0, total - shown);

  return {
    id: r.package_id,
    title: r.title,
    type: toPackageTypeLabel(r.type),
    days: toPackageDaysNumber(r.days),
    description: r.description,
    image_url: r.image_url,
    destinations: dests,
    places_count: total,
    hidden_dest_count: hidden,
    availability: buildAvailabilityPayload(r.availability_status),
  };
};

const mapPublicPackage = (p) => {
  const allDests = Array.isArray(p.destinations) ? p.destinations : [];
  const shown = allDests.slice(0, 2).map((d) => ({
    name: d.name,
    image: d.image,
    dayNumber: d.dayNumber,
    latitude: d.latitude !== null && d.latitude !== undefined ? parseFloat(d.latitude) : null,
    longitude: d.longitude !== null && d.longitude !== undefined ? parseFloat(d.longitude) : null,
  }));
  const total = Number(p.total_places) || allDests.length;
  const hidden = Math.max(0, total - shown.length);

  return {
    id: p.package_id,
    title: p.title,
    type: toPackageTypeLabel(p.type),
    days: toPackageDaysNumber(p.days),
    description: p.description,
    image: p.image_url,
    highlights: [],
    destinations: shown,
    hidden_dest_count: hidden,
    avg_rating: Number(p.avg_rating) || 0,
    reviews_count: Number(p.reviews_count) || 0,
    bookings_count: Number(p.bookings_count) || 0,
    availability: buildAvailabilityPayload(p.availability_status),
  };
};

const mapRelatedPackage = (r) => ({
  id: r.id,
  title: r.title,
  type: r.type ? toPackageTypeLabel(r.type) : null,
  days: r.days ? toPackageDaysNumber(r.days) : null,
  image: r.image || r.image_url || null,
  description: r.description || null,
  avg_rating: r.avg_rating != null ? Number(r.avg_rating) : null,
  reviews_count: r.reviews_count != null ? Number(r.reviews_count) : undefined,
  bookings_count: r.bookings_count != null ? Number(r.bookings_count) : undefined,
  destinations: [],
  availability: { status: 'AVAILABLE' },
});

const mapPackagePlace = (r) => ({
  id: r.place_id,
  name: r.place_name,
  description: r.description,
  image_url: r.image_url,
  day_number: r.day_number,
  latitude: r.latitude !== null && r.latitude !== undefined ? parseFloat(r.latitude) : null,
  longitude: r.longitude !== null && r.longitude !== undefined ? parseFloat(r.longitude) : null,
  activities: r.activities || [],
});

module.exports = {
  PACKAGE_TYPE_LABEL_TO_ENUM,
  PACKAGE_TYPE_ENUM_TO_LABEL,
  toPackageTypeEnum,
  toPackageTypeLabel,
  toPackageDaysLabel,
  toPackageDaysNumber,
  normalizeAvailabilityStatus,
  buildAvailabilityPayload,
  extractAvailabilityStatus,
  parseDestinations,
  extractPackagePayload,
  mapAdminPackage,
  mapPublicPackage,
  mapRelatedPackage,
  mapPackagePlace,
};
