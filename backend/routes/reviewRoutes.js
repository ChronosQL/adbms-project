const express = require('express');
const upload = require('../middleware/reviewUploadMiddleware');
const {
  getPublishedReviews,
  getReviewStats,
  getReviewableTours,
  createReview,
} = require('../controllers/reviewController');

const router = express.Router();

router.get('/', getPublishedReviews);
router.get('/stats', getReviewStats);
router.get('/reviewable-tours', getReviewableTours);
router.post('/', upload.array('images', 5), createReview);

module.exports = router;
