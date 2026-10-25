const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  runTourLifecycleJob,
  runQuoteExpirationJob,
  runPaymentAuditJob,
  runMaterializedViewRefreshJob,
  runDbMaintenanceJob,
} = require('../cron/jobs');

router.post('/run-job/:jobName', verifyToken, adminOnly, async (req, res) => {
  const { jobName } = req.params;

  try {
    let result;
    switch (jobName) {
      case 'tour-lifecycle':
        result = await runTourLifecycleJob();
        break;
      case 'quote-expiration':
        result = await runQuoteExpirationJob(Number(req.query.days || 7));
        break;
      case 'payment-audit':
        result = await runPaymentAuditJob(Number(req.query.hours || 48));
        break;
      case 'refresh-analytics':
        result = await runMaterializedViewRefreshJob();
        break;
      case 'db-maintenance':
        result = await runDbMaintenanceJob();
        break;
      default:
        return res.status(400).json({ message: `Unknown job name: '${jobName}'.` });
    }

    res.json({ message: `Job '${jobName}' completed successfully.`, result });
  } catch (err) {
    console.error(`Error running maintenance job '${jobName}':`, err);
    res.status(500).json({ message: `Failed to execute job '${jobName}'.`, error: err.message });
  }
});

module.exports = router;
