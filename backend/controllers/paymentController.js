const db = require('../db/connection');
const { parsePagination } = require('../utils/paginate');

const normalizeTourType = (value) => String(value || 'P2P').toUpperCase();
const getBookingReference = (tourType, bookingId) => {
  const type = normalizeTourType(tourType);
  const typeCode = type === 'PACKAGE' ? 'PKG' : type === 'CUSTOM' ? 'CUS' : 'P2P';
  return `CBT-${typeCode}-${bookingId}`;
};

const modifyDays = (dateStr, days) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatLKR = (val) => {
  return `LKR ${Number(val).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
             (SELECT COALESCE(SUM(amount), 0) FROM payment WHERE booking_id = b.booking_id AND status = 'APPROVED') AS total_paid,
             COUNT(*) OVER()::integer AS total_count
      FROM payment p
      JOIN booking b ON p.booking_id = b.booking_id
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

    const payments = rows.map((r) => ({
      id: `PAY${String(r.payment_id).padStart(3, '0')}`,
      rawId: r.payment_id,
      bookingId: getBookingReference(r.tour_type, r.booking_id),
      booking_id: r.booking_id,
      tourType: r.tour_type === 'PACKAGE' ? 'Package Tour' : r.tour_type === 'CUSTOM' ? 'Customized' : 'P2P Tour',
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email,
      type: r.installment === 'DEPOSIT' ? 'Deposit' : r.installment === 'FINAL' ? 'Final' : r.installment === 'ADDITIONAL' ? 'Additional Charges' : 'Full Payment',
      typePercent: r.installment === 'FULL' ? '100%' : r.installment === 'ADDITIONAL' ? 'Extra' : '50%',
      amount: formatLKR(r.amount),
      rawAmount: parseFloat(r.amount),
      method: r.payment_method === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash',
      date: r.received_date ? r.received_date.toISOString().split('T')[0] : 'Pending',
      time: '12:00 PM',
      status: r.status.toLowerCase(),
      notes: r.notes,
      recordedBy: r.recorded_by_name || 'Customer',
      baseAmount: formatLKR(r.quoted_price || 0),
      additionalCharges: formatLKR(r.additional_charges || 0),
      rawAdditionalCharges: parseFloat(r.additional_charges || 0),
      totalAmount: formatLKR(parseFloat(r.quoted_price || 0) + parseFloat(r.additional_charges || 0)),
      tourDates: `${r.start_date.toISOString().split('T')[0]} to ${r.end_date.toISOString().split('T')[0]}`,
      isBasePricePaid: parseFloat(r.total_paid || 0) >= parseFloat(r.quoted_price || 0),
      slip: r.slip_url ? {
        filename: r.slip_url.split('/').pop().slice(-20),
        size: 'Cloudinary Upload',
        uploadedAt: r.received_date ? r.received_date.toISOString().split('T')[0] : 'Pending',
        previewUrl: r.slip_url
      } : null
    }));
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
      SELECT b.*, vc.category_name, v.name as vehicle_name, v.vehicle_number
      FROM booking b
      LEFT JOIN vehicle_category vc ON b.category_id = vc.category_id
      LEFT JOIN vehicle v ON b.vehicle_id = v.vehicle_id
      WHERE b.booking_id = $1
    `, [bookingId]);

    if (bookingRows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRows[0];

    if (!isAdmin && booking.user_id !== userId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const { rows: paymentRows } = await db.query(`
      SELECT p.*, u.name AS recorded_by_name
      FROM payment p
      LEFT JOIN "user" u ON p.recorded_by = u.user_id
      WHERE p.booking_id = $1
      ORDER BY p.received_date ASC, p.payment_id ASC
    `, [bookingId]);

    const basePrice = booking.quoted_price ? parseFloat(booking.quoted_price) : 0;
    const additionalCharges = booking.additional_charges ? parseFloat(booking.additional_charges) : 0;
    const price = basePrice + additionalCharges;
    const tourType = booking.tour_type;
    const start_date = booking.start_date ? booking.start_date.toISOString().split('T')[0] : null;
    const end_date = booking.end_date ? booking.end_date.toISOString().split('T')[0] : null;

    const approvedPayments = paymentRows.filter(p => p.status === 'APPROVED');
    const paidAmount = approvedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const remainingAmount = Math.max(0, price - paidAmount);

    const todayStr = new Date().toISOString().split('T')[0];

    const installments = [];
    let nextPaymentNote = '';

    if (price > 0) {
      if (tourType === 'P2P') {
        const approvedFull = paymentRows.find(p => p.installment === 'FULL' && p.status === 'APPROVED');
        const pendingFull = paymentRows.find(p => p.installment === 'FULL' && p.status === 'PENDING');
        const rejectedFull = paymentRows.find(p => p.installment === 'FULL' && p.status === 'REJECTED');

        let status = 'PENDING';
        let statusNote = 'Payment pending';

        if (approvedFull || paidAmount >= price) {
          status = 'PAID';
          statusNote = `Paid on ${approvedFull ? approvedFull.received_date.toISOString().split('T')[0] : todayStr}`;
        } else if (pendingFull) {
          status = 'PENDING';
          statusNote = 'Pending verification';
        } else if (todayStr > end_date) {
          status = 'OVERDUE';
          statusNote = 'Payment overdue';
        }

        installments.push({
          id: 1,
          number: 1,
          type: 'Full Payment',
          typeLabel: '100% of total',
          amount: formatLKR(price),
          rawAmount: price,
          dueDate: end_date,
          dueDateNote: 'After the tour ends',
          status: status,
          statusNote: statusNote
        });

        if (status !== 'PAID' && status !== 'PENDING') {
          nextPaymentNote = `Full payment of ${formatLKR(price)} is due on ${end_date} (After the tour ends).`;
        } else if (status === 'PENDING') {
          nextPaymentNote = 'Verification in progress for your uploaded full payment.';
        } else {
          nextPaymentNote = 'Fully paid. No outstanding balance.';
        }
      } else {
        const depositAmt = basePrice * 0.5;
        const finalAmt = basePrice * 0.5;
        const depositDueDate = modifyDays(start_date, 2);
        const finalDueDate = modifyDays(end_date, -1);

        const approvedDeposit = paymentRows.find(p => p.installment === 'DEPOSIT' && p.status === 'APPROVED');
        const pendingDeposit = paymentRows.find(p => p.installment === 'DEPOSIT' && p.status === 'PENDING');

        let depStatus = 'PENDING';
        let depStatusNote = 'Payment pending';

        if (approvedDeposit || paidAmount >= depositAmt) {
          depStatus = 'PAID';
          depStatusNote = `Paid on ${approvedDeposit ? approvedDeposit.received_date.toISOString().split('T')[0] : todayStr}`;
        } else if (pendingDeposit) {
          depStatus = 'PENDING';
          depStatusNote = 'Pending verification';
        } else if (todayStr > depositDueDate) {
          depStatus = 'OVERDUE';
          depStatusNote = 'Payment overdue';
        }

        installments.push({
          id: 1,
          number: 1,
          type: 'Deposit',
          typeLabel: '50% of total',
          amount: formatLKR(depositAmt),
          rawAmount: depositAmt,
          dueDate: depositDueDate,
          dueDateNote: 'Within 2 days of tour start',
          status: depStatus,
          statusNote: depStatusNote
        });

        const approvedFinal = paymentRows.find(p => p.installment === 'FINAL' && p.status === 'APPROVED');
        const pendingFinal = paymentRows.find(p => p.installment === 'FINAL' && p.status === 'PENDING');

        let finalStatus = 'PENDING';
        let finalStatusNote = 'Payment pending';

        if (approvedFinal || paidAmount >= basePrice) {
          finalStatus = 'PAID';
          finalStatusNote = `Paid on ${approvedFinal ? approvedFinal.received_date.toISOString().split('T')[0] : todayStr}`;
        } else if (pendingFinal) {
          finalStatus = 'PENDING';
          finalStatusNote = 'Pending verification';
        } else if (todayStr > finalDueDate) {
          finalStatus = 'OVERDUE';
          finalStatusNote = 'Payment overdue';
        }

        installments.push({
          id: 2,
          number: 2,
          type: 'Final Payment',
          typeLabel: 'Remaining 50%',
          amount: formatLKR(finalAmt),
          rawAmount: finalAmt,
          dueDate: finalDueDate,
          dueDateNote: 'Before the last day of tour',
          status: finalStatus,
          statusNote: finalStatusNote
        });

        let additionalStatus = 'PENDING';
        let additionalStatusNote = 'Payment pending';
        const additionalDueDate = end_date;

        if (additionalCharges > 0) {
          const approvedAdditional = paymentRows.find(p => p.installment === 'ADDITIONAL' && p.status === 'APPROVED');
          const pendingAdditional = paymentRows.find(p => p.installment === 'ADDITIONAL' && p.status === 'PENDING');

          if (approvedAdditional || paidAmount >= price) {
            additionalStatus = 'PAID';
            additionalStatusNote = `Paid on ${approvedAdditional ? approvedAdditional.received_date.toISOString().split('T')[0] : todayStr}`;
          } else if (pendingAdditional) {
            additionalStatus = 'PENDING';
            additionalStatusNote = 'Pending verification';
          } else if (todayStr > additionalDueDate) {
            additionalStatus = 'OVERDUE';
            additionalStatusNote = 'Payment overdue';
          }

          installments.push({
            id: 3,
            number: 3,
            type: 'Additional Charges',
            typeLabel: 'Extra Mileage',
            amount: formatLKR(additionalCharges),
            rawAmount: additionalCharges,
            dueDate: additionalDueDate,
            dueDateNote: 'After the tour ends',
            status: additionalStatus,
            statusNote: additionalStatusNote
          });
        }

        if (depStatus !== 'PAID' && depStatus !== 'PENDING') {
          nextPaymentNote = `Deposit of ${formatLKR(depositAmt)} is due on ${depositDueDate} (Within 2 days of tour start).`;
        } else if (depStatus === 'PENDING') {
          nextPaymentNote = 'Verification in progress for deposit payment proof.';
        } else if (finalStatus !== 'PAID' && finalStatus !== 'PENDING') {
          nextPaymentNote = `Final payment of ${formatLKR(finalAmt)} is due on ${finalDueDate} (Before the last day of the tour).`;
        } else if (finalStatus === 'PENDING') {
          nextPaymentNote = 'Verification in progress for final payment proof.';
        } else if (additionalCharges > 0 && additionalStatus !== 'PAID' && additionalStatus !== 'PENDING') {
          nextPaymentNote = `Additional charges of ${formatLKR(additionalCharges)} are due.`;
        } else if (additionalCharges > 0 && additionalStatus === 'PENDING') {
          nextPaymentNote = 'Verification in progress for additional charges proof.';
        } else {
          nextPaymentNote = 'Fully paid. No outstanding balance.';
        }
      }
    } else {
      nextPaymentNote = 'Price is not yet quoted by admin.';
    }

    const transactions = paymentRows.map(p => ({
      id: `TX${String(p.payment_id).padStart(3, '0')}`,
      rawId: p.payment_id,
      date: p.received_date ? p.received_date.toISOString().split('T')[0] : 'Pending',
      type: p.installment === 'DEPOSIT' ? 'Deposit' : p.installment === 'FINAL' ? 'Final Payment' : p.installment === 'ADDITIONAL' ? 'Additional Charges' : 'Full Payment',
      amount: formatLKR(p.amount),
      method: p.payment_method === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash',
      status: p.status === 'APPROVED' ? 'VERIFIED' : p.status === 'REJECTED' ? 'REJECTED' : 'PENDING VERIFICATION',
      recordedBy: p.recorded_by_name || 'Customer',
      notes: p.notes,
      slipUrl: p.slip_url,
      tourId: getBookingReference(booking.tour_type, booking.booking_id),
    }));

    res.json({
      bookingId: bookingId,
      bookingReference: getBookingReference(booking.tour_type, booking.booking_id),
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
  const { booking_id, installment, amount, payment_method, received_date, notes } = req.body;
  const adminId = req.user.id;

  if (!booking_id || !installment || !amount || !received_date) {
    return res.status(400).json({ message: 'All required payment fields (booking_id, installment, amount, received_date) must be provided.' });
  }

  try {
    const { rows: bookingRows } = await db.query('SELECT * FROM booking WHERE booking_id = $1', [booking_id]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRows[0];
    if (booking.booking_status === 'CLOSED' || booking.booking_status === 'CANCELLED') {
      return res.status(400).json({
        message: `Cannot record payment. Booking is already ${booking.booking_status.toLowerCase()}.`
      });
    }

    const resolvedMethod = payment_method || 'CASH';

    const { rows } = await db.query(`
      INSERT INTO payment (booking_id, installment, amount, payment_method, received_date, recorded_by, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', $7) RETURNING payment_id
    `, [booking_id, installment, amount, resolvedMethod, received_date, adminId, notes || null]);

    res.status(201).json({
      message: 'Payment recorded successfully.',
      payment_id: rows[0].payment_id
    });
  } catch (err) {
    console.error('recordPayment error:', err);
    res.status(500).json({ message: 'Failed to record payment.' });
  }
};

const uploadPaymentSlip = async (req, res) => {
  const { booking_id, installment, amount, notes } = req.body;
  const slipFile = req.file;

  if (!booking_id || !installment || !amount) {
    return res.status(400).json({ message: 'booking_id, installment, and amount are required.' });
  }

  if (!slipFile) {
    return res.status(400).json({ message: 'Payment slip file is required.' });
  }

  try {
    const { rows: bookingRows } = await db.query('SELECT * FROM booking WHERE booking_id = $1', [booking_id]);
    if (bookingRows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const { rows } = await db.query(`
      INSERT INTO payment (booking_id, installment, amount, payment_method, received_date, status, slip_url, notes)
      VALUES ($1, $2, $3, 'BANK_TRANSFER', CURRENT_DATE, 'PENDING', $4, $5) RETURNING payment_id
    `, [booking_id, installment, amount, slipFile.path, notes || 'Uploaded by Customer']);

    res.status(201).json({
      message: 'Payment slip uploaded successfully. Under review by admin.',
      payment_id: rows[0].payment_id,
      slip_url: slipFile.path
    });
  } catch (err) {
    console.error('uploadPaymentSlip error:', err);
    res.status(500).json({ message: 'Failed to upload payment slip.' });
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

module.exports = {
  getAllPayments,
  getPaymentsForBooking,
  recordPayment,
  uploadPaymentSlip,
  approvePayment,
  rejectPayment
};
