const express = require("express");

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');

const router = express.Router();

router.post(
    '/',
    async (req, res) => {
        try {

            const signature = req.headers["stripe-signature"];
            console.log(signature)

            const event = stripe.webhooks.constructEvent(
                req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const bookingId = session.client_reference_id;

                await Booking.findByIdAndUpdate(bookingId,
                    {
                        paid: true,
                        finishedAt: Date.now(),
                        status: 'completed'
                    },
                    { runValidators: true }
                );
            }

            res.json({received: true});

        } catch (err) {
            console.log('Error processing webhook event, reason: ', err);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    });

module.exports = router;