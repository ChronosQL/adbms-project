const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { parsePagination } = require('../utils/paginate');
const pool = require('../db/connection');

// ── 1. Unit Tests for parsePagination Utility ──────────────────────────────
test('Pagination Utility: handles defaults and boundary inputs', () => {
  const defaults = parsePagination({}, 10, 50);
  assert.equal(defaults.page, 1);
  assert.equal(defaults.limit, 10);
  assert.equal(defaults.offset, 0);

  const custom = parsePagination({ page: '3', limit: '15' }, 10, 50);
  assert.equal(custom.page, 3);
  assert.equal(custom.limit, 15);
  assert.equal(custom.offset, 30);

  // Negative and invalid values fallback safely
  const invalid = parsePagination({ page: '-5', limit: 'abc' }, 12, 50);
  assert.equal(invalid.page, 1);
  assert.equal(invalid.limit, 12);
  assert.equal(invalid.offset, 0);

  // Exceeds max limit gets capped
  const capped = parsePagination({ page: '1', limit: '500' }, 10, 50);
  assert.equal(capped.limit, 50);
});

test('Pagination Utility: correctly builds pagination metadata', () => {
  const { buildPagination } = parsePagination({ page: 2, limit: 10 });
  const meta = buildPagination(25);

  assert.equal(meta.page, 2);
  assert.equal(meta.limit, 10);
  assert.equal(meta.total, 25);
  assert.equal(meta.totalPages, 3);
  assert.equal(meta.hasNextPage, true);
  assert.equal(meta.hasPrevPage, true);

  // Last page check
  const lastPageMeta = parsePagination({ page: 3, limit: 10 }).buildPagination(25);
  assert.equal(lastPageMeta.hasNextPage, false);
  assert.equal(lastPageMeta.hasPrevPage, true);

  // Empty data check
  const emptyMeta = parsePagination({ page: 1, limit: 10 }).buildPagination(0);
  assert.equal(emptyMeta.total, 0);
  assert.equal(emptyMeta.totalPages, 1);
  assert.equal(emptyMeta.hasNextPage, false);
  assert.equal(emptyMeta.hasPrevPage, false);
});

// ── 2. Database Integration Tests ──────────────────────────────────────────
test('PostgreSQL fn_get_filtered_reviews: pagination with COUNT(*) OVER()', async () => {
  // Page 1: limit 5, offset 0
  const page1Res = await pool.query(
    'SELECT * FROM fn_get_filtered_reviews(NULL, NULL, $1, NULL, $2, $3)',
    ['newest', 5, 0]
  );
  assert.equal(page1Res.rows.length, 5, 'Page 1 should return exactly 5 reviews');
  const total = page1Res.rows[0].total_count;
  assert.ok(total > 5, 'Total matching reviews should exceed page limit');

  // Page 2: limit 5, offset 5
  const page2Res = await pool.query(
    'SELECT * FROM fn_get_filtered_reviews(NULL, NULL, $1, NULL, $2, $3)',
    ['newest', 5, 5]
  );
  assert.equal(page2Res.rows.length, 5, 'Page 2 should return exactly 5 reviews');
  assert.equal(page2Res.rows[0].total_count, total, 'total_count must remain constant across pages');

  // Verify Page 1 items are distinct from Page 2 items
  const page1Ids = page1Res.rows.map(r => r.review_id);
  const page2Ids = page2Res.rows.map(r => r.review_id);
  const intersection = page1Ids.filter(id => page2Ids.includes(id));
  assert.equal(intersection.length, 0, 'Page 1 and Page 2 must not contain duplicate review IDs');
});

test('PostgreSQL fn_get_filtered_reviews: star filter with pagination', async () => {
  const filteredRes = await pool.query(
    'SELECT * FROM fn_get_filtered_reviews($1, NULL, $2, NULL, $3, $4)',
    [5, 'newest', 4, 0]
  );
  assert.equal(filteredRes.rows.length, 4, 'Should return 4 reviews for 5-star filter');
  for (const row of filteredRes.rows) {
    assert.equal(row.rating, 5, 'Every row must have rating = 5');
  }
  assert.equal(filteredRes.rows[0].total_count, 374, 'Total 5-star reviews must equal 374');
});

// ── 3. Schema File Integrity Tests ─────────────────────────────────────────
test('Schema Files: schema.sql and init.sql must contain paginated fn_get_filtered_reviews', () => {
  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  const initPath = path.resolve(__dirname, '../db/init.sql');

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const initContent = fs.readFileSync(initPath, 'utf8');

  for (const [name, content] of [['schema.sql', schemaContent], ['init.sql', initContent]]) {
    assert.ok(
      content.includes('p_limit      INTEGER DEFAULT NULL') || content.includes('p_limit INTEGER DEFAULT NULL'),
      `${name} must define p_limit parameter in fn_get_filtered_reviews`
    );
    assert.ok(
      content.includes('p_offset     INTEGER DEFAULT 0') || content.includes('p_offset INTEGER DEFAULT 0'),
      `${name} must define p_offset parameter in fn_get_filtered_reviews`
    );
    assert.ok(
      content.includes('COUNT(*) OVER()::integer AS total_count'),
      `${name} must use COUNT(*) OVER()::integer AS total_count`
    );
  }
});

// Close database pool when tests finish
test.after(async () => {
  await pool.end();
});
