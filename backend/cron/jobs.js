/**
 * Background Cron Job Definitions
 * Ceylon Best Tours (TechNova)
 * Direct-SQL invocation of PostgreSQL maintenance and automated lifecycle functions.
 */

const db = require('../db/connection');

/**
 * 1. Advance Tour Lifecycle
 * Progresses CONFIRMED -> TOUR_STARTED (when start_date <= CURRENT_DATE)
 * and TOUR_STARTED -> COMPLETED (when end_date < CURRENT_DATE).
 */
const runTourLifecycleJob = async () => {
  try {
    const { rows } = await db.query('SELECT * FROM fn_advance_tour_lifecycle()');
    const result = rows[0] || { started_count: 0, completed_count: 0 };
    console.log(`[Cron:TourLifecycle] Advanced ${result.started_count} tours to TOUR_STARTED, ${result.completed_count} tours to COMPLETED.`);
    return result;
  } catch (err) {
    console.error('[Cron:TourLifecycle] Execution failed:', err);
    throw err;
  }
};

/**
 * 2. Expire Stale Quotes & Free Held Inventory
 * Sets booking_status = 'CANCELLED' on unaccepted quotes older than threshold (default: 7 days)
 * or when start_date is within 1 day.
 */
const runQuoteExpirationJob = async (expiryDays = 7) => {
  try {
    const { rows } = await db.query('SELECT fn_expire_stale_quotes($1)', [expiryDays]);
    const expiredCount = Number(rows[0]?.fn_expire_stale_quotes || 0);
    console.log(`[Cron:QuoteExpiration] Expired ${expiredCount} stale quotes older than ${expiryDays} days.`);
    return { expired_count: expiredCount };
  } catch (err) {
    console.error('[Cron:QuoteExpiration] Execution failed:', err);
    throw err;
  }
};

/**
 * 3. Audit Pending Payment Slips
 * Detects unapproved payment slips older than threshold (default: 48 hours).
 */
const runPaymentAuditJob = async (thresholdHours = 48) => {
  try {
    const { rows } = await db.query('SELECT * FROM fn_audit_pending_payments($1)', [thresholdHours]);
    if (rows.length > 0) {
      console.warn(`[Cron:PaymentAudit] Detected ${rows.length} unverified payment slip(s) awaiting verification (> ${thresholdHours}h):`, rows.map((r) => `Booking #${r.booking_id} (LKR ${r.amount})`));
    } else {
      console.log(`[Cron:PaymentAudit] No stale unverified payments detected (> ${thresholdHours}h).`);
    }
    return rows;
  } catch (err) {
    console.error('[Cron:PaymentAudit] Execution failed:', err);
    throw err;
  }
};

/**
 * 4. Refresh Reporting Materialized Views
 * Concurrently refreshes mv_monthly_financial_metrics.
 */
const runMaterializedViewRefreshJob = async () => {
  try {
    await db.query('SELECT fn_refresh_report_materialized_views()');
    console.log('[Cron:AnalyticsRefresh] Successfully refreshed mv_monthly_financial_metrics.');
    return { success: true };
  } catch (err) {
    console.error('[Cron:AnalyticsRefresh] Execution failed:', err);
    throw err;
  }
};

/**
 * 5. Database Health & Statistics Maintenance
 * Runs targeted ANALYZE across high-traffic transactional tables.
 */
const runDbMaintenanceJob = async () => {
  try {
    const { rows } = await db.query('SELECT fn_run_db_maintenance()');
    const message = rows[0]?.fn_run_db_maintenance || 'Maintenance finished.';
    console.log(`[Cron:DbMaintenance] ${message}`);
    return { message };
  } catch (err) {
    console.error('[Cron:DbMaintenance] Execution failed:', err);
    throw err;
  }
};

module.exports = {
  runTourLifecycleJob,
  runQuoteExpirationJob,
  runPaymentAuditJob,
  runMaterializedViewRefreshJob,
  runDbMaintenanceJob,
};
