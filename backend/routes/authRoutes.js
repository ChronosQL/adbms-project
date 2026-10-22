const express = require('express');
const router = express.Router();
const { login, register, getMe, changePassword, updateProfile, googleAuth } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/google', googleAuth);
router.post('/register', register);
router.get('/me', verifyToken, getMe); // validate stored token on app load
router.put('/password', verifyToken, changePassword);
router.put('/profile', verifyToken, updateProfile);
 
module.exports = router;
