// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/logout', authController.logout);


router.post('/user-register', authController.userRegister);
router.post('/verify-otp', authController.verifyOTP);
router.post('/verify-otp-password', authController.verifyOTPpassword);
router.post('/user-login', authController.userLogin);
router.post('/user-logout', authController.userLogout);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
