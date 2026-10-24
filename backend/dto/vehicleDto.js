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

const extractCategoryPayload = (body = {}) => ({
  name: body.name ? String(body.name).trim() : null,
  description: body.description ? String(body.description).trim() : '',
  passenger_capacity: body.passenger_capacity ? String(body.passenger_capacity).trim() : '',
  luggage_capacity: body.luggage_capacity ? String(body.luggage_capacity).trim() : '',
  best_for: body.best_for ? String(body.best_for).trim() : '',
  comfort_level: body.comfort_level ? String(body.comfort_level).trim() : '',
  ac_available: body.ac_available === 'true' || body.ac_available === true,
  ideal_trip_types: body.ideal_trip_types ? String(body.ideal_trip_types).trim() : '',
});

const extractVehiclePayload = (body = {}) => ({
  categoryId: safeNumber(body.category_id || body.categoryId),
  modelName: body.model_name ? String(body.model_name).trim() : null,
  plateNumber: body.plate_number ? String(body.plate_number).trim().toUpperCase() : null,
  vehicleType: body.vehicle_type ? String(body.vehicle_type).trim() : null,
  adultSeats: safeNumber(body.adult_seats || body.seats || 4),
  childSeats: safeNumber(body.child_seats || 0),
  luggageCapacity: body.luggage_capacity ? String(body.luggage_capacity).trim() : null,
  fuelType: body.fuel_type ? String(body.fuel_type).trim() : null,
  transmission: body.transmission ? String(body.transmission).trim() : null,
  pricePerDay: safeNumber(body.price_per_day),
  driverName: body.driver_name ? String(body.driver_name).trim() : null,
  driverContact: body.driver_contact ? String(body.driver_contact).trim() : null,
  vehicleStatus: normalizeStatus(body.vehicle_status || body.status),
  insuranceStartDate: toDateOnly(body.insurance_start_date),
  insuranceEndDate: toDateOnly(body.insurance_end_date),
});

module.exports = {
  STATUS_LABELS,
  normalizeStatus,
  toStatusLabel,
  safeNumber,
  toDateOnly,
  addOneYearToDate,
  validateInsurancePeriod,
  extractCategoryPayload,
  extractVehiclePayload,
};
