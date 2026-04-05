import { Link } from "react-router-dom";
import { Castle, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(245,200,66,0.15)", background: "var(--muted)" }}>
        <Link to="/" className="flex items-center gap-2">
          <Castle className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary">Magic Pass Plus</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: April 5, 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Who We Are</h2>
            <p>Magic Pass Plus LLC ("Magic Pass Plus," "we," "us," or "our") operates the website magicpassplus.com and related services (the "Service"). We are not affiliated with, endorsed by, or officially connected to The Walt Disney Company or any of its subsidiaries or affiliates. Disney®, Walt Disney World®, and related marks are trademarks of Disney.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-foreground mb-1">Account Information</p>
                <p>When you create an account, we collect your name, email address, and optional profile information (home zip code, Disney pass tier, phone number for SMS alerts). We never store your Disney account password.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Disney Session Tokens</p>
                <p>If you choose to connect your Disney account for dining alerts, we store a temporary session token provided by Disney's authentication system. This token allows us to check dining reservation availability on your behalf. It is not your Disney password. You can disconnect and revoke this token at any time from your Settings page.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Alert Preferences</p>
                <p>We store the dining alerts, park preferences, and notification settings you configure within the Service.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Payment Information</p>
                <p>Payments are processed by Stripe. We do not store your credit card number. We retain only the data Stripe provides us after a successful transaction (subscription status, billing dates).</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Usage Data</p>
                <p>We collect standard server logs including IP addresses, browser type, pages visited, and timestamps. This data helps us diagnose issues and improve the Service.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>To provide, operate, and improve the Service</li>
              <li>To send dining reservation alerts and notifications you've requested</li>
              <li>To check Disney dining availability on your behalf (using your connected session token, if provided)</li>
              <li>To process payments and manage your subscription</li>
              <li>To send transactional emails (alert notifications, billing receipts)</li>
              <li>To respond to your support inquiries</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Disney Account Connection</h2>
            <p className="mb-3">Our dining reservation alert feature works by checking Disney's reservation availability using your own Disney session credentials. When you connect your Disney account:</p>
            <ul className="space-y-2 list-disc list-inside mb-3">
              <li>You visit Disney's website directly in your own browser</li>
              <li>You log into Disney (we never see your Disney password)</li>
              <li>A temporary session token is passed to our secure servers</li>
              <li>We use this token only to check reservation availability on your behalf</li>
              <li>The token is stored encrypted and used only for the purpose you authorized</li>
              <li>You can disconnect at any time by visiting Settings → Disney Account → Disconnect</li>
            </ul>
            <p>This process is similar to how many apps integrate with third-party services using OAuth-style authentication. Your Disney credentials are never transmitted to or stored by Magic Pass Plus.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Data Storage and Security</h2>
            <p className="mb-3">Your data is stored in Supabase, a SOC 2 Type II certified cloud database hosted on AWS. We implement industry-standard security measures including:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Encryption at rest and in transit (TLS 1.3)</li>
              <li>Row-level security (you can only access your own data)</li>
              <li>Encrypted storage of sensitive tokens</li>
              <li>Regular security reviews</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services to operate Magic Pass Plus:</p>
            <div className="space-y-2">
              {[
                { name: "Supabase", purpose: "Database, authentication, and file storage" },
                { name: "Stripe", purpose: "Payment processing" },
                { name: "Brevo (Sendinblue)", purpose: "Email delivery" },
                { name: "Twilio", purpose: "SMS alerts (opt-in only)" },
                { name: "ThemeParks.wiki", purpose: "Live park wait times (public data)" },
                { name: "Lovable", purpose: "Frontend hosting" },
              ].map(svc => (
                <div key={svc.name} className="flex gap-3">
                  <span className="font-semibold text-foreground w-32 shrink-0">{svc.name}</span>
                  <span>{svc.purpose}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. SMS Communications</h2>
            <p>If you opt in to SMS alerts, message and data rates may apply. You can opt out at any time by replying STOP to any message, or by adjusting your notification settings in the app. We will not send unsolicited marketing SMS messages.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and all associated data</li>
              <li>Export your data in a portable format</li>
              <li>Disconnect your Disney account connection at any time</li>
              <li>Opt out of SMS and email notifications</li>
            </ul>
            <p className="mt-3">To exercise these rights, visit your Settings page or contact us at <a href="mailto:privacy@magicpassplus.com" className="text-primary hover:underline">privacy@magicpassplus.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Children's Privacy</h2>
            <p>Magic Pass Plus is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice in the app. Continued use of the Service after changes are posted constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">11. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
            <div className="mt-3 p-4 rounded-xl border border-white/10" style={{ background: "var(--card)" }}>
              <p className="text-foreground font-semibold">Magic Pass Plus LLC</p>
              <p>Clermont, FL</p>
              <p><a href="mailto:privacy@magicpassplus.com" className="text-primary hover:underline">privacy@magicpassplus.com</a></p>
              <p><a href="https://magicpassplus.com" className="text-primary hover:underline">magicpassplus.com</a></p>
            </div>
          </section>

          <div className="border-t border-white/10 pt-6 text-xs text-muted-foreground">
            <p>© 2026 Magic Pass Plus LLC. Not affiliated with The Walt Disney Company. Disney®, Walt Disney World®, and related marks are trademarks of Disney.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
