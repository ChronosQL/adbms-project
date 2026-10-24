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

  assert.ok(
    code.includes('pickup_lat') && code.includes('dropoff_lng'),
    'createP2PBooking must insert pickup_lat and dropoff_lng into booking.'
  );

  assert.ok(
    code.includes('pickupLat:') && code.includes('dropoffLng:'),
    'mapBooking must map pickupLat and dropoffLng fields.'
  );
});

test('Enhancements: paymentController enforces user ownership and balance guard', () => {
  const code = fs.readFileSync(PAYMENT_CONTROLLER, 'utf-8');

  assert.ok(
    code.includes('booking.user_id !== req.user.id'),
    'uploadPaymentSlip must verify customer ownership.'
  );

  assert.ok(
    code.includes('exceeds the remaining balance') || code.includes('exceeds the outstanding balance'),
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

test.after(async () => {
  await db.end();
});

