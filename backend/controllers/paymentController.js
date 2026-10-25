const db = require('../db/connection');
const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;
const { parsePagination } = require('../utils/paginate');
const { toCents, fromCents } = require('../utils/money');

const {
  getBookingReference,
  formatDate,
  formatLKR,
  mapPaymentRow,
  mapTransactionRow,
  extractPaymentPayload,
  validatePaymentPayload,
} = require('../dto/paymentDto');

const COMPANY_NAME = 'Ceylon Best Tours';
const validateInstallmentAmount = ({ installment, amountCents, availableCents }) => {
  const type = String(installment || '').toUpperCase();
  if (!['FULL', 'PARTIAL', 'DEPOSIT', 'FINAL', 'ADDITIONAL'].includes(type)) return 'Select a valid payment type.';
  if (amountCents > availableCents) return `Payment amount exceeds the currently payable balance (${fromCents(availableCents).toFixed(2)}).`;
  if (type === 'FULL' && amountCents !== availableCents) return `Full payment must equal the currently payable balance (${fromCents(availableCents).toFixed(2)}).`;
  // Legacy installment labels remain readable, but new payments are flexible
  // contributions against the whole booking balance.
  return null;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPaymentFile = (file) => new Promise((resolve, reject) => {
  if (!file?.buffer) return resolve(null);
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return reject(new Error('Receipt storage is not configured.'));
  }
  const isPdf = file.mimetype === 'application/pdf';
  const stream = cloudinary.uploader.upload_stream({
    folder: 'payment_slips',
    resource_type: isPdf ? 'raw' : 'image',
    type: 'private',
    use_filename: true,
    unique_filename: true,
    format: isPdf ? 'pdf' : undefined,
  }, (error, result) => {
    if (error) return reject(new Error('Receipt upload failed. Please try again.'));
    resolve(result?.secure_url || null);
  });
  stream.on('error', () => reject(new Error('Receipt upload failed. Please try again.')));
  stream.end(file.buffer);
});

const createPaymentFileDownloadUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null;
    const match = parsed.pathname.match(/^\/[^/]+\/(image|raw)\/(upload|private|authenticated)\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    let publicId = decodeURIComponent(match[3]);
    let format = null;
    if (match[1] === 'image') {
      const extMatch = publicId.match(/\.([a-z0-9]+)$/i);
      if (extMatch) {
        format = extMatch[1];
        publicId = publicId.slice(0, -extMatch[0].length);
      }
    }
    const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: match[1],
      type: match[2],
      attachment: true,
      expires_at: Math.floor(Date.now() / 1000) + 300,
    });
    return new URL(signedUrl);
  } catch { return null; }
};

const getPaymentReceiptDownloadUrl = async (req, res) => {
  const paymentId = Number(req.params.paymentId);
  if (!Number.isInteger(paymentId) || paymentId < 1) return res.status(400).json({ message: 'Invalid payment id.' });
  try {
    const { rows } = await db.query(`
      SELECT p.slip_url, b.user_id
      FROM payment p JOIN booking b ON b.booking_id = p.booking_id
      WHERE p.payment_id = $1
    `, [paymentId]);
    if (!rows.length) return res.status(404).json({ message: 'Payment receipt not found.' });
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user?.role);
    if (!isAdmin && Number(rows[0].user_id) !== Number(req.user?.id)) return res.status(403).json({ message: 'Access denied.' });
    const downloadUrl = createPaymentFileDownloadUrl(rows[0].slip_url);
    if (!downloadUrl) return res.status(404).json({ message: 'Receipt file is unavailable.' });
    const extension = new URL(rows[0].slip_url).pathname.match(/\.([a-z0-9]+)$/i)?.[1] || 'file';
    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ downloadUrl: downloadUrl.toString(), fileName: `payment-receipt-${paymentId}.${extension}` });
  } catch (err) {
    console.error('getPaymentReceiptDownloadUrl error:', err);
    return res.status(502).json({ message: 'Failed to prepare payment receipt download.' });
  }
};

const downloadPaymentInvoice = async (req, res) => {
  const bookingId = Number(req.params.bookingId);
  if (!Number.isInteger(bookingId) || bookingId < 1) return res.status(400).json({ message: 'Invalid booking id.' });
  try {
    const { rows } = await db.query(`
      SELECT b.booking_id, b.user_id, b.tour_type, b.quoted_price, b.additional_charges,
             b.start_date, b.end_date, b.customer_name, b.contact_number,
             COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'APPROVED'), 0) AS paid_amount,
             COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'PENDING'), 0) AS pending_amount
      FROM booking b LEFT JOIN payment p ON p.booking_id = b.booking_id
      WHERE b.booking_id = $1
      GROUP BY b.booking_id
    `, [bookingId]);
    if (!rows.length) return res.status(404).json({ message: 'Booking not found.' });
    const booking = rows[0];
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user?.role);
    if (!isAdmin && Number(booking.user_id) !== Number(req.user?.id)) return res.status(403).json({ message: 'Access denied.' });
    const totalCents = toCents(booking.quoted_price) + toCents(booking.additional_charges);
    const paidCents = toCents(booking.paid_amount);
    const pendingCents = toCents(booking.pending_amount);
    const reference = getBookingReference(booking.tour_type, booking.booking_id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${reference}.pdf"`);
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    doc.on('error', (err) => { console.error('Invoice PDF stream error:', err); if (!res.headersSent) res.status(500).end(); });
    doc.pipe(res);
    doc.rect(0, 0, doc.page.width, 88).fill('#2D3142');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(23).text(COMPANY_NAME, 48, 27);
    doc.font('Helvetica').fontSize(12).text('Payment Invoice', 48, 58);
    doc.moveDown(4).fillColor('#2D3142').fontSize(11);
    doc.font('Helvetica-Bold').text(`Invoice: ${reference}`);
    doc.font('Helvetica').text(`Customer: ${booking.customer_name || 'Customer'}`);
    doc.text(`Contact: ${booking.contact_number || 'N/A'}`);
    doc.text(`Booking dates: ${formatDate(booking.start_date) || 'N/A'} to ${formatDate(booking.end_date) || 'N/A'}`);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`);
    doc.moveDown(1.4).font('Helvetica-Bold').fontSize(14).text('Account summary');
    doc.moveDown(0.5).font('Helvetica').fontSize(11);
    const money = (cents) => `LKR ${fromCents(cents).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    [['Booking total', totalCents], ['Approved payments received', paidCents], ['Pending receipt verification', pendingCents], ['Outstanding after approved payments', Math.max(0, totalCents - paidCents)], ['Currently payable', Math.max(0, totalCents - paidCents - pendingCents)]].forEach(([label, cents]) => {
      doc.text(label, 48, doc.y, { continued: true, width: 330 });
      doc.text(money(cents), { align: 'right' });
    });
    doc.moveDown(1).fillColor('#4F5D75').fontSize(9).text('Pending receipts are awaiting verification and are not included in approved payments received.');
    doc.end();
  } catch (err) {
    console.error('downloadPaymentInvoice error:', err);
    if (!res.headersSent) res.status(500).json({ message: 'Failed to generate payment invoice.' });
  }
};

const getAllPayments = async (req, res) => {
  const { page, limit, offset, buildPagination } = parsePagination(req.query, 15, 100);
  const isPaginated = req.query.page !== undefined || req.query.limit !== undefined;

  try {
    let sql = `
      SELECT p.payment_id, p.booking_id, p.installment, p.amount, p.payment_method, p.received_date, p.notes, p.status, p.slip_url,
             b.tour_type, b.quoted_price, b.additional_charges, b.start_date, b.end_date, b.customer_name, b.contact_number AS customer_phone,
             u.name AS recorded_by_name,
             c.email AS customer_email,
             COALESCE(fs.total_paid, 0) AS total_paid,
             COALESCE(fs.outstanding_balance, 0) AS outstanding_balance,
             COALESCE(ps.pending_amount, 0) AS pending_amount,
             COUNT(*) OVER()::integer AS total_count
      FROM payment p
      JOIN booking b ON p.booking_id = b.booking_id
      LEFT JOIN v_booking_financial_summary fs ON fs.booking_id = b.booking_id
      LEFT JOIN (
        SELECT booking_id, SUM(amount) AS pending_amount
        FROM payment WHERE status = 'PENDING' GROUP BY booking_id
      ) ps ON ps.booking_id = b.booking_id
      LEFT JOIN "user" u ON p.recorded_by = u.user_id
      JOIN "user" c ON b.user_id = c.user_id
      ORDER BY CASE p.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 WHEN 'REJECTED' THEN 2 ELSE 3 END, p.payment_id DESC
    `;
    const params = [];

    if (isPaginated) {
      sql += ` LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const { rows } = await db.query(sql, params);
    const totalCount = rows.length > 0 ? rows[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    const payments = rows.map(mapPaymentRow);
    payments.pagination = pagination;

    res.json({ payments, pagination });
  } catch (err) {
    console.error('getAllPayments error:', err);
    res.status(500).json({ message: 'Failed to retrieve payments.' });
  }
};

const getPaymentsForBooking = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user.role);

  try {
    const { rows: bookingRows } = await db.query(`
      SELECT b.booking_id, b.user_id, b.booking_status, b.quoted_price, b.additional_charges, b.tour_type,
             b.start_date, b.end_date, b.start_location, b.end_location,
             b.category_id, b.vehicle_id, vc.category_name,
             v.name AS vehicle_name, v.vehicle_number
      FROM booking b
      LEFT JOIN vehicle_category vc ON b.category_id = vc.category_id
      LEFT JOIN vehicle v ON b.vehicle_id = v.vehicle_id
      WHERE b.booking_id = $1
    `, [bookingId]);

    if (bookingRows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRows[0];

    if (!isAdmin && Number(booking.user_id) !== Number(userId)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { rows: paymentRows } = await db.query(`
      SELECT p.payment_id, p.booking_id, p.installment, p.amount, p.payment_method,
             p.received_date, p.status, p.slip_url, p.notes, p.recorded_by,
             u.name AS recorded_by_name
      FROM payment p
      LEFT JOIN "user" u ON p.recorded_by = u.user_id
      WHERE p.booking_id = $1
      ORDER BY p.received_date ASC, p.payment_id ASC
    `, [bookingId]);

    const baseCents = toCents(booking.quoted_price);
    const additionalCents = toCents(booking.additional_charges);
    const priceCents = baseCents + additionalCents;
    const basePrice = fromCents(baseCents);
    const additionalCharges = fromCents(additionalCents);
    const price = fromCents(priceCents);
    const start_date = formatDate(booking.start_date);
    const end_date = formatDate(booking.end_date);

    const approvedPayments = paymentRows.filter(p => p.status === 'APPROVED');
    const paidCents = approvedPayments.reduce((sum, p) => sum + toCents(p.amount), 0);
    const pendingCents = paymentRows.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + toCents(p.amount), 0);
    const remainingCents = Math.max(0, priceCents - paidCents);
    const paidAmount = fromCents(paidCents);
    const pendingAmount = fromCents(pendingCents);
    const remainingAmount = fromCents(remainingCents);

    const installments = price > 0 ? [{
      id: 1,
      number: 1,
      type: 'Booking Balance',
      typeLabel: 'Flexible payments accepted',
      amount: formatLKR(remainingAmount),
      rawAmount: remainingAmount,
      dueDate: end_date,
      dueDateNote: 'Remaining booking balance',
      status: remainingCents === 0 ? 'PAID' : 'PENDING',
      statusNote: remainingCents === 0 ? 'Fully paid' : pendingCents > 0 ? 'Payment verification in progress' : 'Payment pending',
    }] : [];
    const nextPaymentNote = price <= 0
      ? 'Price is not yet quoted by admin.'
      : remainingCents === 0
        ? 'Fully paid. No outstanding balance.'
        : pendingCents > 0
          ? `${formatLKR(pendingAmount)} is awaiting admin verification.`
          : `${formatLKR(remainingAmount)} remains due.`;

    const bookingRef = getBookingReference(booking.tour_type, booking.booking_id);
    const transactions = paymentRows.map((p) => mapTransactionRow(p, bookingRef));

    res.json({
      bookingId: bookingId,
      bookingReference: bookingRef,
      bookingStatus: booking.booking_status,
      tourType: booking.tour_type,
      startLocation: booking.start_location,
      endLocation: booking.end_location,
      startDate: start_date,
      endDate: end_date,
      baseAmount: basePrice,
      additionalCharges: additionalCharges,
      totalAmount: price,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      pendingAmount: pendingAmount,
      payableAmount: fromCents(Math.max(0, remainingCents - pendingCents)),
      nextPaymentNote: nextPaymentNote,
      installments: installments,
      transactions: transactions
    });
  } catch (err) {
    console.error('getPaymentsForBooking error:', err);
    res.status(500).json({ message: 'Failed to retrieve booking payments.' });
  }
};

const recordPayment = async (req, res) => {
  const payload = { ...extractPaymentPayload(req.body), slipUrl: null };
  const validation = validatePaymentPayload(payload);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }
  const adminId = req.user.id;
  const resolvedMethod = (payload.paymentMethod || 'CASH').toUpperCase();
  if (!['CASH', 'BANK_TRANSFER'].includes(resolvedMethod)) {
    return res.status(400).json({ message: 'Select Cash or Bank Transfer as the payment method.' });
  }
  if (resolvedMethod === 'BANK_TRANSFER' && !req.file) {
    return res.status(400).json({ message: 'Upload the bank receipt file to record a bank transfer.' });
  }

  try {
    if (req.file) payload.slipUrl = await uploadPaymentFile(req.file);

    // Atomic execution with balance calculation and lock:
    // validates payment does not exceed currently payable balance
    const { rows } = await db.query(
      `SELECT * FROM sp_record_and_reconcile_payment($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        payload.bookingId,
        payload.installment,
        payload.amount,
        resolvedMethod,
        payload.receivedDate,
        adminId,
        'APPROVED',
        payload.slipUrl,
        payload.notes,
      ]
    );

    const result = rows[0] || {};
    if (!result.success) {
      const status = result.message?.includes('not found') ? 404 : 400;
      return res.status(status).json({
        message: result.message || 'Payment amount exceeds the currently payable balance.',
        remainingBalance: Number(result.remaining_balance || 0),
      });
    }

    res.status(201).json({
      message: 'Payment recorded successfully.',
      payment_id: result.payment_id,
    });
  } catch (err) {
    console.error('recordPayment error:', err);
    res.status(500).json({ message: 'Failed to record payment.' });
  }
};

const uploadPaymentSlip = async (req, res) => {
  const { booking_id, installment = 'PARTIAL', amount, notes } = req.body;
  const paymentMethod = String(req.body.payment_method || 'BANK_TRANSFER').trim().toUpperCase();
  const amountNum = Number(amount);
  const validPrecision = /^\d+(?:\.\d{1,2})?$/.test(String(amount ?? '').trim());
  const slipFile = req.file;

  if (!booking_id || !Number.isFinite(amountNum) || amountNum <= 0 || !validPrecision) {
    return res.status(400).json({ message: 'booking_id and a positive payment amount are required.' });
  }
  if (!['CASH', 'BANK_TRANSFER'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Select Cash or Bank Transfer as the payment method.' });
  }
  if (paymentMethod === 'BANK_TRANSFER' && !slipFile) {
    return res.status(400).json({ message: 'Payment receipt file is required for bank transfers.' });
  }

  try {
    const { rows: bookingRows } = await db.query(
      'SELECT booking_id, user_id, booking_status FROM booking WHERE booking_id = $1',
      [booking_id]
    );
    if (!bookingRows.length) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    const booking = bookingRows[0];
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user?.role);
    if (!isAdmin && Number(booking.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Access denied: you can only submit payments for your own booking.' });
    }

    const slipUrl = slipFile ? await uploadPaymentFile(slipFile) : null;

    // sp_record_and_reconcile_payment verifies payment does not exceed the currently payable balance
    const { rows } = await db.query(
      `SELECT * FROM sp_record_and_reconcile_payment($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        booking_id,
        String(installment).toUpperCase(),
        amountNum,
        paymentMethod,
        null,
        req.user.id,
        'PENDING',
        slipUrl,
        notes || `Customer submitted ${paymentMethod === 'CASH' ? 'cash payment claim' : 'bank transfer receipt'}`,
      ]
    );

    const result = rows[0] || {};
    if (!result.success) {
      return res.status(400).json({
        message: result.message || 'Payment amount exceeds the currently payable balance.',
        remainingBalance: Number(result.remaining_balance || 0),
      });
    }

    res.status(201).json({
      message: 'Payment submitted successfully. It is pending admin verification.',
      payment_id: result.payment_id,
    });
  } catch (err) {
    console.error('uploadPaymentSlip error:', err);
    res.status(500).json({ message: 'Failed to submit payment.' });
  }
};

const approvePayment = async (req, res) => {
  const { paymentId } = req.params;
  const adminId = req.user.id;
  const { notes } = req.body;

  try {
    const { rowCount } = await db.query(`
      UPDATE payment
      SET status = 'APPROVED', received_date = CURRENT_DATE, recorded_by = $1, notes = COALESCE($2, notes)
      WHERE payment_id = $3
    `, [adminId, notes || null, paymentId]);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    res.json({ message: 'Payment approved successfully.' });
  } catch (err) {
    console.error('approvePayment error:', err);
    res.status(500).json({ message: 'Failed to approve payment.' });
  }
};

const rejectPayment = async (req, res) => {
  const { paymentId } = req.params;
  const adminId = req.user.id;
  const { notes } = req.body;

  try {
    const { rowCount } = await db.query(`
      UPDATE payment
      SET status = 'REJECTED', recorded_by = $1, notes = $2
      WHERE payment_id = $3
    `, [adminId, notes || 'Rejected by Admin', paymentId]);

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    res.json({ message: 'Payment rejected successfully.' });
  } catch (err) {
    console.error('rejectPayment error:', err);
    res.status(500).json({ message: 'Failed to reject payment.' });
  }
};

const updatePaymentSlip = async (req, res) => {
  const { paymentId } = req.params;
  let slipUrl = null;

  if (!req.file) {
    return res.status(400).json({ message: 'Upload the receipt file to replace the payment slip.' });
  }

  try {
    const { rows: paymentRows } = await db.query(
      'SELECT p.payment_id, b.user_id FROM payment p JOIN booking b ON p.booking_id = b.booking_id WHERE p.payment_id = $1',
      [paymentId]
    );

    if (paymentRows.length === 0) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    const payment = paymentRows[0];
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user?.role);
    if (!isAdmin && Number(payment.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Access denied: you can only update payment slips for your own booking.' });
    }

    slipUrl = await uploadPaymentFile(req.file);

    await db.query(
      'UPDATE payment SET slip_url = $1 WHERE payment_id = $2',
      [slipUrl, paymentId]
    );

    res.json({
      message: 'Payment slip updated successfully.',
      paymentId: Number(paymentId),
      slip_url: slipUrl,
    });
  } catch (err) {
    console.error('updatePaymentSlip error:', err);
    res.status(500).json({ message: 'Failed to update payment slip.' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentsForBooking,
  recordPayment,
  uploadPaymentSlip,
  updatePaymentSlip,
  approvePayment,
  rejectPayment,
  getPaymentReceiptDownloadUrl,
  downloadPaymentInvoice,
};
