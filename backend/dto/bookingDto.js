/**
 * Booking Data Transfer Object (DTO)
 * Normalizes and sanitizes booking payloads across creation, updates, and view mappings.
 */

const formatDate = (val) => {
  if (!val) return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const dt = new Date(val);
  if (Number.isNaN(dt.getTime())) return null;

  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const normalizeTourType = (value) => String(value || 'P2P').toUpperCase();

const getBookingReference = (tourType, bookingId) => {
  const type = normalizeTourType(tourType);
  const typeCode = type === 'PACKAGE' ? 'PKG' : 'P2P';
  return `CBT-${typeCode}-${bookingId}`;
};

const formatMoney = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const n = Number(value);
  if (Number.isNaN(n)) return 'N/A';
  return `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const getPaymentScheduleLines = (tourType, quotedPrice) => {
  const amount = Number(quotedPrice || 0);
  const isP2P = normalizeTourType(tourType) === 'P2P';

  if (isP2P) {
    return [
      `FULL: ${formatMoney(amount)} payable before trip start.`,
    ];
  }

  const deposit = amount * 0.3;
  const final = amount - deposit;

  return [
    `DEPOSIT (30%): ${formatMoney(deposit)} payable at confirmation.`,
    `FINAL (70%): ${formatMoney(final)} payable before trip start.`,
  ];
};

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

const mapBooking = (row) => ({
  id:             row.booking_id,
  userId:         row.user_id,
  customerName:   row.customer_name,
  contactPlatform:  row.contact_platform  || null,
  contactNumber:    row.contact_number    || null,
  customerPhone:    row.contact_number    || null,
  contactPlatform2: row.contact_platform2 || null,
  contactNumber2:   row.contact_number2   || null,
  emergencyName:    row.emergency_name    || null,
  emergencyPhone:   row.emergency_phone   || null,
  emergencyRelationship: row.emergency_relationship || null,
  customerEmail:  row.email || null,
  tourType:       row.tour_type,
  categoryId:     row.category_id,
  categoryName:   row.category_name || null,
  packageId:      row.package_id    || null,
  packageName:    row.package_name  || null,
  vehicleId:      row.vehicle_id    || null,
  assignedVehicle: row.vehicle_name ? {
    name:        row.vehicle_name,
    plateNumber: row.vehicle_number || '—',
    type:        row.category_name  || '',
  } : null,
  startDate:      formatDate(row.start_date),
  endDate:        formatDate(row.end_date),
  pickupTime:     row.pickup_time   || null,
  bookingDate:    formatDate(row.booking_date),
  startLocation:  row.start_location || null,
  endLocation:    row.end_location   || null,
  pickupLat:      row.pickup_lat !== null && row.pickup_lat !== undefined ? parseFloat(row.pickup_lat) : null,
  pickupLng:      row.pickup_lng !== null && row.pickup_lng !== undefined ? parseFloat(row.pickup_lng) : null,
  dropoffLat:     row.dropoff_lat !== null && row.dropoff_lat !== undefined ? parseFloat(row.dropoff_lat) : null,
  dropoffLng:     row.dropoff_lng !== null && row.dropoff_lng !== undefined ? parseFloat(row.dropoff_lng) : null,
  totalDays:      row.total_days,
  daysRequired:   row.days_required,
  luggage10kg:        row.luggage_10kg        || 0,
  luggage25kg:        row.luggage_25kg        || 0,
  luggage35kg:        row.luggage_35kg        || 0,
  luggageCustomCount: 0,
  luggageCustomDesc:  null,
  noOfAdults:         row.no_of_adults,
  noOfChildren:       row.no_of_children,
  agesOfChildren:     row.ages_of_children || null,
  quotedPrice:        row.quoted_price ? parseFloat(row.quoted_price) : null,
  additionalCharges:  row.additional_charges ? parseFloat(row.additional_charges) : 0,
  notes:              row.notes        || null,
  tourThoughts:       row.tour_thoughts || null,
  adminNote:          row.admin_note    || null,
  status:             row.booking_status,
  quotedAt:           row.quoted_at,
  confirmedAt:        row.confirmed_at,
  tourStartedAt:      row.tour_started_at,
  completedAt:        row.completed_at,
  closedAt:           row.closed_at,
  bookingRef:         getBookingReference(row.tour_type, row.booking_id),
  itinerary:          [],
});

module.exports = {
  formatDate,
  normalizeTourType,
  getBookingReference,
  formatMoney,
  getPaymentScheduleLines,
  parseCustomLuggage,
  extractBookingPayload,
  validateBookingPayload,
  mapBooking,
};
