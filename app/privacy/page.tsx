import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - SongBird',
  description: 'SongBird Privacy Policy - How we collect, use, and protect your data',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-text/70 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-text/90 mb-4">
              Welcome to SongBird ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our music journaling application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Account Information</h3>
            <p className="text-text/90 mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Email address (via Clerk authentication)</li>
              <li>Username (optional, user-chosen)</li>
              <li>Profile image (optional)</li>
              <li>Display name</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Content You Create</h3>
            <p className="text-text/90 mb-4">
              We store the content you create on SongBird:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Song of the Day entries (song title, artist, album, date)</li>
              <li>Personal notes and journal entries</li>
              <li>People tags (friends or custom names you associate with entries)</li>
              <li>Mood selections (if provided)</li>
              <li>Profile information (bio, favorite artists/songs)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Usage Data</h3>
            <p className="text-text/90 mb-4">
              We automatically collect certain information when you use SongBird:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Device information (browser type, operating system)</li>
              <li>Usage patterns (features used, time spent)</li>
              <li>IP address (for security and analytics)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.4 Waitlist Information</h3>
            <p className="text-text/90 mb-4">
              If you join our waitlist before launch, we collect:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Email address</li>
              <li>Name (optional)</li>
              <li>Referral source (TikTok, Instagram, etc.)</li>
              <li>Referral code (for tracking viral growth)</li>
            </ul>
            <p className="text-text/90 mb-4">
              This information is used to notify you when SongBird launches and to track founding member eligibility.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.5 Social Features</h3>
            <p className="text-text/90 mb-4">
              If you use social features:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Friend connections and friend requests</li>
              <li>Comments and reactions ("vibes") on entries</li>
              <li>Mentions of other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-text/90 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Provide and maintain the SongBird service</li>
              <li>Process your song entries and display your music journal</li>
              <li>Enable social features (friends, feed, comments)</li>
              <li>Send you notifications (with your consent)</li>
              <li>Generate analytics and insights about your music listening</li>
              <li>Improve our services and develop new features</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Clerk (Authentication)</h3>
            <p className="text-text/90 mb-4">
              We use Clerk for user authentication. Clerk processes your email address and authentication credentials. 
              See Clerk's privacy policy: <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://clerk.com/privacy</a>
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Supabase (Database)</h3>
            <p className="text-text/90 mb-4">
              We use Supabase to store your data securely. Supabase processes and stores all your SongBird content.
              See Supabase's privacy policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://supabase.com/privacy</a>
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Spotify (Music Data)</h3>
            <p className="text-text/90 mb-4">
              We use the Spotify Web API to search for songs and retrieve album artwork. We do not store your Spotify credentials or listening history. 
              We only use Spotify to search and display song information you explicitly select.
              See Spotify's privacy policy: <a href="https://www.spotify.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://www.spotify.com/privacy</a>
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.4 Stripe (Payments)</h3>
            <p className="text-text/90 mb-4">
              If you purchase a premium subscription, Stripe processes your payment information. We do not store your full payment details.
              See Stripe's privacy policy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://stripe.com/privacy</a>
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.5 Vercel (Hosting)</h3>
            <p className="text-text/90 mb-4">
              SongBird is hosted on Vercel. Vercel may process technical data (IP addresses, request logs) for hosting purposes.
              See Vercel's privacy policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">https://vercel.com/legal/privacy-policy</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-text/90 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences (theme, settings)</li>
              <li>Analyze usage patterns to improve our service</li>
              <li>Provide personalized features</li>
            </ul>
            <p className="text-text/90 mb-4">
              You can control cookies through your browser settings. However, disabling cookies may limit some functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Sharing and Disclosure</h2>
            <p className="text-text/90 mb-4">We do not sell your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li><strong>With your consent:</strong> When you use social features, your entries may be visible to friends you've connected with</li>
              <li><strong>Service providers:</strong> With third-party services that help us operate SongBird (hosting, database, authentication)</li>
              <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p className="text-text/90 mb-4">You have the following rights regarding your personal information:</p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Access</h3>
            <p className="text-text/90 mb-4">
              You can access all your data through the SongBird application. You can view, edit, or delete your entries at any time.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.2 Deletion</h3>
            <p className="text-text/90 mb-4">
              You can delete your account and all associated data at any time through your Profile settings. 
              Account deletion is permanent and cannot be undone.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Data Portability</h3>
            <p className="text-text/90 mb-4">
              You can export your data by contacting us. We will provide your data in a machine-readable format.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">7.4 Opt-Out</h3>
            <p className="text-text/90 mb-4">
              You can opt out of:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Push notifications (through your device settings or app preferences)</li>
              <li>Email notifications (through your account settings)</li>
              <li>Social features (by keeping your account private)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
            <p className="text-text/90 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-text/90 mb-4 ml-4">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Secure database storage</li>
              <li>Authentication via Clerk (industry-standard security)</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
            </ul>
            <p className="text-text/90 mb-4">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-text/90 mb-4">
              SongBird is not intended for children under 13 years of age. We do not knowingly collect personal information 
              from children under 13. If you believe we have collected information from a child under 13, please contact us 
              immediately so we can delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>
            <p className="text-text/90 mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. 
              These countries may have data protection laws that differ from those in your country. By using SongBird, 
              you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-text/90 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this 
              Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-text/90 mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-surface p-4 rounded-lg mt-4">
              <p className="text-text/90">
                <strong>Email:</strong> privacy@songbird.app (or use the contact form in the app)
              </p>
              <p className="text-text/90 mt-2">
                <strong>Data Protection Inquiries:</strong> For GDPR-related requests, please use the same contact methods.
              </p>
            </div>
          </section>

          <section className="mt-12 pt-8 border-t border-text/20">
            <p className="text-text/70 text-sm">
              This Privacy Policy is compliant with GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act) requirements.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


