import axios from 'axios';

import { loadStripe } from '@stripe/stripe-js';
import { showAlert } from './alerts';

const stripePromise = loadStripe('pk_test_51JJxtMAV0hxL5mq45P86InzCOLJHB6m4VheJQAyzgWZJOlMP6YpBJldWhSCA3pFCtuCDNbGOLXOWQSHeWlarQAvs00AAXdD6Y8');

export const bookTour = async tourId => {
    try {
        const stripe = await stripePromise;

        // 1) Get checkout session from API
        const session = await axios(`http://localhost:5000/api/v1/bookings/checkout-session/${tourId}`);

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
};