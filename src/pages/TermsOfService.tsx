import { Link } from "react-router-dom";
import { Castle, ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: April 5, 2026</p>

        <div className="space-y-8 text-sm text-muted-foreground leading-relaxed">

          <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
            <p className="text-yellow-400 text-xs font-semibold">IMPORTANT DISCLAIMER</p>
            <p className="text-xs mt-1">Magic Pass Plus LLC is not affiliated with, endorsed by, or officially connected to The Walt Disney Company or any of its subsidiaries. Disney®, Walt Disney World®, and related marks are trademarks of Disney. Use of these marks is for descriptive purposes only.</p>
          </div>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using magicpassplus.com (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service. These Terms constitute a legally binding agreement between you and Magic Pass Plus LLC ("Company," "we," "us," or "our").</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Description of Service</h2>
            <p className="mb-3">Magic Pass Plus is an independent vacation planning tool designed to help Disney World visitors plan their trips. The Service includes:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>AI-powered trip itinerary planning</li>
              <li>Dining reservation alert notifications</li>
              <li>Live park wait time information (sourced from public APIs)</li>
              <li>Gift card deal tracking</li>
              <li>Annual Passholder information and alerts</li>
              <li>Community features for Disney enthusiasts</li>
            </ul>
            <p className="mt-3">Magic Pass Plus is an independent service and is not affiliated with The Walt Disney Company. We do not guarantee availability of reservations, park information accuracy, or uninterrupted access to third-party data sources.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Account Registration</h2>
            <p className="mb-2">To use certain features, you must create an account. You agree to:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized account access</li>
              <li>Be responsible for all activity under your account</li>
              <li>Not create accounts for others without their consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Subscriptions and Billing</h2>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-foreground mb-1">Free Trial</p>
                <p>We offer a 7-day free trial on all paid plans. No credit card is required to start the trial. If you do not cancel before the trial ends, you will be charged the applicable subscription rate.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Subscription Plans</p>
                <p>Subscriptions are billed monthly or annually in advance. Prices are displayed on our pricing page and may change with 30 days' notice.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Cancellation</p>
                <p>You may cancel your subscription at any time. Upon cancellation, you retain access until the end of your current billing period. We do not provide refunds for partial billing periods.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">VIP Accounts</p>
                <p>Certain accounts may be designated as VIP (complimentary) accounts at our sole discretion. VIP access may be revoked at any time.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Disney Account Connection</h2>
            <p className="mb-3">The dining reservation alert feature requires connecting your Disney account. By connecting your Disney account, you:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Authorize Magic Pass Plus to access Disney's reservation availability system on your behalf using your session credentials</li>
              <li>Confirm that you are the owner of the Disney account being connected</li>
              <li>Acknowledge that we store a temporary session token (not your password) to perform this function</li>
              <li>Accept responsibility for complying with Disney's own Terms of Service in your use of this feature</li>
              <li>Understand you can disconnect at any time from your Settings page</li>
            </ul>
            <p className="mt-3">Magic Pass Plus does not store Disney account passwords. We use only session tokens obtained through your direct login to Disney's own website.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Acceptable Use</h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe any third-party intellectual property rights</li>
              <li>Transmit harmful, offensive, or illegal content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use automated bots or scrapers against our Service</li>
              <li>Resell or sublicense access to the Service</li>
              <li>Misrepresent your identity or affiliation</li>
              <li>Engage in any activity that disrupts or interferes with the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Dining Alerts — Important Limitations</h2>
            <p className="mb-3">Our dining reservation alert service:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Does not guarantee reservations.</strong> We alert you when availability is detected but cannot guarantee you will successfully book before others do.</li>
              <li><strong className="text-foreground">Depends on third-party systems.</strong> Disney's reservation systems may change, experience outages, or block our access at any time.</li>
              <li><strong className="text-foreground">Is subject to delays.</strong> Alert delivery may be delayed due to technical factors beyond our control.</li>
              <li><strong className="text-foreground">Is not a booking service.</strong> Magic Pass Plus does not make reservations on your behalf. We only notify you of availability.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are owned by Magic Pass Plus LLC and are protected by copyright, trademark, and other applicable laws. You may not copy, modify, distribute, or reverse engineer any part of the Service without our written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Disclaimer of Warranties</h2>
            <p className="mb-3">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, MAGIC PASS PLUS LLC DISCLAIMS ALL WARRANTIES INCLUDING:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Accuracy or completeness of park information, wait times, or availability data</li>
              <li>Uninterrupted or error-free operation of the Service</li>
              <li>Fitness for any particular purpose</li>
              <li>The availability of dining reservations when alerts are sent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MAGIC PASS PLUS LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 3 MONTHS PRECEDING THE CLAIM.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">11. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless Magic Pass Plus LLC and its officers, directors, and employees from any claims arising from your use of the Service, violation of these Terms, or violation of any third-party rights.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">12. Termination</h2>
            <p>We reserve the right to suspend or terminate your account at our sole discretion for violation of these Terms, illegal activity, or any reason we deem necessary to protect the Service or other users. You may terminate your account at any time from Settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">13. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Lake County, Florida.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">14. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes by email or app notice. Continued use of the Service after changes are posted constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">15. Contact</h2>
            <div className="p-4 rounded-xl border border-white/10" style={{ background: "var(--card)" }}>
              <p className="text-foreground font-semibold">Magic Pass Plus LLC</p>
              <p>Clermont, FL</p>
              <p><a href="mailto:legal@magicpassplus.com" className="text-primary hover:underline">legal@magicpassplus.com</a></p>
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
