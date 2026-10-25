/**
 * Cron Job Scheduler
 * Ceylon Best Tours (TechNova)
 * Zero-dependency robust in-process scheduler for periodic maintenance and state transitions.
 */

const {
  runTourLifecycleJob,
  runQuoteExpirationJob,
  runPaymentAuditJob,
  runMaterializedViewRefreshJob,
  runDbMaintenanceJob,
} = require('./jobs');

const intervals = [];

/**
 * Schedule a job to run immediately and then at a regular interval.
 * Timers are unref'd so they do not hold test runners open.
 */
const scheduleInterval = (name, jobFn, intervalMs, runImmediately = false) => {
  const wrapped = async () => {
    try {
      await jobFn();
    } catch (err) {
      console.error(`[Scheduler] Error in job "${name}":`, err.message || err);
    }
  };

  if (runImmediately) {
    wrapped();
  }

  const timer = setInterval(wrapped, intervalMs);
  if (timer.unref) timer.unref();
  intervals.push(timer);
};

const startCronScheduler = () => {
  if (process.env.NODE_ENV === 'test') {
    return; // Don't run background timers during unit tests
  }

  console.log('[Scheduler] Initializing Ceylon Best Tours background scheduled jobs...');

  // 1. Tour Lifecycle: Check every hour (3,600,000 ms) and on boot
  scheduleInterval('TourLifecycle', runTourLifecycleJob, 60 * 60 * 1000, true);

  // 2. Stale Quote Expiration: Check every 6 hours (21,600,000 ms)
  scheduleInterval('QuoteExpiration', () => runQuoteExpirationJob(7), 6 * 60 * 60 * 1000, true);

  // 3. Pending Payment Slip Audit: Check every 12 hours (43,200,000 ms)
  scheduleInterval('PaymentAudit', () => runPaymentAuditJob(48), 12 * 60 * 60 * 1000, false);

  // 4. Analytics Materialized View Refresh: Hourly (3,600,000 ms)
  scheduleInterval('AnalyticsRefresh', runMaterializedViewRefreshJob, 60 * 60 * 1000, true);

  // 5. Database Health Maintenance: Daily (86,400,000 ms)
  scheduleInterval('DbMaintenance', runDbMaintenanceJob, 24 * 60 * 60 * 1000, false);

  console.log('[Scheduler] Background jobs successfully scheduled.');
};

const stopCronScheduler = () => {
  while (intervals.length > 0) {
    const timer = intervals.pop();
    clearInterval(timer);
  }
  console.log('[Scheduler] All background jobs stopped.');
};

module.exports = {
  startCronScheduler,
  stopCronScheduler,
};
