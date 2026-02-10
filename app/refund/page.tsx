import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund Policy - SongBird',
  description: 'SongBird Refund Policy - Terms and conditions for refunds',
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        <p className="text-text/70 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">7-Day Money-Back Guarantee</h2>
            <p className="text-text/90 mb-4">
              We offer a 7-day money-back guarantee for all new premium subscriptions. If you are not satisfied 
              with SongBird Premium within 7 days of your initial purchase, we will provide a full refund, no questions asked.
            </p>
            <p className="text-text/90 mb-4">
              This guarantee applies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Founding Flock annual subscriptions ($24/year)</li>
              <li>Monthly subscriptions ($3/month)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
            <p className="text-text/90 mb-4">
              To request a refund within the 7-day guarantee period:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Contact us at support@songbird.app with your account email</li>
              <li>Include your purchase date and subscription type</li>
              <li>We will process your refund within 5-7 business days</li>
            </ol>
            <p className="text-text/90 mb-4">
              Refunds will be issued to the original payment method used for the purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Refunds After 7 Days</h2>
            <p className="text-text/90 mb-4">
              After the 7-day guarantee period, refunds are handled on a case-by-case basis. We may consider refunds for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Technical issues that prevent you from using the service</li>
              <li>Billing errors or unauthorized charges</li>
              <li>Extenuating circumstances (at our discretion)</li>
            </ul>
            <p className="text-text/90 mb-4">
              For monthly subscriptions, refunds after the guarantee period will be prorated based on unused time 
              remaining in your billing cycle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Processing Time</h2>
            <p className="text-text/90 mb-4">
              Refunds are typically processed within 5-7 business days after approval. The refund will appear in 
              your account within 10-14 business days, depending on your payment provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Cancellation vs. Refund</h2>
            <p className="text-text/90 mb-4">
              <strong>Cancellation:</strong> Cancelling your subscription stops future charges but does not refund 
              payments already made. You retain premium access until the end of your current billing period.
            </p>
            <p className="text-text/90 mb-4">
              <strong>Refund:</strong> A refund returns your payment and removes premium access immediately. 
              Refunds are only available within the guarantee period or under special circumstances.
            </p>
            <p className="text-text/90 mb-4">
              Founding Flock members who cancel retain lifetime premium access even after cancellation. 
              They do not receive a refund but will not be charged again.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Non-Refundable Items</h2>
            <p className="text-text/90 mb-4">
              The following are not eligible for refunds:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Subscriptions cancelled after the 7-day guarantee period (unless under special circumstances)</li>
              <li>Payments made more than 30 days ago</li>
              <li>Refunds requested due to violation of Terms of Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-text/90 mb-4">
              If you have questions about refunds or need to request a refund, please contact us:
            </p>
            <div className="bg-surface p-4 rounded-lg mt-4">
              <p className="text-text/90">
                <strong>Email:</strong> support@songbird.app
              </p>
              <p className="text-text/90 mt-2">
                Please include your account email and purchase details in your refund request.
              </p>
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-text/20">
            <p className="text-text/70 text-sm">
              This refund policy is part of our Terms of Service. By purchasing a subscription, you agree to these terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


