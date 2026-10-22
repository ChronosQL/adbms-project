const express = require('express');
const router = express.Router();
const {
  createP2PBooking,
  getMyBookings,
  getAllBookings,
  setQuote,
  updateStatus,
  updateBooking,
  downloadBookingConfirmationPdf,
  updateAdditionalCharges,
} = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// ── Customer routes (require login) ──────────────────────────────────────────
router.post('/p2p', verifyToken, createP2PBooking);
router.get('/my', verifyToken, getMyBookings);
router.get('/:id/confirmation-pdf', verifyToken, downloadBookingConfirmationPdf);
router.put('/:id', verifyToken, updateBooking);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/', verifyToken, adminOnly, getAllBookings);
router.patch('/:id/quote', verifyToken, adminOnly, setQuote);
router.patch('/:id/additional-charges', verifyToken, adminOnly, updateAdditionalCharges);
router.patch('/:id/status', verifyToken, updateStatus); // customer can also ACCEPT/REJECT

module.exports = router;
