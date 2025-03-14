const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
require("dotenv").config();

const router = express.Router();

router.post("/checkoutApi", async (req, res) => {
    try {
        const { userId, items, totalAmount, billingAddress, paymentMethod, orderNotes, deliveryAddress } = req.body;

        const order = new Order({
            user: userId,
            items,
            totalAmount,
            billingAddress,
            paymentMethod,
            deliveryAddress,
            orderNotes,
            status: paymentMethod === "COD" ? "Processing" : "Pending",
        });

        await order.save();

        if (paymentMethod === "COD") {
            await Cart.deleteOne({ userId: userId });
            return res.json({ success: true, message: "Order placed successfully and cart deleted!" });
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

        console.log("Generated PayU Data:", payuData); // Debugging
        res.json({ success: true, payuData });

    } catch (error) {
        console.error("Checkout error:", error);
        res.status(500).json({ success: false, message: "Checkout failed" });
    }
});



// // PayU Success and Failure Callbacks
// router.post("/payu/success", (req, res) => {
//     res.send("Payment Successful!");
// });

// router.post("/payu/failure", (req, res) => {
//     res.send("Payment Failed!");
// });

router.get("/payu/success", (req, res) => {
    const mihpayid = req.query.mihpayid;
    const token = req.query.token;
    console.log("Payment Success:", { mihpayid, token });
    res.send("Payment Successful!");
});

router.get("/payu/failure", (req, res) => {
    const mihpayid = req.query.mihpayid;
    const token = req.query.token;
    console.log("Payment Failed:", { mihpayid, token });
    res.send("Payment Failed!");
});

module.exports = router;
