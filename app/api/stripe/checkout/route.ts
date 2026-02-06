import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        // You might want to get the user from session here if you had auth
        const body = await req.json(); // If you need to pass specific data

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            // Link the Stripe Customer to the App User Email
            customer_email: body.email,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'GPSonWaves Pro Subscription',
                            description: 'Unlimited Spots, Advanced Maps, AI Forecasts',
                        },
                        unit_amount: 499, // $4.99
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/`,
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error("Stripe Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
