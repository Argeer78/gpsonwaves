import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2024-06-20' as any, // Cast to any to avoid strict version mismatch with newer/beta SDKs
    typescript: true,
});
