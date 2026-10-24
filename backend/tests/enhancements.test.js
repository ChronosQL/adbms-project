const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../db/connection');

const BACKEND_DIR = path.resolve(__dirname, '..');
const SCHEMA_FILE = path.join(BACKEND_DIR, 'db', 'schema.sql');
const INIT_FILE = path.join(BACKEND_DIR, 'db', 'init.sql');
const BOOKING_CONTROLLER = path.join(BACKEND_DIR, 'controllers', 'bookingController.js');
const PAYMENT_CONTROLLER = path.join(BACKEND_DIR, 'controllers', 'paymentController.js');
const CONTACT_CONTROLLER = path.join(BACKEND_DIR, 'controllers', 'contactController.js');
const PACKAGE_CONTROLLER = path.join(BACKEND_DIR, 'controllers', 'packageController.js');

test('Enhancements: Schema synchronicity for booking PostGIS coordinates', () => {
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const initContent = fs.readFileSync(INIT_FILE, 'utf-8');

  const requiredFields = [
    'pickup_lat',
    'pickup_lng',
    'pickup_geom',
    'dropoff_lat',
    'dropoff_lng',
    'dropoff_geom',
    'idx_booking_pickup_geom',
    'idx_booking_dropoff_geom',
    'set_booking_geoms()',
    'trg_booking_geoms',
  ];

  for (const field of requiredFields) {
    assert.ok(
      schemaContent.includes(field),
      `schema.sql must contain '${field}' for PostGIS support.`
    );
    assert.ok(
      initContent.includes(field),
      `init.sql must contain '${field}' for PostGIS support.`
    );
  }
});

test('Enhancements: Database connection verifies PostGIS coordinates columns on booking table', async () => {
  const { rows } = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'booking' AND column_name IN (
      'pickup_lat', 'pickup_lng', 'pickup_geom',
      'dropoff_lat', 'dropoff_lng', 'dropoff_geom'
    )
  `);

  const foundCols = rows.map(r => r.column_name);
  assert.equal(foundCols.length, 6, 'All 6 PostGIS columns must exist in local PostgreSQL booking table.');
});

test('Enhancements: bookingController enforces one quote per booking atomically', () => {
  const code = fs.readFileSync(BOOKING_CONTROLLER, 'utf-8');

  assert.ok(
    code.includes("WHERE booking_id = $4 AND booking_status = 'PENDING' AND quoted_at IS NULL"),
    'setQuote must atomically update only if status is PENDING and quoted_at is NULL.'
  );

  assert.ok(
    code.includes('409') && code.includes('already been provided'),
    'setQuote must return 409 Conflict if quote already exists.'
  );
});

test('Enhancements: bookingController stores and maps pickup & dropoff coordinates', () => {
  const code = fs.readFileSync(BOOKING_CONTROLLER, 'utf-8');
  const dtoCode = fs.readFileSync(path.join(BACKEND_DIR, 'dto', 'bookingDto.js'), 'utf-8');

  assert.ok(
    code.includes('pickup_lat') && code.includes('dropoff_lng'),
    'createP2PBooking must insert pickup_lat and dropoff_lng into booking.'
  );

  assert.ok(
    (code.includes('pickupLat:') || dtoCode.includes('pickupLat:')) &&
    (code.includes('dropoffLng:') || dtoCode.includes('dropoffLng:')),
    'mapBooking must map pickupLat and dropoffLng fields.'
  );

  assert.ok(
    code.includes('payload.packageId'),
    'createP2PBooking must bind payload.packageId when inserting into booking_package.'
  );
});

test('Enhancements: paymentController enforces user ownership and balance guard', () => {
  const code = fs.readFileSync(PAYMENT_CONTROLLER, 'utf-8');

  assert.ok(
    code.includes('Number(booking.user_id) !== Number(req.user.id)'),
    'uploadPaymentSlip must verify customer ownership.'
  );

  assert.ok(
    code.includes('exceeds the remaining balance') || code.includes('exceeds the outstanding balance') || code.includes('exceeds the currently payable balance'),
    'paymentController must guard against overpayments.'
  );
});

test('Enhancements: contactController supports search and status filtering', () => {
  const code = fs.readFileSync(CONTACT_CONTROLLER, 'utf-8');

  assert.ok(
    code.includes('search') && code.includes('sender_name ILIKE'),
    'getAllInquiries must support search term queries.'
  );

  assert.ok(
    code.includes('unreadOnly') && code.includes('is_read = FALSE'),
    'getAllInquiries must support unread-only filtering.'
  );
});

test('Enhancements: packageController supports server-side pagination', () => {
  const code = fs.readFileSync(PACKAGE_CONTROLLER, 'utf-8');

  assert.ok(
    code.includes('parsePagination'),
    'packageController must import and use parsePagination.'
  );

  assert.ok(
    code.includes('COUNT(*) OVER()::integer AS total_count'),
    'listPublicPackages must compute total_count using window function.'
  );
});

test('Enhancements: reviewController and reportController robust error-free responses', () => {
  const REVIEW_CONTROLLER = path.join(BACKEND_DIR, 'controllers', 'reviewController.js');
  const REPORT_CONTROLLER = path.join(BACKEND_DIR, 'controllers', 'reportController.js');
  const reviewCode = fs.readFileSync(REVIEW_CONTROLLER, 'utf-8');
  const reportCode = fs.readFileSync(REPORT_CONTROLLER, 'utf-8');

  assert.ok(
    reviewCode.includes('imageUrls: payload.images'),
    'createReview must return payload.images as imageUrls.'
  );

  assert.ok(
    reportCode.includes("status = 'APPROVED'"),
    'reportController earnings queries must filter for APPROVED payments.'
  );
});

test('Enhancements: package_place coordinates schema synchronicity', () => {
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const initContent = fs.readFileSync(INIT_FILE, 'utf-8');

  const requiredFields = [
    'latitude NUMERIC(10, 7)',
    'longitude NUMERIC(10, 7)',
    'idx_package_place_geom',
    'set_package_place_geom()',
    'trg_package_place_geom',
  ];

  for (const field of requiredFields) {
    assert.ok(
      schemaContent.includes(field),
      `schema.sql must contain '${field}' for package_place coordinates.`
    );
    assert.ok(
      initContent.includes(field),
      `init.sql must contain '${field}' for package_place coordinates.`
    );
  }
});

test('Enhancements: Database connection verifies coordinates columns on package_place table', async () => {
  const { rows } = await db.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'package_place' AND column_name IN (
      'latitude', 'longitude', 'geom'
    )
  `);

  const foundCols = rows.map(r => r.column_name);
  assert.equal(foundCols.length, 3, 'All 3 spatial columns (latitude, longitude, geom) must exist on package_place.');
});

test('Enhancements: packageController writes and reads package_place coordinates', () => {
  const code = fs.readFileSync(PACKAGE_CONTROLLER, 'utf-8');

  assert.ok(
    code.includes('COALESCE(pp.latitude, pl.latitude) AS latitude') &&
    code.includes('COALESCE(pp.longitude, pl.longitude) AS longitude'),
    'packageController must select coordinates with package_place taking precedence over place.'
  );

  assert.ok(
    code.includes('dest.latitude') && code.includes('dest.longitude'),
    'packageController must insert dest.latitude and dest.longitude into package_place.'
  );
});

test('Enhancements: Migration 006 views, functions, triggers and constraints synchronicity in schema and init files', () => {
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const initContent = fs.readFileSync(INIT_FILE, 'utf-8');

  const requiredObjects = [
    'v_booking_details',
    'v_booking_financial_summary',
    'v_package_catalog',
    'fn_get_available_vehicles',
    'fn_get_places_nearby',
    'chk_booking_dates_valid',
    'idx_booking_pending',
    'idx_payment_approved',
    'trg_booking_milestones',
    'trg_inquiry_on_reply',
    'booking_status_history',
    'trg_booking_status_history',
  ];

  for (const obj of requiredObjects) {
    assert.ok(
      schemaContent.includes(obj),
      `schema.sql must contain '${obj}' from migration 006.`
    );
    assert.ok(
      initContent.includes(obj),
      `init.sql must contain '${obj}' from migration 006.`
    );
  }
});

test('Enhancements: Database connection executes canonical views cleanly', async () => {
  const { rows: bookingRows } = await db.query('SELECT * FROM v_booking_details LIMIT 5');
  assert.ok(Array.isArray(bookingRows), 'v_booking_details must return an array');

  const { rows: finRows } = await db.query('SELECT * FROM v_booking_financial_summary LIMIT 5');
  assert.ok(Array.isArray(finRows), 'v_booking_financial_summary must return an array');
  if (finRows.length > 0) {
    assert.ok('total_price' in finRows[0], 'v_booking_financial_summary must have total_price column');
    assert.ok('outstanding_balance' in finRows[0], 'v_booking_financial_summary must have outstanding_balance column');
    assert.ok('payment_status' in finRows[0], 'v_booking_financial_summary must have payment_status column');
  }

  const { rows: pkgRows } = await db.query('SELECT * FROM v_package_catalog LIMIT 5');
  assert.ok(Array.isArray(pkgRows), 'v_package_catalog must return an array');
  if (pkgRows.length > 0) {
    assert.ok('destinations' in pkgRows[0], 'v_package_catalog must have destinations JSONB column');
  }
});

test('Enhancements: Database connection executes intelligent functions', async () => {
  const { rows: vehicleRows } = await db.query(
    'SELECT * FROM fn_get_available_vehicles(NULL, $1::date, $2::date) LIMIT 5',
    ['2026-11-01', '2026-11-05']
  );
  assert.ok(Array.isArray(vehicleRows), 'fn_get_available_vehicles must return an array');

  const { rows: nearbyRows } = await db.query(
    'SELECT * FROM fn_get_places_nearby($1, $2, $3) LIMIT 5',
    [6.9271, 79.8612, 50]
  );
  assert.ok(Array.isArray(nearbyRows), 'fn_get_places_nearby must return an array');
  if (nearbyRows.length > 0) {
    assert.ok('distance_km' in nearbyRows[0], 'fn_get_places_nearby must return distance_km');
  }
});

test('Enhancements: Modernized controllers utilize canonical views and functions', () => {
  const bookingCode = fs.readFileSync(BOOKING_CONTROLLER, 'utf-8');
  assert.ok(
    bookingCode.includes('v_booking_details'),
    'bookingController must query v_booking_details.'
  );
  assert.ok(
    bookingCode.includes('v_booking_financial_summary'),
    'bookingController must query v_booking_financial_summary.'
  );

  const packageCode = fs.readFileSync(PACKAGE_CONTROLLER, 'utf-8');
  assert.ok(
    packageCode.includes('v_package_catalog'),
    'packageController must query v_package_catalog.'
  );
  assert.ok(
    packageCode.includes('fn_get_places_nearby'),
    'packageController must call fn_get_places_nearby.'
  );

  const paymentCode = fs.readFileSync(PAYMENT_CONTROLLER, 'utf-8');
  assert.ok(
    paymentCode.includes('v_booking_financial_summary'),
    'paymentController must query v_booking_financial_summary.'
  );

  const vehicleCode = fs.readFileSync(path.join(BACKEND_DIR, 'controllers', 'vehicleController.js'), 'utf-8');
  assert.ok(
    vehicleCode.includes('fn_get_available_vehicles'),
    'vehicleController must call fn_get_available_vehicles.'
  );

  const connCode = fs.readFileSync(path.join(BACKEND_DIR, 'db', 'connection.js'), 'utf-8');
  assert.ok(
    connCode.includes('statement_timeout: 5000'),
    'connection.js must set statement_timeout: 5000.'
  );
});

test.after(async () => {
  await db.end();
});


