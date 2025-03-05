// controllers/authController.js
const User = require('../models/User'); 
const Cart  = require('../models/Cart'); 
const sendEmail = require('../utils/nodemailer');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require("bcryptjs");


exports.userLogin = async (req, res) => {
    try {
        const { email, password, guestCart } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required!' });
        }

        // Parse guestCart from JSON string to JavaScript array
        let parsedGuestCart = [];
        if (guestCart) {
            try {
                parsedGuestCart = JSON.parse(guestCart);
            } catch (error) {
                console.error("Error parsing guestCart:", error);
                return res.status(400).json({ message: "Invalid guest cart data" });
            }
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found!' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials!' });
        }

        if (user.blocked) return res.status(403).json({ message: 'User is blocked!' });

        // Fetch the user's cart from the database
        let userCart = await Cart.findOne({ userId: user._id });

        // If guestCart is provided, merge it with the user's cart
        if (parsedGuestCart && parsedGuestCart.length > 0) {
            if (!userCart) {
                // If the user doesn't have a cart, create one
                userCart = new Cart({ userId: user._id, items: [] });
            }

            // Merge guest cart into user's cart
            parsedGuestCart.forEach(guestItem => {
                const existingItemIndex = userCart.items.findIndex(
                    item => item.productId.toString() === guestItem.productId
                );

                if (existingItemIndex > -1) {
                    // If the product already exists in the user's cart, update the quantity
                    userCart.items[existingItemIndex].quantity += guestItem.quantity;
                } else {
                    // If the product doesn't exist, add it to the user's cart
                    userCart.items.push({
                        productId: guestItem.productId,
                        title: guestItem.title,
                        selectedMeasurement: guestItem.selectedMeasurement,
                        quantity: guestItem.quantity,
                    });
                }
            });

            // Save the updated cart to the database
            await userCart.save();
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.SESSION_SECRET, { expiresIn: '7d' });

        // Set the token in a cookie
        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });

        // Send success response
        res.status(200).json({ success: true, message: 'Login successful!' });
    } catch (error) {
        console.log("Error in Login:", error.message);
        res.status(500).json({ message: error.message });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (email === 'admin@maxtron.com' && password === 'admin@admin') {
        req.session.user = { email };
        res.redirect('/dashboard');
    } else {
        res.render('admin-login', { title: 'Admin Login', error: 'Invalid email or password' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found!' });

        // Check OTP & expiry
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP!' });
        }

        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();

        res.redirect('/user-login');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyOTPpassword = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found!' });

        // Check OTP & expiry
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP!' });
        }
        // Clear OTP after verification
        user.otp = undefined;
        user.otpExpires = undefined;

        await user.save();
        res.render('resetPassword', { title: 'Reset Password', email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
};

exports.userRegister = async (req, res) => {
    try {
        const { name, email, mobile, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.render('userRegister', { title: 'Register page', error: 'User already exists!' });
        }

        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

        user = new User({ name, email, mobile, password, otp, otpExpires: Date.now() + 300000 });
        await user.save();

        // Send OTP
        const emailSent = await sendEmail(email, otp);
        if (!emailSent) {
            return res.render('userRegister', { title: 'Register page', error: 'Failed to send OTP!' });
        }

        // Render OTP page
        res.render('userOtp', { title: 'Otp page', email });  // Pass email to OTP page
    } catch (error) {
        res.render('userRegister', { title: 'Register page', error: error.message });
    }
};

exports.userLogout = (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true });
    res.redirect('/'); 
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            return res.render("forgotPassword", { title: "Forgot Password", error: "Email not found!" });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        user.otp = otp;
        user.otpExpires = Date.now() + 300000; // OTP expires in 5 minutes
        await user.save();

        // Send OTP via email
        const emailSent = await sendEmail(email, `Your OTP for password reset is: ${otp}`);
        if (!emailSent) {
            return res.render("forgotPassword", { title: "Forgot Password", error: "Failed to send OTP!" });
        }

        res.render("user-otp-reset", { title: "Verify OTP", email });
    } catch (error) {
        res.render("forgotPassword", { title: "Forgot Password", error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render("resetPassword", { title: "Reset Password", error: "Passwords do not match!" });
        }

        let user = await User.findOne({ email });

        if (!user) {
            return res.render("resetPassword", { title: "Reset Password", error: "User not found!" });
        }

        // Manually hash password before saving to avoid double hashing
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password directly in the database
        await User.updateOne({ email }, { $set: { password: hashedPassword } });

        res.render("userLogin", { title: "Login", success: "Password reset successful! Please log in." });
    } catch (error) {
        res.render("resetPassword", { title: "Reset Password", error: error.message });
    }
};