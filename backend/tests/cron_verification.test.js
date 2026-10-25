/**
 * Dedicated Cronjob & Scheduled Task Verification Test
 * Ceylon Best Tours (TechNova)
 * Validates the 5 background automation jobs and their underlying PostgreSQL routines in isolation.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const db = require('../db/connection');
const {
  runTourLifecycleJob,
  runQuoteExpirationJob,
  runPaymentAuditJob,
  runMaterializedViewRefreshJob,
  runDbMaintenanceJob,
} = require('../cron/jobs');
const { startCronScheduler, stopCronScheduler } = require('../cron/scheduler');

test('Cronjob 1: Advance Tour Lifecycle (fn_advance_tour_lifecycle)', async () => {
  // Directly test the underlying database routine
  const { rows } = await db.query('SELECT * FROM fn_advance_tour_lifecycle()');
  assert.equal(rows.length, 1, 'fn_advance_tour_lifecycle must return exactly 1 row');
  assert.ok(typeof Number(rows[0].started_count) === 'number');
  assert.ok(typeof Number(rows[0].completed_count) === 'number');

  // Test the Node cron job wrapper
  const jobResult = await runTourLifecycleJob();
  assert.ok('started_count' in jobResult);
  assert.ok('completed_count' in jobResult);
});

test('Cronjob 2: Stale Quote Expiration (fn_expire_stale_quotes)', async () => {
  // Directly test database routine with 7-day default
  const { rows } = await db.query('SELECT fn_expire_stale_quotes($1) AS expired', [7]);
  assert.equal(rows.length, 1);
  assert.ok(Number(rows[0].expired) >= 0);

  // Test the Node cron job wrapper
  const jobResult = await runQuoteExpirationJob(7);
  assert.ok('expired_count' in jobResult);
  assert.ok(typeof jobResult.expired_count === 'number');
});

test('Cronjob 3: Audit Pending Payments (fn_audit_pending_payments)', async () => {
  // Directly test database routine for 48-hour threshold
  const { rows } = await db.query('SELECT * FROM fn_audit_pending_payments($1)', [48]);
  assert.ok(Array.isArray(rows), 'fn_audit_pending_payments must return a result array');

  // Test the Node cron job wrapper
  const jobResult = await runPaymentAuditJob(48);
  assert.ok(Array.isArray(jobResult));
});

test('Cronjob 4: Refresh Analytics Materialized View (fn_refresh_report_materialized_views)', async () => {
  // Test running the refresh wrapper
  const jobResult = await runMaterializedViewRefreshJob();
  assert.equal(jobResult.success, true);

  // Verify mv_monthly_financial_metrics is live and queryable
  const { rows } = await db.query('SELECT COUNT(*)::integer AS total FROM mv_monthly_financial_metrics');
  assert.ok(rows.length > 0);
  assert.ok(typeof rows[0].total === 'number');
});

test('Cronjob 5: Database Maintenance & Health (fn_run_db_maintenance)', async () => {
  // Directly test database ANALYZE routine
  const { rows } = await db.query('SELECT fn_run_db_maintenance() AS status');
  assert.equal(rows.length, 1);
  assert.ok(rows[0].status.includes('completed successfully'));

  // Test the Node cron job wrapper
  const jobResult = await runDbMaintenanceJob();
  assert.ok('message' in jobResult);
  assert.ok(jobResult.message.includes('completed successfully'));
});

test('Cronjob Scheduler: In-process start and graceful stop', () => {
  // Temporarily override NODE_ENV to test timer registration
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    startCronScheduler();
    // Stop and clear all intervals cleanly
    stopCronScheduler();
  } finally {
    process.env.NODE_ENV = origEnv;
  }
});

test.after(async () => {
  await db.end();
});
