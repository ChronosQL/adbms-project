const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const reportCtrl = require('../controllers/reportController');

router.get('/business-overview/pdf', verifyToken, adminOnly, reportCtrl.generateBusinessOverviewPdf);
router.get('/earnings/pdf', verifyToken, adminOnly, reportCtrl.generateEarningsReportPdf);
router.get('/booking-analysis/pdf', verifyToken, adminOnly, reportCtrl.generateBookingAnalysisPdf);
router.get('/vehicle-analysis/pdf', verifyToken, adminOnly, reportCtrl.generateVehicleAnalysisPdf);
router.get('/customer-review-analysis/pdf', verifyToken, adminOnly, reportCtrl.generateCustomerReviewAnalysisPdf);

router.get('/business-overview/data', verifyToken, adminOnly, reportCtrl.getBusinessOverviewJSON);
router.get('/earnings/data', verifyToken, adminOnly, reportCtrl.getEarningsReportJSON);
router.get('/booking-analysis/data', verifyToken, adminOnly, reportCtrl.getBookingAnalysisJSON);
router.get('/vehicle-analysis/data', verifyToken, adminOnly, reportCtrl.getVehicleAnalysisJSON);
router.get('/customer-review-analysis/data', verifyToken, adminOnly, reportCtrl.getCustomerReviewAnalysisJSON);

module.exports = router;