const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const BACKEND_DIR = path.resolve(__dirname, '..');
const SCHEMA_FILE = path.join(BACKEND_DIR, 'db', 'schema.sql');
const SERVER_FILE = path.join(BACKEND_DIR, 'server.js');
const BOOKING_CONTROLLER = path.join(BACKEND_DIR, 'controllers', 'bookingController.js');
const PACKAGE_CONTROLLER = path.join(BACKEND_DIR, 'controllers', 'packageController.js');

test('Schema Regression: Dropped tables must not exist in schema.sql', (t) => {
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');

  const droppedTables = [
    'gallery',
    'gallery_location',
    'guid',
    'booking_custom_cities',
    'booking_custom_activities',
    'booking_custom_itinerary',
    'custom_activity',
  ];

  for (const tableName of droppedTables) {
    const createTableRegex = new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?\`?${tableName}\`?\\s*\\(`, 'i');
    assert.ok(
      !createTableRegex.test(schemaContent),
      `Table '${tableName}' was found in schema.sql but should have been dropped.`
    );
  }
});

test('Schema Regression: package table must not reference guid foreign key', (t) => {
  const schemaContent = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  assert.ok(
    !/guid_id/i.test(schemaContent),
    "Column 'guid_id' should not exist anywhere in schema.sql."
  );
});

test('Schema Regression: booking controllers must not query dropped custom tables or invalid luggage columns', (t) => {
  const bookingContent = fs.readFileSync(BOOKING_CONTROLLER, 'utf-8');

  // Must not query dropped tables
  const obsoleteEntities = [
    'booking_custom_cities',
    'booking_custom_activities',
    'booking_custom_itinerary',
    'custom_activity',
  ];

  for (const entity of obsoleteEntities) {
    assert.ok(
      !bookingContent.includes(entity),
      `bookingController.js should not contain references to '${entity}'.`
    );
  }

  // Must not insert into non-existent luggage columns
  assert.ok(
    !/luggage_custom_count/i.test(bookingContent),
    "bookingController.js should not attempt to write to non-existent 'luggage_custom_count' column."
  );
  assert.ok(
    !/luggage_custom_desc/i.test(bookingContent),
    "bookingController.js should not attempt to write to non-existent 'luggage_custom_desc' column."
  );
});

test('Schema Regression: package controller must not query guid table', (t) => {
  const packageContent = fs.readFileSync(PACKAGE_CONTROLLER, 'utf-8');

  assert.ok(
    !/\bFROM\s+guid\b/i.test(packageContent),
    "packageController.js should not query 'FROM guid'."
  );
  assert.ok(
    !/\bJOIN\s+guid\b/i.test(packageContent),
    "packageController.js should not join with 'guid'."
  );
  assert.ok(
    !/\bINSERT\s+INTO\s+guid\b/i.test(packageContent),
    "packageController.js should not insert into 'guid'."
  );
  assert.ok(
    !/\bUPDATE\s+guid\b/i.test(packageContent),
    "packageController.js should not update 'guid'."
  );
  assert.ok(
    !/\bDELETE\s+FROM\s+guid\b/i.test(packageContent),
    "packageController.js should not delete from 'guid'."
  );
});

test('Schema Regression: server.js must not mount obsolete routes and deleted route files must not exist', (t) => {
  const serverContent = fs.readFileSync(SERVER_FILE, 'utf-8');

  const obsoleteRoutes = [
    'galleryRoutes',
    'locationRoutes',
    'activityRoutes',
  ];

  for (const route of obsoleteRoutes) {
    assert.ok(
      !serverContent.includes(route),
      `server.js should not import or mount '${route}'.`
    );
  }

  const obsoleteFiles = [
    path.join(BACKEND_DIR, 'routes', 'galleryRoutes.js'),
    path.join(BACKEND_DIR, 'routes', 'locationRoutes.js'),
    path.join(BACKEND_DIR, 'routes', 'activityRoutes.js'),
    path.join(BACKEND_DIR, 'controllers', 'galleryController.js'),
    path.join(BACKEND_DIR, 'controllers', 'locationController.js'),
    path.join(BACKEND_DIR, 'controllers', 'activityController.js'),
  ];

  for (const file of obsoleteFiles) {
    assert.ok(
      !fs.existsSync(file),
      `File '${file}' should have been deleted.`
    );
  }
});

const CONTROLLERS_DIR = path.join(BACKEND_DIR, 'controllers');
const DB_CONNECTION = path.join(BACKEND_DIR, 'db', 'connection.js');

const listJsFiles = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJsFiles(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });

test('PostgreSQL Migration: backend must not depend on mysql2', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(BACKEND_DIR, 'package.json'), 'utf-8'));
  assert.ok(!packageJson.dependencies.mysql2, 'mysql2 dependency must be removed.');
  assert.ok(packageJson.dependencies.pg, 'pg dependency must be present.');
});

test('PostgreSQL Migration: source files must not require mysql2', () => {
  const sourceFiles = [
    ...listJsFiles(CONTROLLERS_DIR),
    ...listJsFiles(path.join(BACKEND_DIR, 'db')),
    ...listJsFiles(path.join(BACKEND_DIR, 'routes')),
    ...listJsFiles(path.join(BACKEND_DIR, 'middleware')),
    path.join(BACKEND_DIR, 'server.js'),
  ];

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    assert.ok(
      !/require\(['"]mysql2[^'"]*['"]\)/.test(content),
      `${path.relative(BACKEND_DIR, file)} must not require mysql2.`
    );
  }
});

test('PostgreSQL Migration: connection.js must use pg Pool', () => {
  const content = fs.readFileSync(DB_CONNECTION, 'utf-8');
  assert.ok(/require\(['"]pg['"]\)/.test(content), "connection.js must require 'pg'.");
  assert.ok(/new\s+Pool\s*\(/.test(content), 'connection.js must create a pg Pool.');
});

test('PostgreSQL Migration: controllers must not use MySQL-only syntax', () => {
  const sourceFiles = listJsFiles(CONTROLLERS_DIR);
  const mysqlOnlyPatterns = [
    { pattern: /\.execute\s*\(/, label: 'db.execute() (MySQL driver API)' },
    { pattern: /\.getConnection\s*\(/, label: 'getConnection() (MySQL pool API)' },
    { pattern: /beginTransaction\s*\(/, label: 'beginTransaction() (MySQL API)' },
    { pattern: /insertId/, label: 'insertId (MySQL result field)' },
    { pattern: /affectedRows/, label: 'affectedRows (MySQL result field)' },
    { pattern: /ER_DUP_ENTRY/, label: 'ER_DUP_ENTRY (MySQL error code)' },
    { pattern: /ER_ROW_IS_REFERENCED_2/, label: 'ER_ROW_IS_REFERENCED_2 (MySQL error code)' },
    { pattern: /\bCURDATE\s*\(/i, label: 'CURDATE() (MySQL function)' },
    { pattern: /\bMONTH\s*\(/i, label: 'MONTH() (MySQL function)' },
    { pattern: /\bYEAR\s*\(/i, label: 'YEAR() (MySQL function)' },
    { pattern: /\bFIELD\s*\(/i, label: 'FIELD() (MySQL function)' },
    { pattern: /SHOW\s+COLUMNS/i, label: 'SHOW COLUMNS (MySQL syntax)' },
  ];

  for (const file of sourceFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const { pattern, label } of mysqlOnlyPatterns) {
      assert.ok(
        !pattern.test(content),
        `${path.relative(BACKEND_DIR, file)} must not use ${label}.`
      );
    }
  }
});
