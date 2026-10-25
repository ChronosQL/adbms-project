const pool = require('../db/connection');
const { parsePagination } = require('../utils/paginate');

const {
  mapReviewRow,
  mapReviewableTourRow,
  extractReviewPayload,
  validateReviewPayload,
} = require('../dto/reviewDto');

const getPublishedReviews = async (req, res) => {
  const { stars, tourType, sort, email } = req.query;
  const starParam = stars && stars !== 'All' ? parseInt(stars, 10) : null;
  const tourTypeParam = tourType && tourType !== 'All' ? tourType : null;
  const sortParam = sort || 'newest';
  const emailParam = email ? email.trim() : null;

  const { page, limit, offset, buildPagination } = parsePagination(req.query, 12, 100);

  try {
    const { rows } = await pool.query(
      `SELECT * FROM fn_get_filtered_reviews($1, $2, $3, $4, $5, $6)`,
      [starParam, tourTypeParam, sortParam, emailParam, limit, offset]
    );

    const totalCount = rows.length > 0 ? rows[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    res.json({
      reviews: rows.map(mapReviewRow),
      pagination,
    });
  } catch (error) {
    console.error('getPublishedReviews failed:', error);
    res.status(500).json({ message: 'Failed to load reviews.' });
  }
};

const getMyReviews = async (req, res) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: 'Not authenticated.' });

  const { page, limit, offset, buildPagination } = parsePagination(req.query, 10, 50);

  try {
    const { rows } = await pool.query(
      `SELECT * FROM fn_get_filtered_reviews(NULL, NULL, 'newest', $1, $2, $3)`,
      [email, limit, offset]
    );

    const totalCount = rows.length > 0 ? rows[0].total_count : 0;
    const pagination = buildPagination(totalCount);

    res.json({
      reviews: rows.map(mapReviewRow),
      pagination,
    });
  } catch (err) {
    console.error('getMyReviews error:', err);
    res.status(500).json({ message: 'Failed to load your reviews.' });
  }
};

const getReviewStats = async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM review_star_summary`);
    const row = rows[0] || {};

    const breakdown = {
      5: Number(row.five_star_reviews) || 0,
      4: Number(row.four_star_reviews) || 0,
      3: Number(row.three_star_reviews) || 0,
      2: Number(row.two_star_reviews) || 0,
      1: Number(row.one_star_reviews) || 0,
    };
    const total = Number(row.total_reviews) || 0;
    const average = Number(row.average_rating) || 0;

    res.json({
      total,
      ratingSum: Number(row.rating_sum) || 0,
      avg: average,
      average,
      breakdown,
    });
  } catch (error) {
    console.error('getReviewStats failed:', error);
    res.status(500).json({ message: 'Failed to load review stats.' });
  }
};

const getReviewableTours = async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ message: 'email is required.' });
  }

  try {
    const { rows: tours } = await pool.query(`
      SELECT
        b.booking_id,
        b.tour_type,
        b.booking_date,
        b.completed_at,
        p.title AS package_title
      FROM booking b
      INNER JOIN "user" u ON u.user_id = b.user_id
      LEFT JOIN booking_package bp ON bp.booking_id = b.booking_id
      LEFT JOIN package p ON p.package_id = bp.package_id
      LEFT JOIN review r ON r.booking_id = b.booking_id
      WHERE u.email = $1
        AND b.booking_status = 'COMPLETED'
        AND r.review_id IS NULL
      ORDER BY COALESCE(b.completed_at, b.booking_date) DESC
    `, [email]);

    res.json({ tours: tours.map(mapReviewableTourRow) });
  } catch (error) {
    console.error('getReviewableTours failed:', error);
    res.status(500).json({ message: 'Failed to load reviewable tours.' });
  }
};

const createReview = async (req, res) => {
  const payload = extractReviewPayload(req.body, req.files);
  const validation = validateReviewPayload(payload);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    const { rows: userRows } = await pool.query(
      'SELECT user_id FROM "user" WHERE LOWER(email) = LOWER($1)',
      [payload.customerEmail]
    );

    if (!userRows.length) {
      return res.status(404).json({ message: 'Booking not found for this user.' });
    }

    const userId = userRows[0].user_id;

    // sp_submit_tour_review validates booking ownership, completion status, single review constraint,
    // and batch inserts review images atomically
    const { rows } = await pool.query(
      `SELECT * FROM sp_submit_tour_review($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        payload.bookingId,
        payload.stars,
        payload.driverName || null,
        payload.title || null,
        payload.comment,
        payload.images && payload.images.length > 0 ? payload.images : null,
      ]
    );

    const result = rows[0] || {};
    if (!result.success) {
      let status = 400;
      if (result.message?.includes('not found')) status = 404;
      else if (result.message?.includes('already exists')) status = 409;
      return res.status(status).json({ message: result.message });
    }

    res.status(201).json({
      message: 'Review created successfully.',
      reviewId: result.review_id,
      imageUrls: payload.images,
    });
  } catch (error) {
    console.error('createReview failed:', error);
    res.status(500).json({ message: 'Failed to create review.' });
  }
};

module.exports = {
  getPublishedReviews,
  getMyReviews,
  getReviewStats,
  getReviewableTours,
  createReview,
};