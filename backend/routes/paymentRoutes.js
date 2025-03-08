const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/Order");
require("dotenv").config();

const router = express.Router();



router.post("/checkoutApi", async (req, res) => {
    try {
        const { userId, items, totalAmount, billingAddress, paymentMethod } = req.body;

        const order = new Order({
            user: userId,
            items,
            totalAmount,
            billingAddress,
            paymentMethod,
            status: "Pending",
        });

        await order.save();

        if (paymentMethod === "COD") {
            return res.json({ success: true, message: "Order placed successfully!" });
        }

        const txnid = "txn" + Date.now();
        const hashString = `${process.env.PAYU_MERCHANT_KEY}|${txnid}|${totalAmount}|Product Purchase|${billingAddress.fullName}|${billingAddress.email}|||||||||||${process.env.PAYU_MERCHANT_SALT}`;

        const hash = crypto.createHash("sha512").update(hashString).digest("hex");
        const payuData = {
            key: process.env.PAYU_MERCHANT_KEY,
            txnid,
            amount: totalAmount,
            productinfo: "Product Purchase",
            firstname: billingAddress.fullName,
            email: billingAddress.email,
            phone: billingAddress.phone,
            surl: process.env.PAYU_SUCCESS_URL,
            furl: process.env.PAYU_FAILURE_URL,
            hash,
            service_provider: "payu_paisa",
        };

        res.json({ payuData });

    } catch (error) {
        console.error("Checkout error:", error);
        res.status(500).json({ success: false, message: "Checkout failed" });
    }
});


// PayU Success and Failure Callbacks
router.post("/payu/success", (req, res) => {
    res.send("Payment Successful!");
});

router.post("/payu/failure", (req, res) => {
    res.send("Payment Failed!");
});

module.exports = router;
