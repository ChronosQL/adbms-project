const express = require('express');
const router = express.Router();
const upload = require('../middleware/packageUploadMiddleware');
const pkgCtrl = require('../controllers/packageController');

// Admin create package - accept one packageImage and multiple destImages
router.post('/admin/packages', upload.fields([
  { name: 'packageImage', maxCount: 1 },
  { name: 'destImages', maxCount: 20 }
]), pkgCtrl.createPackage);

// Admin update package - accept one packageImage and multiple destImages
router.put('/admin/packages/:id', upload.fields([
  { name: 'packageImage', maxCount: 1 },
  { name: 'destImages', maxCount: 20 }
]), pkgCtrl.updatePackage);

// Admin package availability calendar
router.get('/admin/packages/:id/availability', pkgCtrl.getPackageAvailability);
router.put('/admin/packages/:id/availability', pkgCtrl.updatePackageAvailability);

// Admin delete package
router.delete('/admin/packages/:id', pkgCtrl.deletePackage);

// Admin list packages for table
router.get('/admin/packages', pkgCtrl.listAdminPackages);

// Public list
router.get('/', pkgCtrl.listPublicPackages);

// Recommendations for a package
router.get('/:id/recommendations', pkgCtrl.getRecommendations);

// Public package detail
router.get('/:id', pkgCtrl.getPackageDetail);

module.exports = router;
