const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentsForBooking,
  recordPayment,
  uploadPaymentSlip,
  approvePayment,
  rejectPayment
} = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const upload = require('../middleware/paymentUploadMiddleware');

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/', verifyToken, adminOnly, getAllPayments);
router.post('/', verifyToken, adminOnly, recordPayment);
router.patch('/:paymentId/approve', verifyToken, adminOnly, approvePayment);
router.patch('/:paymentId/reject', verifyToken, adminOnly, rejectPayment);

// ── Customer routes ───────────────────────────────────────────────────────────
router.post('/upload-slip', verifyToken, upload.single('slip'), uploadPaymentSlip);

// ── Shared routes ─────────────────────────────────────────────────────────────
router.get('/booking/:bookingId', verifyToken, getPaymentsForBooking);

module.exports = router;
