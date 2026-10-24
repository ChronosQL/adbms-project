const db = require('../db/connection');
const { parsePagination } = require('../utils/paginate');

const {
  getBookingReference,
  formatDate,
  formatLKR,
  mapPaymentRow,
  mapTransactionRow,
  extractPaymentPayload,
  validatePaymentPayload,
} = require('../dto/paymentDto');

const modifyDays = (dateStr, days) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
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
      SELECT b.booking_id, b.user_id, b.quoted_price, b.additional_charges, b.tour_type,
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

    if (!isAdmin && booking.user_id !== userId) {
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

    const basePrice = booking.quoted_price ? parseFloat(booking.quoted_price) : 0;
    const additionalCharges = booking.additional_charges ? parseFloat(booking.additional_charges) : 0;
    const price = basePrice + additionalCharges;
    const tourType = booking.tour_type;
    const start_date = formatDate(booking.start_date);
    const end_date = formatDate(booking.end_date);

    const approvedPayments = paymentRows.filter(p => p.status === 'APPROVED');
    const paidAmount = approvedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const pendingAmount = paymentRows.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount), 0);
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
          statusNote = `Paid on ${approvedFull && approvedFull.received_date ? formatDate(approvedFull.received_date) : todayStr}`;
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
          depStatusNote = `Paid on ${approvedDeposit && approvedDeposit.received_date ? formatDate(approvedDeposit.received_date) : todayStr}`;
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
          finalStatusNote = `Paid on ${approvedFinal && approvedFinal.received_date ? formatDate(approvedFinal.received_date) : todayStr}`;
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
            additionalStatusNote = `Paid on ${approvedAdditional && approvedAdditional.received_date ? formatDate(approvedAdditional.received_date) : todayStr}`;
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

    const bookingRef = getBookingReference(booking.tour_type, booking.booking_id);
    const transactions = paymentRows.map((p) => mapTransactionRow(p, bookingRef));

    res.json({
      bookingId: bookingId,
      bookingReference: bookingRef,
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
      payableAmount: Math.max(0, remainingAmount - pendingAmount),
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
  const payload = { ...extractPaymentPayload(req.body), slipUrl: req.file?.path || null };
  const validation = validatePaymentPayload(payload);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }
  const adminId = req.user.id;
  const resolvedMethod = (payload.paymentMethod || 'CASH').toUpperCase();
  if (resolvedMethod === 'BANK_TRANSFER' && !payload.slipUrl) {
    return res.status(400).json({ message: 'Upload the bank receipt file to record a bank transfer.' });
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: bookingRows } = await client.query(
      'SELECT booking_id, booking_status, quoted_price, additional_charges FROM booking WHERE booking_id = $1 FOR UPDATE',
      [payload.bookingId]
    );
    if (!bookingRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRows[0];
    if (booking.booking_status === 'CLOSED' || booking.booking_status === 'CANCELLED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `Cannot record payment. Booking is already ${booking.booking_status.toLowerCase()}.`
      });
    }

    const { rows: totals } = await client.query(
      `SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'APPROVED'), 0) AS paid,
              COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) AS pending
       FROM payment WHERE booking_id = $1`, [payload.bookingId]
    );
    const total = Number(booking.quoted_price || 0) + Number(booking.additional_charges || 0);
    const remainingBalance = Math.max(0, total - Number(totals[0].paid) - Number(totals[0].pending));

    if (payload.amount > remainingBalance) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `Payment amount (${payload.amount}) exceeds the remaining balance (${remainingBalance}).`,
        remainingBalance,
      });
    }

    if (resolvedMethod === 'CASH') {
      const CASH_ALLOWED_STATUSES = ['TOUR_STARTED', 'COMPLETED'];
      if (!CASH_ALLOWED_STATUSES.includes(booking.booking_status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          message: `Cash payments can only be recorded when the tour status is TOUR_STARTED or COMPLETED. Current booking status is ${booking.booking_status}.`
        });
      }
    }

    const { rows } = await client.query(`
      INSERT INTO payment (booking_id, installment, amount, payment_method, received_date, recorded_by, status, slip_url, notes)
      VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', $7, $8) RETURNING payment_id
    `, [payload.bookingId, payload.installment, payload.amount, resolvedMethod, payload.receivedDate, adminId, payload.slipUrl, payload.notes]);

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Payment recorded successfully.',
      payment_id: rows[0].payment_id
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('recordPayment error:', err);
    res.status(500).json({ message: 'Failed to record payment.' });
  } finally {
    client.release();
  }
};

const uploadPaymentSlip = async (req, res) => {
  const { booking_id, installment = 'PARTIAL', amount, notes } = req.body;
  const amountNum = Number(amount);
  const validPrecision = /^\d+(?:\.\d{1,2})?$/.test(String(amount ?? '').trim());
  const slipFile = req.file;

  if (!booking_id || !Number.isFinite(amountNum) || amountNum <= 0 || !validPrecision) {
    return res.status(400).json({ message: 'booking_id and a positive payment amount are required.' });
  }
  if (!slipFile) return res.status(400).json({ message: 'Payment receipt file is required.' });

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: bookingRows } = await client.query(
      'SELECT booking_id, user_id, booking_status, quoted_price, additional_charges FROM booking WHERE booking_id = $1 FOR UPDATE',
      [booking_id]
    );
    if (!bookingRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found.' });
    }
    const booking = bookingRows[0];
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(req.user?.role);
    if (!isAdmin && Number(booking.user_id) !== Number(req.user.id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Access denied: you can only submit payments for your own booking.' });
    }
    if (['CANCELLED', 'CLOSED'].includes(booking.booking_status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Cannot upload payment receipt for a ${booking.booking_status.toLowerCase()} booking.` });
    }

    const { rows: totals } = await client.query(
      `SELECT COALESCE(SUM(amount) FILTER (WHERE status = 'APPROVED'), 0) AS paid,
              COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0) AS pending
       FROM payment WHERE booking_id = $1`, [booking_id]
    );
    const total = Number(booking.quoted_price || 0) + Number(booking.additional_charges || 0);
    const available = Math.max(0, total - Number(totals[0].paid) - Number(totals[0].pending));
    if (amountNum > available) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Payment amount (${amountNum}) exceeds the currently payable balance (${available}).`, remainingBalance: available });
    }

    const { rows } = await client.query(`
      INSERT INTO payment (booking_id, installment, amount, payment_method, received_date, status, slip_url, notes)
      VALUES ($1, $2, $3, 'BANK_TRANSFER', CURRENT_DATE, 'PENDING', $4, $5) RETURNING payment_id
    `, [booking_id, String(installment).toUpperCase(), amountNum, slipFile.path, notes || 'Uploaded by Customer']);
    await client.query('COMMIT');
    res.status(201).json({ message: 'Payment receipt uploaded successfully. Under review by admin.', payment_id: rows[0].payment_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('uploadPaymentSlip error:', err);
    res.status(500).json({ message: 'Failed to upload payment receipt.' });
  } finally {
    client.release();
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
  const slipUrl = req.file?.path || null;

  if (!slipUrl) {
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
  rejectPayment
};
