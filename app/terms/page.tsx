import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - SongBird',
  description: 'SongBird Terms of Service - Rules and guidelines for using our music journaling app',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-text/70 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-text/90 mb-4">
              By accessing or using SongBird ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-text/90 mb-4">
              SongBird is a music journaling application that allows users to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Log daily "Song of the Day" entries</li>
              <li>Add personal notes and memories</li>
              <li>Connect with friends and share entries</li>
              <li>View analytics and insights about their music listening</li>
              <li>Access premium features (with subscription)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Account Creation</h3>
            <p className="text-text/90 mb-4">
              To use SongBird, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as necessary</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Account Termination</h3>
            <p className="text-text/90 mb-4">
              You may delete your account at any time through your Profile settings. We reserve the right to suspend or 
              terminate accounts that violate these Terms or engage in harmful behavior.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Your Content</h3>
            <p className="text-text/90 mb-4">
              You retain ownership of all content you create on SongBird (entries, notes, profile information). 
              By using the Service, you grant us a license to store, display, and process your content solely to provide the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Content Standards</h3>
            <p className="text-text/90 mb-4">You agree not to post content that:</p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Is illegal, harmful, or violates any laws</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains hate speech, harassment, or threats</li>
              <li>Is spam, fraudulent, or misleading</li>
              <li>Violates others' privacy or personal information</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Content Moderation</h3>
            <p className="text-text/90 mb-4">
              We reserve the right to remove any content that violates these Terms or is otherwise objectionable. 
              We may suspend or terminate accounts of repeat offenders.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Our Rights</h3>
            <p className="text-text/90 mb-4">
              SongBird, including its design, features, and functionality, is owned by us and protected by copyright, 
              trademark, and other intellectual property laws. You may not copy, modify, or create derivative works without permission.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Music Content</h3>
            <p className="text-text/90 mb-4">
              SongBird uses the Spotify Web API to search and display song information. All music content (song titles, 
              artist names, album artwork) is owned by Spotify and/or the respective rights holders. We do not claim 
              ownership of any music content. SongBird is a journaling tool and does not provide music streaming.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Attribution</h3>
            <p className="text-text/90 mb-4">
              SongBird displays "Powered by Spotify" attribution as required by Spotify's API Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Premium Subscriptions</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">6.1 Subscription Plans</h3>
            <p className="text-text/90 mb-4">
              SongBird offers two premium subscription options:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li><strong>Founding Flock:</strong> $24/year (lifetime locked rate, limited to 1,000 members)</li>
              <li><strong>Monthly Subscription:</strong> $3/month (billed monthly, auto-renewing)</li>
            </ul>
            <p className="text-text/90 mb-4">
              Both plans provide access to all premium features including unlimited entries, full history access, 
              advanced analytics, unlimited friends, and all future premium features.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.2 Founding Flock Lifetime Access</h3>
            <p className="text-text/90 mb-4">
              Founding Flock members receive lifetime premium access at the locked rate of $24/year. 
              This rate will never increase for founding members, even if regular subscription prices change. 
              Founding Flock status is limited to the first 1,000 members and cannot be transferred.
            </p>
            <p className="text-text/90 mb-4">
              If a Founding Flock subscription is cancelled, the member retains lifetime premium access 
              and will not be charged again. However, if they wish to reactivate billing, they may do so 
              at the same $24/year rate.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.3 Monthly Subscription Terms</h3>
            <p className="text-text/90 mb-4">
              Monthly subscriptions automatically renew each month unless cancelled. You will be charged 
              $3/month on your billing date. Premium access continues as long as your subscription is active.
            </p>
            <p className="text-text/90 mb-4">
              <strong>Auto-Renewal:</strong> By subscribing to the monthly plan, you authorize SongBird to 
              charge your payment method automatically each month until you cancel. You will receive email 
              notifications before each renewal charge.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.4 Payment</h3>
            <p className="text-text/90 mb-4">
              Payments are processed through Stripe. You agree to provide accurate payment information and authorize 
              us to charge your payment method for subscription fees. All prices are in USD.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.5 Cancellation</h3>
            <p className="text-text/90 mb-4">
              You may cancel your subscription at any time through your account settings or by contacting us. 
              Cancellation takes effect at the end of your current billing period. You will retain premium access 
              until the end of the billing period you've already paid for.
            </p>
            <p className="text-text/90 mb-4">
              <strong>Easy Cancellation:</strong> Cancellation is as simple as signup. You can cancel your 
              monthly subscription with one click in your account settings or through the Stripe Customer Portal. 
              Founding Flock members can cancel their subscription billing while retaining lifetime premium access.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.6 Refunds</h3>
            <p className="text-text/90 mb-4">
              We offer a 7-day money-back guarantee for all new subscriptions. If you are not satisfied with 
              SongBird Premium within 7 days of your initial purchase, contact us for a full refund.
            </p>
            <p className="text-text/90 mb-4">
              After the 7-day period, refunds are handled on a case-by-case basis. Contact us within 30 days 
              of purchase if you believe you are entitled to a refund. Refunds for monthly subscriptions will 
              be prorated based on unused time.
            </p>
            <p className="text-text/90 mb-4">
              For more details, see our <a href="/refund" className="text-accent hover:underline">Refund Policy</a>.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">6.7 No Free Trial</h3>
            <p className="text-text/90 mb-4">
              SongBird does not currently offer a free trial period. All premium subscriptions require payment 
              at the time of signup. We believe in transparent pricing and the value of our premium features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Prohibited Uses</h2>
            <p className="text-text/90 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems (bots, scrapers) to access the Service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Impersonate others or provide false information</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Privacy</h2>
            <p className="text-text/90 mb-4">
              Your use of SongBird is also governed by our Privacy Policy. Please review our Privacy Policy to understand 
              how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">9.1 Service Availability</h3>
            <p className="text-text/90 mb-4">
              We strive to provide reliable service but do not guarantee that SongBird will be available 100% of the time. 
              The Service may be unavailable due to maintenance, updates, or unforeseen circumstances.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">9.2 "As Is" Service</h3>
            <p className="text-text/90 mb-4">
              SongBird is provided "as is" and "as available" without warranties of any kind, either express or implied. 
              We do not warrant that the Service will be error-free, secure, or uninterrupted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-text/90 mb-4">
              To the maximum extent permitted by law, SongBird and its operators shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred 
              directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your 
              use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-text/90 mb-4">
              You agree to indemnify and hold harmless SongBird, its operators, and affiliates from any claims, damages, 
              losses, liabilities, and expenses (including legal fees) arising out of your use of the Service, violation 
              of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-text/90 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes by posting 
              the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after 
              changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
            <p className="text-text/90 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
              SongBird operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Severability</h2>
            <p className="text-text/90 mb-4">
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited 
              or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
            <p className="text-text/90 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-surface p-4 rounded-lg mt-4">
              <p className="text-text/90">
                <strong>Email:</strong> support@songbird.app (or use the contact form in the app)
              </p>
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-text/20">
            <p className="text-text/70 text-sm">
              By using SongBird, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


