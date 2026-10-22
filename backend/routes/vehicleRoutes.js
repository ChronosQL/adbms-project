const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const categoryUpload = require('../middleware/categoryUploadMiddleware');
const vehicleUpload = require('../middleware/vehicleUploadMiddleware');
const vehicleCtrl = require('../controllers/vehicleController');

router.get('/categories', vehicleCtrl.listCategories);
router.get('/categories/:id', vehicleCtrl.getCategoryById);
router.post('/categories', verifyToken, adminOnly, categoryUpload.array('images', 5), vehicleCtrl.createCategory);
router.put('/categories/:id', verifyToken, adminOnly, categoryUpload.array('images', 5), vehicleCtrl.updateCategory);
router.delete('/categories/:id', verifyToken, adminOnly, vehicleCtrl.deleteCategory);

router.get('/stats', vehicleCtrl.getStats);
router.get('/category/:categoryId', vehicleCtrl.listVehiclesByCategory);
router.get('/', vehicleCtrl.listVehicles);
router.get('/:id', vehicleCtrl.getVehicleById);
router.post('/', verifyToken, adminOnly, vehicleUpload.array('images', 10), vehicleCtrl.createVehicle);
router.put('/:id', verifyToken, adminOnly, vehicleUpload.array('images', 10), vehicleCtrl.updateVehicle);
router.delete('/:id', verifyToken, adminOnly, vehicleCtrl.deleteVehicle);

module.exports = router;