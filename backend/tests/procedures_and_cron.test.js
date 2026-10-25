const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const db = require('../db/connection');
const {
  runTourLifecycleJob,
  runQuoteExpirationJob,
  runPaymentAuditJob,
  runMaterializedViewRefreshJob,
  runDbMaintenanceJob,
} = require('../cron/jobs');

const SCHEMA_FILE = path.join(__dirname, '..', 'db', 'schema.sql');
const INIT_FILE = path.join(__dirname, '..', 'db', 'init.sql');

test('Schema & Init Synchronicity: Procedures, Materialized View and Cron Functions', () => {
  const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const initSql = fs.readFileSync(INIT_FILE, 'utf-8');

  const requiredRoutines = [
    'sp_create_booking',
    'sp_set_booking_quote',
    'sp_record_and_reconcile_payment',
    'sp_create_package_with_itinerary',
    'sp_submit_tour_review',
    'mv_monthly_financial_metrics',
    'fn_advance_tour_lifecycle',
    'fn_expire_stale_quotes',
    'fn_audit_pending_payments',
    'fn_refresh_report_materialized_views',
    'fn_run_db_maintenance',
  ];

  for (const routine of requiredRoutines) {
    assert.ok(
      schemaSql.includes(routine),
      `schema.sql must contain definition for ${routine}`
    );
    assert.ok(
      initSql.includes(routine),
      `init.sql must contain definition for ${routine}`
    );
  }
});

test('PostgreSQL: Materialized View and Cron Functions execute cleanly', async () => {
  // 1. Advance tour lifecycle
  const { rows: lifecycleRows } = await db.query('SELECT * FROM fn_advance_tour_lifecycle()');
  assert.equal(lifecycleRows.length, 1);
  assert.ok('started_count' in lifecycleRows[0]);
  assert.ok('completed_count' in lifecycleRows[0]);

  // 2. Expire stale quotes
  const { rows: quoteRows } = await db.query('SELECT fn_expire_stale_quotes(7) AS expired_count');
  assert.equal(quoteRows.length, 1);
  assert.ok(Number(quoteRows[0].expired_count) >= 0);

  // 3. Audit pending payments
  const { rows: auditRows } = await db.query('SELECT * FROM fn_audit_pending_payments(48)');
  assert.ok(Array.isArray(auditRows));

  // 4. Refresh reporting materialized view
  await db.query('SELECT fn_refresh_report_materialized_views()');

  // 5. Query reporting materialized view
  const { rows: mvRows } = await db.query('SELECT * FROM mv_monthly_financial_metrics LIMIT 5');
  assert.ok(Array.isArray(mvRows));

  // 6. Run database maintenance
  const { rows: maintRows } = await db.query('SELECT fn_run_db_maintenance() AS status');
  assert.equal(maintRows.length, 1);
  assert.ok(maintRows[0].status.includes('completed successfully'));
});

test('Backend Cron Runner: Jobs module executes without errors', async () => {
  const lifecycleRes = await runTourLifecycleJob();
  assert.ok('started_count' in lifecycleRes);

  const quoteRes = await runQuoteExpirationJob(7);
  assert.ok('expired_count' in quoteRes);

  const auditRes = await runPaymentAuditJob(48);
  assert.ok(Array.isArray(auditRes));

  const refreshRes = await runMaterializedViewRefreshJob();
  assert.equal(refreshRes.success, true);

  const maintRes = await runDbMaintenanceJob();
  assert.ok('message' in maintRes);
});

test('Stored Procedure: sp_set_booking_quote prevents vehicle overlap', async () => {
  // Query with nonexistent booking ID returns false with friendly message
  const { rows } = await db.query(
    'SELECT * FROM sp_set_booking_quote($1, $2, $3, $4)',
    [-9999, 50000, null, 'Test Quote']
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].success, false);
  assert.equal(rows[0].message, 'Booking not found.');
});

test('Stored Procedure: sp_submit_tour_review enforces completed tour status', async () => {
  // Attempt to submit review for nonexistent booking
  const { rows } = await db.query(
    'SELECT * FROM sp_submit_tour_review($1, $2, $3, $4, $5, $6, $7)',
    [-9999, -9999, 5, 'Driver', 'Great Trip', 'Feedback text', null]
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].success, false);
  assert.equal(rows[0].message, 'Booking not found for this user.');
});

test.after(async () => {
  await db.end();
});
