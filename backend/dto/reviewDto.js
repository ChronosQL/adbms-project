/**
 * Review Data Transfer Object (DTO)
 * Normalizes customer review row mappings, country flag resolution,
 * reviewable tours, and submission payload validation.
 */

const COUNTRY_FLAGS = {
  'Sri Lanka': '🇱🇰',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Nepal': '🇳🇵',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'India': '🇮🇳',
  'Japan': '🇯🇵',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Brazil': '🇧🇷',
  'Netherlands': '🇳🇱',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Mexico': '🇲🇽',
  'China': '🇨🇳',
  'South Africa': '🇿🇦',
  'New Zealand': '🇳🇿',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Philippines': '🇵🇭',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'Hong Kong': '🇭🇰',
  'South Korea': '🇰🇷',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Turkey': '🇹🇷',
  'Greece': '🇬🇷',
  'Ireland': '🇮🇪',
  'Switzerland': '🇨🇭',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Belgium': '🇧🇪',
  'Austria': '🇦🇹',
  'Poland': '🇵🇱',
  'Portugal': '🇵🇹',
  'Israel': '🇮🇱',
  'Russia': '🇷🇺',
  'Ukraine': '🇺🇦',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
};

const getCountryFlag = (country) => {
  if (!country) return '🌍';
  const key = String(country).trim();
  return COUNTRY_FLAGS[key] || '🌍';
};

const normalizeImageUrls = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

const extractUploadedImageUrl = (file) => {
  if (!file) return null;
  return file.path || file.url || file.secure_url || file.location || file.filename || null;
};

const mapReviewRow = (row) => ({
  id: `r-${row.review_id}`,
  bookingId: row.booking_id,
  user: {
    name: row.customer_name,
    email: row.customer_email,
    country: row.customer_country || 'Sri Lanka',
    countryFlag: getCountryFlag(row.customer_country),
    avatar: null,
  },
  tourTitle: row.tour_title || 'Tour Booking',
  tourType: row.tour_type || 'Tour',
  stars: row.rating,
  driverName: row.driver_name || '',
  title: row.title || 'Guest Review',
  comment: row.feedback,
  images: Array.isArray(row.images) ? row.images : [],
  datePublished: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
});

const mapReviewableTourRow = (row) => ({
  id: String(row.booking_id),
  packageTitle: row.package_title || `${row.tour_type} Booking`,
  packageType: row.tour_type,
  completedDate: row.completed_at
    ? new Date(row.completed_at).toISOString().split('T')[0]
    : new Date(row.booking_date).toISOString().split('T')[0],
});

const extractReviewPayload = (body = {}, files = []) => {
  const uploadedImageUrls = Array.isArray(files)
    ? files.map(extractUploadedImageUrl).filter(Boolean)
    : [];
  const imageUrls = [...uploadedImageUrls, ...normalizeImageUrls(body.images)];

  return {
    customerEmail: body.customerEmail ? String(body.customerEmail).trim() : null,
    bookingId: Number(body.bookingId),
    stars: Number(body.stars),
    driverName: body.driverName ? String(body.driverName).trim() : '',
    title: body.title ? String(body.title).trim() : null,
    comment: body.comment ? String(body.comment).trim() : null,
    tourTitle: body.tourTitle || null,
    tourType: body.tourType || null,
    images: imageUrls,
  };
};

const validateReviewPayload = (payload) => {
  if (!payload.customerEmail || !payload.bookingId || !payload.stars || !payload.comment) {
    return {
      valid: false,
      message: 'customerEmail, bookingId, stars and comment are required.',
    };
  }
  if (isNaN(payload.stars) || payload.stars < 1 || payload.stars > 5) {
    return { valid: false, message: 'stars must be a number between 1 and 5.' };
  }
  return { valid: true };
};

module.exports = {
  COUNTRY_FLAGS,
  getCountryFlag,
  normalizeImageUrls,
  extractUploadedImageUrl,
  mapReviewRow,
  mapReviewableTourRow,
  extractReviewPayload,
  validateReviewPayload,
};
