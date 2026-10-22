const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');
const { verifyToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Get all cities (public)
router.get('/', cityController.getAllCities);

// Add a new city (admin only)
router.post('/', verifyToken, adminOnly, cityController.addCity);

// Delete a city (admin only)
router.delete('/:id', verifyToken, adminOnly, cityController.deleteCity);

module.exports = router;
