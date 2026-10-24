/**
 * Package Data Transfer Object (DTO)
 * Consolidates package enum mapping, duration parsing, destination extraction,
 * and availability status normalization.
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
};
