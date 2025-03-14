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

        if (paymentMethod === "COD") {
            // For COD, save the order immediately
            const order = new Order({
                user: userId,
                items,
                totalAmount,
                billingAddress,
                paymentMethod,
                deliveryAddress,
                orderNotes,
                status: "Processing", 
            });

            await order.save();
            await Cart.deleteOne({ userId: userId });

            return res.json({ success: true, message: "Order placed successfully and cart deleted!" });
        }

        // For Online payment, generate payuData and send it to the frontend
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


router.get("/payu/success", async (req, res) => {
    try {
        const { txnid, mihpayid, status } = req.query;

        if (status === "success") {
            const orderDetails = req.session.orderDetails;

            if (!orderDetails) {
                return res.status(400).send("Order details not found.");
            }

            // Save the order
            const order = new Order({
                user: orderDetails.userId,
                items: orderDetails.items,
                totalAmount: orderDetails.totalAmount,
                billingAddress: orderDetails.billingAddress,
                paymentMethod: "Online",
                deliveryAddress: orderDetails.deliveryAddress,
                orderNotes: orderDetails.orderNotes,
                status: "Processing", 
            });

            await order.save();
            await Cart.deleteOne({ userId: orderDetails.userId });

            console.log("Order saved successfully:", order);

            // Render the success page
            res.render("success", {
                txnid: txnid, // Pass the transaction ID to the template
                order: order // Pass the order details to the template
            });
        } else {
            res.status(400).send("Payment failed. Order not placed.");
        }
    } catch (error) {
        console.error("Error in /payu/success:", error);
        res.status(500).send("An error occurred while processing your payment.");
    }
});
router.get("/payu/failure", (req, res) => {
    const { txnid, mihpayid, status } = req.query;
    console.log("Payment Failed:", { txnid, mihpayid, status });

    // Render the failure page
    res.render("failure");
});

module.exports = router;
