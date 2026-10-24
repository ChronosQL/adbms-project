/**
 * Booking Data Transfer Object (DTO)
 * Normalizes and sanitizes booking payloads across creation and updates.
 */

const normalizeTourType = (value) => String(value || 'P2P').toUpperCase();

const parseCustomLuggage = (items) => {
  const customItems = Array.isArray(items) ? items : [];
  return customItems.length
    ? `Custom Luggage: ${customItems.map((item, i) => `Item ${i + 1}: ${item.weight || '?'}kg`).join(', ')}`
    : null;
};

const extractBookingPayload = (body = {}) => {
  const customLuggageSummary = parseCustomLuggage(body.luggageCustomItems);
  const fullTourThoughts = [body.tourThoughts || null, customLuggageSummary].filter(Boolean).join('\n') || null;

  const toCoord = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n;
  };

  return {
    tourType: normalizeTourType(body.tourType),
    packageId: body.packageId ? parseInt(body.packageId, 10) : null,
    customerName: body.customerName ? String(body.customerName).trim() : null,
    contactPlatform: body.contactPlatform || 'mobile',
    contactNumber: (body.contactNumber || body.customerPhone || '').trim(),
    contactPlatform2: body.contactPlatform2 || null,
    contactNumber2: body.contactNumber2 || null,
    startDate: body.startDate || null,
    endDate: body.endDate || null,
    pickupTime: body.pickupTime || null,
    startLocation: body.startLocation || null,
    endLocation: body.endLocation || null,
    pickupLat: toCoord(body.pickupLat),
    pickupLng: toCoord(body.pickupLng),
    dropoffLat: toCoord(body.dropoffLat),
    dropoffLng: toCoord(body.dropoffLng),
    totalDays: Number(body.totalDays) || 1,
    daysRequired: Number(body.daysRequired) || 1,
    categoryId: body.categoryId,
    noOfAdults: Number(body.noOfAdults) || 1,
    noOfChildren: Number(body.noOfChildren) || 0,
    agesOfChildren: body.agesOfChildren || null,
    luggage10kg: Number(body.luggage10kg) || 0,
    luggage25kg: Number(body.luggage25kg) || 0,
    luggage35kg: Number(body.luggage35kg) || 0,
    notes: body.notes || null,
    tourThoughts: body.tourThoughts || null,
    fullTourThoughts,
  };
};

const validateBookingPayload = (payload, isUpdate = false) => {
  const isPackage = payload.tourType === 'PACKAGE';
  if (payload.tourType === 'CUSTOM') {
    return { valid: false, message: 'Customized tour booking is no longer supported.' };
  }

  if (!isUpdate) {
    if (!payload.startDate || !payload.endDate || !payload.categoryId || !payload.customerName || !payload.contactNumber) {
      return { valid: false, message: 'Missing required fields.' };
    }
    if (!isPackage && (!payload.startLocation || !payload.endLocation)) {
      return { valid: false, message: 'Start and end location are required for P2P bookings.' };
    }
    if (isPackage && !payload.packageId) {
      return { valid: false, message: 'packageId is required for package bookings.' };
    }
  } else {
    if (!payload.customerName || !payload.contactNumber || !payload.categoryId || !payload.startDate || !payload.endDate) {
      return { valid: false, message: 'Customer name, phone, vehicle category, start date, and end date are required.' };
    }
  }

  return { valid: true };
};

module.exports = {
  normalizeTourType,
  parseCustomLuggage,
  extractBookingPayload,
  validateBookingPayload,
};
