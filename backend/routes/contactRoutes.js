const express     = require('express');
const router      = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { adminOnly }   = require('../middleware/adminMiddleware');
const {
  submitInquiry,
  getAllInquiries,
  getMyInquiries,
  addReply,
  markAsRead,
} = require('../controllers/contactController');

router.post('/',              submitInquiry);                        // public
router.get('/my',             verifyToken, getMyInquiries);         // logged-in user
router.get('/',               verifyToken, adminOnly, getAllInquiries); // admin
router.post('/:id/reply',     verifyToken, addReply);               // admin or customer
router.patch('/:id/read',     verifyToken, adminOnly, markAsRead);  // admin

module.exports = router;
