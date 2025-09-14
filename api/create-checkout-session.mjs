import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, donationType, successUrl, cancelUrl } = req.body;

    if (!amount || !donationType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Support TYPRR - ${donationType === 'one-time' ? 'One-time' : 'Monthly'} Donation`,
              description: 'Help keep TYPRR fast, clean, and ad-free forever',
            },
            unit_amount: amount * 100, // Stripe expects cents
            ...(donationType === 'recurring' && {
              recurring: {
                interval: 'month',
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: donationType === 'one-time' ? 'payment' : 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        donationType,
        amount: amount.toString(),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
