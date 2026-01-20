import { NextRequest, NextResponse } from 'next/server'

// Stripe webhook handler - disabled until Stripe is fully configured
export async function POST(request: NextRequest) {
  console.log('[stripe/webhook] Stripe not configured yet')
  return NextResponse.json({ received: true, message: 'Stripe not configured' })
}

// Disable body parsing for webhooks (we need raw body)
export const config = {
  api: {
    bodyParser: false,
  },
}
