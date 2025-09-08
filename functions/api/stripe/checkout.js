export async function onRequestPost(context) {
  const { request, env } = context;
  
  console.log('Stripe checkout function called');
  console.log('Environment check:', {
    hasStripeSecret: !!env.STRIPE_SECRET_KEY,
    hasStripePrice: !!env.STRIPE_PRICE_ID,
    hasPaymentsEnabled: !!env.ENABLE_STRIPE_PAYMENTS,
    paymentsValue: env.ENABLE_STRIPE_PAYMENTS
  });
  
  try {
    // Check if Stripe payments are enabled
    if (!env.ENABLE_STRIPE_PAYMENTS || env.ENABLE_STRIPE_PAYMENTS !== 'true') {
      console.log('Stripe payments not enabled');
      return new Response(
        JSON.stringify({ error: 'Stripe payments are not enabled' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!env.STRIPE_SECRET_KEY) {
      console.log('Stripe secret key missing');
      return new Response(
        JSON.stringify({ error: 'Stripe secret key not configured' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!env.STRIPE_PRICE_ID) {
      console.log('Stripe price ID missing');
      return new Response(
        JSON.stringify({ error: 'Stripe price ID not configured' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating Stripe checkout session with direct API call');
    const origin = new URL(request.url).origin;
    
    // Create checkout session using direct Stripe API call
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-11-20.acacia',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'line_items[0][price]': env.STRIPE_PRICE_ID,
        'line_items[0][quantity]': '1',
        'success_url': `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${origin}/pricing?canceled=true`,
        'metadata[product]': 'large_calendar_pass',
      }),
    });

    console.log('Stripe API response status:', stripeResponse.status);

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('Stripe API error:', errorText);
      console.error('Response headers:', [...stripeResponse.headers]);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create checkout session',
          details: `Stripe API returned ${stripeResponse.status}`,
          stripeError: errorText
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const session = await stripeResponse.json();
    console.log('Checkout session created successfully:', session.id);
    
    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Stripe checkout error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}