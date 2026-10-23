const db = require('../db/connection');
const PDFDocument = require('pdfkit');
const { parsePagination } = require('../utils/paginate');

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

const COMPANY_NAME = 'Ceylon Best Tours';

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

const PDF_ALLOWED_STATUSES = ['ACCEPTED', 'CONFIRMED', 'TOUR_STARTED', 'COMPLETED', 'CLOSED'];

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

const resolveCategoryId = async (categoryId) => {
  if (!isNaN(categoryId) && categoryId !== '') {
    return parseInt(categoryId);
  }
  const { rows: catRows } = await db.query(
    'SELECT category_id FROM vehicle_category WHERE category_name = $1 LIMIT 1',
    [categoryId]
  );
  if (catRows.length > 0) return catRows[0].category_id;

  const { rows: ins } = await db.query(
    'INSERT INTO vehicle_category (category_name) VALUES ($1) RETURNING category_id', [categoryId]
  );
  return ins[0].category_id;
};

const createP2PBooking = async (req, res) => {
  const {
    tourType,
    packageId,
    startLocation,
    endLocation,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    selectedCities,
    activities,
    startDate,
    endDate,
    pickupTime,
    totalDays,
    daysRequired,
    categoryId,
    noOfAdults,
    noOfChildren,
    agesOfChildren,
    babySeatNeeded,
    luggage10kg,
    luggage25kg,
    luggage35kg,
    luggageCustomCount,
    luggageCustomItems,
    customerName,
    contactPlatform,
    contactNumber,
    contactPlatform2,
    contactNumber2,
    notes,
    tourThoughts,
  } = req.body;

  const isPackageBooking = normalizeTourType(tourType) === 'PACKAGE';
  if (normalizeTourType(tourType) === 'CUSTOM') {
    return res.status(400).json({ message: 'Customized tour booking is no longer supported.' });
  }

  if (!startDate || !endDate || !categoryId || !customerName || !(contactNumber || '').trim())
    return res.status(400).json({ message: 'Missing required fields.' });

  if (!isPackageBooking && (!startLocation || !endLocation))
    return res.status(400).json({ message: 'Start and end location are required for P2P bookings.' });

  if (isPackageBooking && !packageId)
    return res.status(400).json({ message: 'packageId is required for package bookings.' });

  if (!req.user?.id)
    return res.status(401).json({ message: 'Not authenticated.' });

  const customItems = Array.isArray(luggageCustomItems) ? luggageCustomItems : [];
  const customLuggageSummary = customItems.length
    ? `Custom Luggage: ${customItems.map((item, i) => `Item ${i + 1}: ${item.weight || '?'}kg`).join(', ')}`
    : null;
  const fullTourThoughts = [tourThoughts || null, customLuggageSummary].filter(Boolean).join('\n') || null;

  let client;
  try {
    const resolvedCategoryId = await resolveCategoryId(categoryId);

    client = await db.connect();
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO booking
        (user_id, customer_name, contact_platform, contact_number, contact_platform2, contact_number2,
         tour_type, category_id,
         start_date, end_date, pickup_time,
         start_location, end_location,
         pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
         total_days, days_required,
         luggage_10kg, luggage_25kg, luggage_35kg,
         no_of_adults, no_of_children, ages_of_children,
         notes, tour_thoughts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
       RETURNING booking_id`,
      [
        req.user.id,
        customerName,
        contactPlatform  || 'mobile',
        contactNumber,
        contactPlatform2 || null,
        contactNumber2   || null,
        isPackageBooking ? 'PACKAGE' : 'P2P',
        resolvedCategoryId,
        startDate,
        endDate,
        pickupTime        || null,
        isPackageBooking ? null : startLocation,
        isPackageBooking ? null : endLocation,
        isPackageBooking ? null : (pickupLat || null),
        isPackageBooking ? null : (pickupLng || null),
        isPackageBooking ? null : (dropoffLat || null),
        isPackageBooking ? null : (dropoffLng || null),
        totalDays         || 1,
        daysRequired      || 1,
        luggage10kg       || 0,
        luggage25kg       || 0,
        luggage35kg       || 0,
        noOfAdults        || 1,
        noOfChildren      || 0,
        agesOfChildren    || null,
        notes             || null,
        fullTourThoughts,
      ]
    );

    const bookingId = rows[0].booking_id;

    if (isPackageBooking) {
      await client.query(
        'INSERT INTO booking_package (booking_id, package_id) VALUES ($1, $2)',
        [bookingId, packageId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Booking submitted successfully.',
      bookingId,
      booking: { id: bookingId },
      bookingRef: getBookingReference(isPackageBooking ? 'PACKAGE' : 'P2P', bookingId),
    });

  } catch (err) {
    console.error('createP2PBooking error:', err);
    if (client) await client.query('ROLLBACK');
    res.status(500).json({ message: 'Failed to create booking.' });
  } finally {
    if (client) client.release();
  }
};

const getMyBookings = async (req, res) => {
  const { page, limit, offset, buildPagination } = parsePagination(req.query, 10, 50);
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

  try {
    let query = `
      SELECT b.*, u.email, u.emergency_name, u.emergency_phone, u.emergency_relationship,
             vc.category_name,
             p.package_id, p.title AS package_name,
             COUNT(*) OVER()::integer AS total_count
      FROM booking b
      JOIN "user" u ON u.user_id = b.user_id
      LEFT JOIN vehicle_category vc ON vc.category_id = b.category_id
      LEFT JOIN booking_package bp ON bp.booking_id = b.booking_id
      LEFT JOIN package p ON p.package_id = bp.package_id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, b.booking_id DESC
    `;
    const params = [req.user.id];

    if (isPaginated) {
      query += ` LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    }

    const { rows } = await db.query(query, params);
    const totalCount = rows.length > 0 ? rows[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    const bookings = rows.map(mapBooking);
    bookings.pagination = pagination;

    res.json({ bookings, pagination });
  } catch (err) {
    console.error('getMyBookings error:', err);
    res.status(500).json({ message: 'Failed to load bookings.' });
  }
};

const getAllBookings = async (req, res) => {
  const { page, limit, offset, buildPagination } = parsePagination(req.query, 10, 100);
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

  try {
    let query = `
      SELECT b.*, u.email, u.emergency_name, u.emergency_phone, u.emergency_relationship,
             vc.category_name,
             p.package_id, p.title AS package_name,
             v.vehicle_number, v.name AS vehicle_name,
             COUNT(*) OVER()::integer AS total_count
      FROM booking b
      JOIN "user" u ON u.user_id = b.user_id
      LEFT JOIN vehicle_category vc ON vc.category_id = b.category_id
      LEFT JOIN booking_package bp ON bp.booking_id = b.booking_id
      LEFT JOIN package p ON p.package_id = bp.package_id
      LEFT JOIN vehicle v ON v.vehicle_id = b.vehicle_id
      ORDER BY b.booking_date DESC, b.booking_id DESC
    `;
    const params = [];

    if (isPaginated) {
      query += ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const { rows } = await db.query(query, params);
    const totalCount = rows.length > 0 ? rows[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    const bookings = rows.map(mapBooking);
    bookings.pagination = pagination;

    res.json({ bookings, pagination });
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({ message: 'Failed to load bookings.' });
  }
};

const setQuote = async (req, res) => {
  const { id } = req.params;
  const { quotedPrice, vehicleId, adminNote } = req.body;

  if (!quotedPrice)
    return res.status(400).json({ message: 'quotedPrice is required.' });

  try {
    const { rowCount } = await db.query(
      `UPDATE booking
       SET quoted_price = $1, vehicle_id = $2, admin_note = $3,
           booking_status = 'QUOTED', quoted_at = NOW()
       WHERE booking_id = $4 AND booking_status = 'PENDING' AND quoted_at IS NULL`,
      [quotedPrice, vehicleId || null, adminNote || null, id]
    );

    if (rowCount === 0) {
      const { rows } = await db.query(
        'SELECT booking_id, booking_status, quoted_at, quoted_price FROM booking WHERE booking_id = $1',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found.' });
      }
      return res.status(409).json({
        message: 'A quote has already been provided for this booking or it is no longer pending.',
        currentStatus: rows[0].booking_status,
        quotedPrice: rows[0].quoted_price,
      });
    }

    res.json({ message: 'Quote sent to customer.' });
  } catch (err) {
    console.error('setQuote error:', err);
    res.status(500).json({ message: 'Failed to set quote.' });
  }
};

const ALLOWED_TRANSITIONS = {
  CUSTOMER: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ADMIN:    ['CONFIRMED', 'TOUR_STARTED', 'COMPLETED', 'CLOSED', 'CANCELLED'],
};

const STATUS_TIMESTAMP = {
  CONFIRMED:    'confirmed_at',
  TOUR_STARTED: 'tour_started_at',
  COMPLETED:    'completed_at',
  CLOSED:       'closed_at',
};

const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user?.role);
  const allowed = isAdmin ? ALLOWED_TRANSITIONS.ADMIN : ALLOWED_TRANSITIONS.CUSTOMER;

  if (!allowed.includes(status))
    return res.status(400).json({ message: `Status '${status}' is not allowed.` });

  const tsCol    = STATUS_TIMESTAMP[status];
  const tsClause = tsCol ? `, ${tsCol} = NOW()` : '';

  let query = `UPDATE booking SET booking_status = $1 ${tsClause}`;
  let params = [status];

  if (adminNote !== undefined) {
    query += `, admin_note = $2`;
    params.push(adminNote || null);
  }

  const paramOffset = params.length;
  query += ` WHERE booking_id = $${paramOffset + 1}`;
  params.push(id);

  try {
    const { rowCount } = await db.query(query, params);

    if (rowCount === 0)
      return res.status(404).json({ message: 'Booking not found.' });

    res.json({ message: `Booking status updated to ${status}.` });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ message: 'Failed to update status.' });
  }
};

const updateBooking = async (req, res) => {
  const { id } = req.params;
  const {
    tourType,
    startLocation,
    endLocation,
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    selectedCities,
    activities,
    startDate,
    endDate,
    pickupTime,
    totalDays,
    daysRequired,
    categoryId,
    noOfAdults,
    noOfChildren,
    agesOfChildren,
    luggage10kg,
    luggage25kg,
    luggage35kg,
    luggageCustomCount,
    luggageCustomItems,
    customerName,
    contactPlatform,
    contactNumber,
    contactPlatform2,
    contactNumber2,
    customerPhone,
    notes,
    tourThoughts,
  } = req.body;

  if (normalizeTourType(tourType) === 'CUSTOM') {
    return res.status(400).json({ message: 'Customized tour booking is no longer supported.' });
  }

  if (!startDate || !endDate || !categoryId || !customerName || !(contactNumber || customerPhone || '').trim())
    return res.status(400).json({ message: 'Missing required fields.' });

  const customItems = Array.isArray(luggageCustomItems) ? luggageCustomItems : [];
  const customLuggageSummary = customItems.length
    ? `Custom Luggage: ${customItems.map((item, i) => `Item ${i + 1}: ${item.weight || '?'}kg`).join(', ')}`
    : null;

  const fullTourThoughts = [tourThoughts || null, customLuggageSummary].filter(Boolean).join('\n') || null;

  let client;
  try {
    const resolvedCategoryId = await resolveCategoryId(categoryId);

    client = await db.connect();
    await client.query('BEGIN');

    const { rows: existing } = await client.query(
      'SELECT booking_status, user_id FROM booking WHERE booking_id = $1', [id]
    );

    if (existing.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (existing[0].user_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Unauthorized to edit this booking.' });
    }
    if (existing[0].booking_status !== 'PENDING') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Only pending bookings can be edited.' });
    }

    await client.query(
      `UPDATE booking
       SET customer_name = $1, contact_platform = $2, contact_number = $3, contact_platform2 = $4, contact_number2 = $5,
           category_id = $6,
           start_date = $7, end_date = $8, pickup_time = $9,
           start_location = $10, end_location = $11,
           pickup_lat = COALESCE($12, pickup_lat),
           pickup_lng = COALESCE($13, pickup_lng),
           dropoff_lat = COALESCE($14, dropoff_lat),
           dropoff_lng = COALESCE($15, dropoff_lng),
           total_days = $16, days_required = $17,
           luggage_10kg = $18, luggage_25kg = $19, luggage_35kg = $20,
           no_of_adults = $21, no_of_children = $22, ages_of_children = $23,
           notes = $24, tour_thoughts = $25
       WHERE booking_id = $26`,
      [
        customerName, contactPlatform  || 'mobile', contactNumber || customerPhone, contactPlatform2 || null, contactNumber2 || null,
        resolvedCategoryId,
        startDate, endDate, pickupTime || null,
        startLocation || null, endLocation || null,
        pickupLat ?? null, pickupLng ?? null, dropoffLat ?? null, dropoffLng ?? null,
        totalDays    || 1, daysRequired || 1,
        luggage10kg  || 0, luggage25kg  || 0, luggage35kg || 0,
        noOfAdults   || 1, noOfChildren || 0, agesOfChildren || null,
        notes || null, fullTourThoughts,
        id,
      ]
    );

    await client.query('COMMIT');
    res.json({ message: 'Booking updated successfully.' });

  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('updateBooking error:', err);
    res.status(500).json({ message: 'Failed to update booking.' });
  } finally {
    if (client) client.release();
  }
};

const downloadBookingConfirmationPdf = async (req, res) => {
  const { id } = req.params;
  const bookingId = Number(id);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ message: 'Invalid booking id.' });
  }

  try {
    const { rows } = await db.query(
      `SELECT b.*,
              vc.category_name,
              p.title AS package_name
       FROM booking b
       LEFT JOIN vehicle_category vc ON vc.category_id = b.category_id
       LEFT JOIN booking_package bp ON bp.booking_id = b.booking_id
       LEFT JOIN package p ON p.package_id = bp.package_id
       WHERE b.booking_id = $1
       LIMIT 1`,
      [bookingId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = rows[0];

    if (Number(booking.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized to access this booking document.' });
    }

    if (!PDF_ALLOWED_STATUSES.includes(booking.booking_status)) {
      return res.status(400).json({ message: 'Booking confirmation PDF is available after quote acceptance.' });
    }

    const bookingRef = getBookingReference(booking.tour_type, booking.booking_id);
    const startDate = formatDate(booking.start_date);
    const endDate = formatDate(booking.end_date);
    const totalLuggage =
      Number(booking.luggage_10kg || 0) +
      Number(booking.luggage_25kg || 0) +
      Number(booking.luggage_35kg || 0);
    const quotedPrice = formatMoney(booking.quoted_price);
    const paymentSchedule = getPaymentScheduleLines(booking.tour_type, booking.quoted_price);
    const fileName = `booking-confirmation-${bookingRef}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.on('error', (pdfErr) => {
      console.error('PDF stream error:', pdfErr);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to generate booking confirmation PDF.' });
      }
    });
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 90).fill('#00b0a5');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(COMPANY_NAME, 50, 30);
    doc.fontSize(11).font('Helvetica').text('Booking Confirmation', 50, 58);

    doc.moveDown(4);
    doc.fillColor('#0f172a').fontSize(11);

    const writeRow = (label, value) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
      doc.font('Helvetica').text(value || 'N/A');
      doc.moveDown(0.25);
    };

    writeRow('Booking Reference', bookingRef);
    writeRow('Customer Name', booking.customer_name);
    writeRow('Customer Phone', booking.contact_number);
    writeRow('Tour Type', normalizeTourType(booking.tour_type));
    writeRow('Selected Package', booking.package_name || 'Not applicable');
    if (normalizeTourType(booking.tour_type) === 'P2P') {
      writeRow('Start Location', booking.start_location);
      writeRow('End Location', booking.end_location);
    }
    writeRow('Start Date', startDate || 'N/A');
    writeRow('End Date', endDate || 'N/A');
    writeRow('Vehicle Category', booking.category_name || 'N/A');
    writeRow('Adults', String(booking.no_of_adults || 0));
    writeRow('Children', String(booking.no_of_children || 0));
    writeRow('Luggage Items', String(totalLuggage));
    writeRow('Quoted Price', quotedPrice);
    writeRow('Confirmed Price', quotedPrice);

    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(12).text('Payment Schedule');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11);
    paymentSchedule.forEach((line) => {
      doc.text(`- ${line}`);
    });

    doc.moveDown(1.1);
    doc.fillColor('#64748b').fontSize(9);
    doc.text(`Issued by ${COMPANY_NAME}`);
    doc.text(`Generated on ${new Date().toISOString().slice(0, 10)}`);

    doc.end();
  } catch (err) {
    console.error('downloadBookingConfirmationPdf error:', err);
    res.status(500).json({ message: 'Failed to generate PDF.' });
  }
};

const updateAdditionalCharges = async (req, res) => {
  const { id } = req.params;
  const { additionalCharges } = req.body;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user?.role);
  if (!isAdmin) return res.status(403).json({ message: 'Unauthorized.' });

  if (additionalCharges === undefined || additionalCharges === null || isNaN(Number(additionalCharges))) {
    return res.status(400).json({ message: 'additionalCharges is required and must be a valid number.' });
  }

  try {
    const { rows } = await db.query(`
      SELECT b.quoted_price,
             COALESCE((SELECT SUM(amount) FROM payment WHERE booking_id = b.booking_id AND status = 'APPROVED'), 0) AS total_paid
      FROM booking b
      WHERE b.booking_id = $1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const { quoted_price, total_paid } = rows[0];
    const basePrice = quoted_price ? parseFloat(quoted_price) : 0;
    const totalPaid = parseFloat(total_paid);

    if (totalPaid < basePrice) {
      return res.status(400).json({ message: 'Cannot add additional charges until the quoted base price is fully paid and approved.' });
    }

    const { rowCount } = await db.query(
      `UPDATE booking SET additional_charges = $1 WHERE booking_id = $2`,
      [Number(additionalCharges), id]
    );

    if (rowCount === 0)
      return res.status(404).json({ message: 'Booking not found.' });

    res.json({ message: 'Additional charges updated successfully.' });
  } catch (err) {
    console.error('updateAdditionalCharges error:', err);
    res.status(500).json({ message: 'Failed to update additional charges.' });
  }
};

module.exports = {
  createP2PBooking,
  getMyBookings,
  getAllBookings,
  setQuote,
  updateStatus,
  updateBooking,
  downloadBookingConfirmationPdf,
  updateAdditionalCharges,
};