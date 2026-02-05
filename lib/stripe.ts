import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2025-01-27.acacia', // Use latest API version or 2024-12-18.acacia if 2025 not avail, defaulting to typescript type check usually
    typescript: true,
});
