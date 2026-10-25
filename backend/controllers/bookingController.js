const db = require('../db/connection');
const PDFDocument = require('pdfkit');
const { parsePagination } = require('../utils/paginate');
const {
  formatDate,
  normalizeTourType,
  getBookingReference,
  formatMoney,
  getPaymentScheduleLines,
  extractBookingPayload,
  validateBookingPayload,
  mapBooking,
} = require('../dto/bookingDto');

const COMPANY_NAME = 'Ceylon Best Tours';
const PDF_ALLOWED_STATUSES = ['ACCEPTED', 'CONFIRMED', 'TOUR_STARTED', 'COMPLETED', 'CLOSED'];

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
  const payload = extractBookingPayload(req.body);
  const validation = validateBookingPayload(payload, false);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  if (!req.user?.id) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const isPackageBooking = payload.tourType === 'PACKAGE';

  try {
    // Encapsulates atomic booking creation, category resolution, coordinate mapping (pickup_lat, dropoff_lng),
    // and binds payload.packageId into booking_package via stored procedure sp_create_booking.
    const { rows } = await db.query(
      `SELECT * FROM sp_create_booking(
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31
      )`,
      [
        req.user.id,
        payload.customerName,
        payload.contactPlatform,
        payload.contactNumber,
        payload.contactPlatform2,
        payload.contactNumber2,
        isPackageBooking ? 'PACKAGE' : 'P2P',
        String(payload.categoryId ?? ''),
        payload.startDate,
        payload.endDate,
        payload.pickupTime,
        payload.startLocation,
        payload.endLocation,
        payload.pickupLat,
        payload.pickupLng,
        payload.dropoffLat,
        payload.dropoffLng,
        payload.totalDays,
        payload.daysRequired,
        payload.luggage10kg,
        payload.luggage25kg,
        payload.luggage35kg,
        payload.noOfAdults,
        payload.noOfChildren,
        payload.agesOfChildren,
        payload.notes,
        payload.fullTourThoughts,
        isPackageBooking ? (payload.packageId || null) : null,
        payload.emergencyName || null,
        payload.emergencyPhone || null,
        payload.emergencyRelationship || null,
      ]
    );

    const bookingId = rows[0].booking_id;
    const bookingRef = rows[0].booking_ref || getBookingReference(isPackageBooking ? 'PACKAGE' : 'P2P', bookingId);

    res.status(201).json({
      message: 'Booking submitted successfully.',
      bookingId,
      booking: { id: bookingId },
      bookingRef,
    });

  } catch (err) {
    console.error('createP2PBooking error:', err);
    res.status(500).json({ message: 'Failed to create booking.' });
  }
};

const getMyBookings = async (req, res) => {
  const { page, limit, offset, buildPagination } = parsePagination(req.query, 10, 50);
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

  try {
    let query = `
      SELECT *, COUNT(*) OVER()::integer AS total_count
      FROM v_booking_details
      WHERE user_id = $1
      ORDER BY booking_date DESC, booking_id DESC
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
      SELECT *, COUNT(*) OVER()::integer AS total_count
      FROM v_booking_details
      ORDER BY booking_date DESC, booking_id DESC
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
    // Invokes sp_set_booking_quote which validates vehicle availability and performs atomic update:
    // WHERE booking_id = $4 AND booking_status = 'PENDING' AND quoted_at IS NULL
    const { rows } = await db.query(
      `SELECT * FROM sp_set_booking_quote($1, $2, $3, $4)`,
      [id, quotedPrice, vehicleId || null, adminNote || null]
    );

    const result = rows[0] || {};
    if (!result.success) {
      if (result.message === 'Booking not found.') {
        return res.status(404).json({ message: 'Booking not found.' });
      }
      return res.status(409).json({
        message: result.message || 'A quote has already been provided for this booking or it is no longer pending.',
        currentStatus: result.current_status,
        quotedPrice: result.current_price,
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
  const payload = extractBookingPayload(req.body);
  const validation = validateBookingPayload(payload, true);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  let client;
  try {
    const resolvedCategoryId = await resolveCategoryId(payload.categoryId);

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
        payload.customerName,
        payload.contactPlatform,
        payload.contactNumber,
        payload.contactPlatform2,
        payload.contactNumber2,
        resolvedCategoryId,
        payload.startDate,
        payload.endDate,
        payload.pickupTime,
        payload.startLocation,
        payload.endLocation,
        payload.pickupLat,
        payload.pickupLng,
        payload.dropoffLat,
        payload.dropoffLng,
        payload.totalDays,
        payload.daysRequired,
        payload.luggage10kg,
        payload.luggage25kg,
        payload.luggage35kg,
        payload.noOfAdults,
        payload.noOfChildren,
        payload.agesOfChildren,
        payload.notes,
        payload.fullTourThoughts,
        id,
      ]
    );

    if (payload.emergencyName || payload.emergencyPhone || payload.emergencyRelationship) {
      await client.query(
        `UPDATE "user"
         SET emergency_name = COALESCE($1, emergency_name),
             emergency_phone = COALESCE($2, emergency_phone),
             emergency_relationship = COALESCE($3, emergency_relationship)
         WHERE user_id = $4`,
        [payload.emergencyName, payload.emergencyPhone, payload.emergencyRelationship, req.user.id]
      );
    }

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
      `SELECT * FROM v_booking_details WHERE booking_id = $1 LIMIT 1`,
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
      SELECT quoted_price, total_paid
      FROM v_booking_financial_summary
      WHERE booking_id = $1
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