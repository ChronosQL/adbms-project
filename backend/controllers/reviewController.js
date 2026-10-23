const pool = require('../db/connection');

const COUNTRY_FLAGS = {
  'Sri Lanka': '🇱🇰',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Nepal': '🇳🇵',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'India': '🇮🇳',
  'Japan': '🇯🇵',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Brazil': '🇧🇷',
  'Netherlands': '🇳🇱',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Mexico': '🇲🇽',
  'China': '🇨🇳',
  'South Africa': '🇿🇦',
  'New Zealand': '🇳🇿',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Philippines': '🇵🇭',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Singapore': '🇸🇬',
  'Hong Kong': '🇭🇰',
  'South Korea': '🇰🇷',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Turkey': '🇹🇷',
  'Greece': '🇬🇷',
  'Ireland': '🇮🇪',
  'Switzerland': '🇨🇭',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Belgium': '🇧🇪',
  'Austria': '🇦🇹',
  'Poland': '🇵🇱',
  'Portugal': '🇵🇹',
  'Israel': '🇮🇱',
  'Russia': '🇷🇺',
  'Ukraine': '🇺🇦',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
};

const getCountryFlag = (country) => {
  if (!country) return '🌍';
  const key = String(country).trim();
  return COUNTRY_FLAGS[key] || '🌍';
};

const normalizeImageUrls = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
};

const extractUploadedImageUrl = (file) => {
  if (!file) return null;
  return file.path || file.url || file.secure_url || file.location || file.filename || null;
};

const mapReviewRow = (row) => ({
  id: `r-${row.review_id}`,
  bookingId: row.booking_id,
  user: {
    name: row.customer_name,
    email: row.customer_email,
    country: row.customer_country || 'Sri Lanka',
    countryFlag: getCountryFlag(row.customer_country),
    avatar: null,
  },
  tourTitle: row.tour_title || 'Tour Booking',
  tourType: row.tour_type || 'Tour',
  stars: row.rating,
  driverName: row.driver_name || '',
  title: row.title || 'Guest Review',
  comment: row.feedback,
  images: Array.isArray(row.images) ? row.images : [],
  datePublished: new Date(row.created_at).toISOString().split('T')[0],
});

const getPublishedReviews = async (req, res) => {
  const { stars, tourType, sort, email } = req.query;
  const starParam = stars && stars !== 'All' ? parseInt(stars, 10) : null;
  const tourTypeParam = tourType && tourType !== 'All' ? tourType : null;
  const sortParam = sort || 'newest';
  const emailParam = email ? email.trim() : null;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM fn_get_filtered_reviews($1, $2, $3, $4)`,
      [starParam, tourTypeParam, sortParam, emailParam]
    );

    res.json({ reviews: rows.map(mapReviewRow) });
  } catch (error) {
    console.error('getPublishedReviews failed:', error);
    res.status(500).json({ message: 'Failed to load reviews.' });
  }
};

const getMyReviews = async (req, res) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: 'Not authenticated.' });

  try {
    const { rows } = await pool.query(
      `SELECT * FROM fn_get_filtered_reviews(NULL, NULL, 'newest', $1)`,
      [email]
    );

    res.json({ reviews: rows.map(mapReviewRow) });
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

    const result = tours.map((row) => ({
      id: String(row.booking_id),
      packageTitle: row.package_title || `${row.tour_type} Booking`,
      packageType: row.tour_type,
      completedDate: row.completed_at
        ? new Date(row.completed_at).toISOString().split('T')[0]
        : new Date(row.booking_date).toISOString().split('T')[0],
    }));

    res.json({ tours: result });
  } catch (error) {
    console.error('getReviewableTours failed:', error);
    res.status(500).json({ message: 'Failed to load reviewable tours.' });
  }
};

const createReview = async (req, res) => {
  const {
    customerEmail,
    bookingId,
    stars,
    driverName,
    title,
    comment,
    tourTitle,
    tourType,
    images,
  } = req.body;
  const uploadedImageUrls = Array.isArray(req.files)
    ? req.files.map(extractUploadedImageUrl).filter(Boolean)
    : [];
  const imageUrls = [...uploadedImageUrls, ...normalizeImageUrls(images)];

  if (!customerEmail || !bookingId || !stars || !comment) {
    return res.status(400).json({
      message: 'customerEmail, bookingId, stars and comment are required.',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: bookingRows } = await client.query(`
      SELECT b.booking_id, b.user_id, b.booking_status
      FROM booking b
      INNER JOIN "user" u ON u.user_id = b.user_id
      WHERE b.booking_id = $1 AND u.email = $2
      LIMIT 1
    `, [bookingId, customerEmail]);

    if (bookingRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found for this user.' });
    }

    const booking = bookingRows[0];
    if (booking.booking_status !== 'COMPLETED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Review allowed only for completed tours.' });
    }

    const { rows: existing } = await client.query(
      'SELECT review_id FROM review WHERE booking_id = $1 LIMIT 1',
      [bookingId]
    );
    if (existing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Review already exists for this booking.' });
    }

    const { rows: insertReview } = await client.query(`
      INSERT INTO review (
        user_id,
        booking_id,
        rating,
        driver_name,
        title,
        feedback
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING review_id
    `, [
      booking.user_id,
      bookingId,
      stars,
      driverName || null,
      title || null,
      comment,
    ]);

    const reviewId = insertReview[0].review_id;

    for (const url of imageUrls) {
      await client.query(
        'INSERT INTO review_image (review_id, image_url) VALUES ($1, $2)',
        [reviewId, url]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Review created successfully.',
      reviewId,
      imageUrls,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('createReview failed:', error);
    res.status(500).json({ message: 'Failed to create review.' });
  } finally {
    client.release();
  }
};

module.exports = {
  getPublishedReviews,
  getMyReviews,
  getReviewStats,
  getReviewableTours,
  createReview,
};