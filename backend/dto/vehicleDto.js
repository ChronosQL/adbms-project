/**
 * Vehicle Data Transfer Object (DTO)
 * Normalizes vehicle category, vehicle details, insurance validation, and status mappings.
 */

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  MAINTENANCE: 'Maintenance',
};

const normalizeStatus = (status) => {
  const normalized = String(status || 'AVAILABLE').trim().toUpperCase();
  return STATUS_LABELS[normalized] ? normalized : 'AVAILABLE';
};

const toStatusLabel = (status) => STATUS_LABELS[normalizeStatus(status)];

const safeNumber = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const asString = String(value).trim();
  if (!asString) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;
  const parsed = new Date(asString);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
};

const addOneYearToDate = (dateOnly) => {
  const normalizedDate = toDateOnly(dateOnly);
  if (!normalizedDate) return null;
  const [year, month, day] = normalizedDate.split('-').map((part) => Number(part));
  const nextYearDate = new Date(Date.UTC(year + 1, month - 1, day));
  if (
    nextYearDate.getUTCFullYear() !== year + 1 ||
    nextYearDate.getUTCMonth() !== month - 1 ||
    nextYearDate.getUTCDate() !== day
  ) {
    return null;
  }
  return nextYearDate.toISOString().slice(0, 10);
};

const isInsuranceExpired = (startDate, endDate) => {
  const today = new Date().toISOString().slice(0, 10);

  const normalizedStartDate = toDateOnly(startDate);
  if (normalizedStartDate) {
    const oneYearEndDate = addOneYearToDate(normalizedStartDate);
    if (oneYearEndDate) {
      return today > oneYearEndDate;
    }
  }

  const normalizedEndDate = toDateOnly(endDate);
  if (!normalizedEndDate) return false;

  return today > normalizedEndDate;
};

const validateInsurancePeriod = (startDate, endDate) => {
  const normalizedStartDate = toDateOnly(startDate);
  if (!normalizedStartDate) {
    return { valid: false, message: 'Valid insurance_start_date is required.' };
  }
  const requiredEndDate = addOneYearToDate(normalizedStartDate);
  if (!requiredEndDate) {
    return { valid: false, message: 'insurance_start_date is invalid for a one-year insurance period.' };
  }
  const normalizedEndDate = toDateOnly(endDate) || requiredEndDate;
  if (normalizedEndDate !== requiredEndDate) {
    return {
      valid: false,
      message: `insurance_end_date must be exactly 1 year after insurance_start_date (${requiredEndDate}).`,
    };
  }
  return { valid: true, normalizedStartDate, normalizedEndDate };
};

const parseImageUrls = (imageUrl, uploadedUrls = []) => {
  let existing = [];
  if (imageUrl) {
    try {
      const parsed = JSON.parse(imageUrl);
      existing = Array.isArray(parsed) ? parsed : [imageUrl];
    } catch {
      existing = [imageUrl];
    }
  }
  const all = [...existing, ...(Array.isArray(uploadedUrls) ? uploadedUrls : [])].filter(Boolean);
  return {
    primary: all.length > 0 ? all[0] : (imageUrl || ''),
    list: all,
    serialized: all.length > 0 ? JSON.stringify(all) : null,
  };
};

const mapCategory = (row) => {
  const imagesInfo = parseImageUrls(row.image_url);
  return {
    id: row.category_id,
    name: row.category_name,
    description: row.description || '',
    image_url: imagesInfo.primary || null,
    images: imagesInfo.list,
    passenger_capacity: row.passenger_capacity || '',
    luggage_capacity: row.luggage_capacity || '',
    best_for: row.best_for || '',
    comfort_level: row.comfort_level || '',
    ac_available: Boolean(row.ac_available),
    ideal_trip_types: row.ideal_trip_types || '',
    vehicle_count: Number(row.vehicle_count || 0),
  };
};

const mapVehicle = (row) => {
  const imagesInfo = parseImageUrls(row.image_url);
  return {
    id: row.vehicle_id,
    category_id: row.category_id,
    category_name: row.category_name || '',
    vehicle_name: row.vehicle_name || row.name || '',
    brand: row.brand || '',
    model: row.model || '',
    year: row.manufactured_year || null,
    color: row.color || '',
    license_plate: row.vehicle_number || '',
    seats: row.adult_seats || 0,
    fuel_type: row.fuel_type || '',
    transmission: row.transmission || '',
    air_conditioning: Boolean(row.air_conditioning),
    luggage_capacity: row.luggage_capacity || 0,
    price_per_day: row.price_per_day != null ? Number(row.price_per_day) : null,
    vehicle_license: row.vehicle_license || '',
    insurance_provider: row.insurance_provider || '',
    insurance_start_date: toDateOnly(row.insurance_start_date),
    insurance_end_date: toDateOnly(row.insurance_end_date),
    insurance_expired: isInsuranceExpired(row.insurance_start_date, row.insurance_end_date),
    status: toStatusLabel(row.vehicle_status),
    image_url: imagesInfo.primary,
    images: imagesInfo.list,
    mileage: row.mileage || null,
    engine_capacity: row.engine_capacity || '',
    features: row.features || '',
  };
};

const extractCategoryPayload = (body = {}, files = []) => {
  const uploadedUrls = Array.isArray(files)
    ? files.map((file) => file.path || file.url || file.secure_url || file.location || file.filename).filter(Boolean)
    : [];
  const imagesInfo = parseImageUrls(body.image_url, uploadedUrls);

  return {
    name: body.name ? String(body.name).trim() : null,
    description: body.description ? String(body.description).trim() : '',
    imageUrl: imagesInfo.serialized,
    imagesList: imagesInfo.list,
    passenger_capacity: body.passenger_capacity ? String(body.passenger_capacity).trim() : '',
    luggage_capacity: body.luggage_capacity ? String(body.luggage_capacity).trim() : '',
    best_for: body.best_for ? String(body.best_for).trim() : '',
    comfort_level: body.comfort_level ? String(body.comfort_level).trim() : '',
    ac_available: body.ac_available === 'true' || body.ac_available === true,
    ideal_trip_types: body.ideal_trip_types ? String(body.ideal_trip_types).trim() : '',
  };
};

const extractVehiclePayload = (body = {}, files = []) => {
  const uploadedUrls = Array.isArray(files)
    ? files.map((file) => file.path || file.url || file.secure_url || file.location || file.filename).filter(Boolean)
    : [];
  const imagesInfo = parseImageUrls(body.image_url, uploadedUrls);

  const vehicleName = (body.vehicle_name || body.name || '').trim();
  const licensePlate = (body.license_plate || body.vehicle_number || '').trim().toUpperCase();
  const manufacturedYear = safeNumber(body.manufactured_year || body.year);
  const adultSeats = safeNumber(body.adult_seats || body.seats || 0);

  return {
    categoryId: safeNumber(body.category_id || body.categoryId),
    vehicleName,
    licensePlate,
    color: body.color ? String(body.color).trim() : '',
    manufacturedYear,
    adultSeats,
    luggageCapacity: safeNumber(body.luggage_capacity) || 0,
    pricePerDay: safeNumber(body.price_per_day),
    vehicleLicense: body.vehicle_license ? String(body.vehicle_license).trim() : '',
    insuranceProvider: body.insurance_provider ? String(body.insurance_provider).trim() : '',
    insuranceStartDate: toDateOnly(body.insurance_start_date),
    insuranceEndDate: toDateOnly(body.insurance_end_date),
    imageUrl: imagesInfo.serialized,
    imagesList: imagesInfo.list,
    vehicleStatus: normalizeStatus(body.vehicle_status || body.status),
    brand: body.brand ? String(body.brand).trim() : '',
    model: body.model ? String(body.model).trim() : '',
    fuelType: body.fuel_type ? String(body.fuel_type).trim() : '',
    transmission: body.transmission ? String(body.transmission).trim() : '',
    airConditioning: body.air_conditioning === true || body.air_conditioning === 'true',
    mileage: safeNumber(body.mileage),
    engineCapacity: body.engine_capacity ? String(body.engine_capacity).trim() : '',
    features: body.features ? String(body.features).trim() : '',
  };
};

const validateVehiclePayload = (payload) => {
  if (!payload.categoryId) {
    return { valid: false, message: 'category_id is required.' };
  }
  if (payload.manufacturedYear != null && payload.manufacturedYear < 1950) {
    return { valid: false, message: 'manufactured_year must be 1950 or later.' };
  }
  if (!payload.vehicleName || !payload.licensePlate || !payload.vehicleLicense || !payload.insuranceProvider || !payload.insuranceStartDate) {
    return {
      valid: false,
      message: 'vehicle_name, license_plate, vehicle_license, insurance_provider, and insurance_start_date are required.',
    };
  }
  const insuranceValidation = validateInsurancePeriod(payload.insuranceStartDate, payload.insuranceEndDate);
  if (!insuranceValidation.valid) {
    return { valid: false, message: insuranceValidation.message };
  }
  return { valid: true };
};

module.exports = {
  STATUS_LABELS,
  normalizeStatus,
  toStatusLabel,
  safeNumber,
  toDateOnly,
  addOneYearToDate,
  isInsuranceExpired,
  validateInsurancePeriod,
  parseImageUrls,
  mapCategory,
  mapVehicle,
  extractCategoryPayload,
  extractVehiclePayload,
  validateVehiclePayload,
};
