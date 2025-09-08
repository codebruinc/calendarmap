import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'edge';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe checkout request received');
    
    if (!stripe || !process.env.ENABLE_STRIPE_PAYMENTS || process.env.ENABLE_STRIPE_PAYMENTS !== 'true') {
      console.log('Stripe payments not enabled or not configured');
      return NextResponse.json(
        { error: 'Stripe payments are not enabled' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_PRICE_ID) {
      console.log('Stripe price ID not configured');
      return NextResponse.json(
        { error: 'Stripe price ID not configured' },
        { status: 500 }
      );
    }

    console.log('Using price ID:', process.env.STRIPE_PRICE_ID);

    const origin = request.nextUrl.origin;
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      metadata: {
        product: 'large_calendar_pass',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    
    // Log more details for debugging
    if (error.type) {
      console.error('Stripe error type:', error.type);
      console.error('Stripe error code:', error.code);
      console.error('Stripe error message:', error.message);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}