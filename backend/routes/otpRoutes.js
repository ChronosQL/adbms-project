const express    = require("express");
const router     = express.Router();
const { sendOtp, verifyOtp } = require("../controllers/otpController");

// No auth middleware — user may not be logged in yet during booking flow
router.post("/send",   sendOtp);
router.post("/verify", verifyOtp);

module.exports = router;
