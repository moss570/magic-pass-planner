import { useState } from "react";
import { Link } from "react-router-dom";
import { Castle, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

const FAQ_SECTIONS = [
  {
    section: "Getting Started",
    emoji: "🚀",
    questions: [
      {
        q: "What is Magic Pass Plus?",
        a: "Magic Pass Plus is an independent Disney World vacation planning platform built by Disney fans, for Disney fans. We combine AI trip planning, real-time wait time alerts, dining reservation notifications, gift card deal tracking, Annual Passholder tools, and a Disney community — all in one app. We are not affiliated with The Walt Disney Company."
      },
      {
        q: "How much does it cost?",
        a: "We offer a 7-day free trial on all plans, no credit card required. After the trial:\n• Pre-Trip Planner: $6.99/month ($49.99/year)\n• Magic Pass (full platform): $12.99/month ($89.99/year)\n• AP Command Center (Annual Passholders): $7.99/month ($59.99/year)\n• AP Command Center PLUS: $10.99/month ($79.99/year)\n\nAnnual plans save you up to 42% compared to monthly billing."
      },
      {
        q: "Do I need a Disney account to use Magic Pass Plus?",
        a: "No. You can use most features — trip planning, wait times, gift card tracker, fireworks calculator, and more — without a Disney account. However, to enable real-time dining reservation alerts, you'll need to connect your Disney account so we can check availability on your behalf."
      },
      {
        q: "Is Magic Pass Plus affiliated with Disney?",
        a: "No. Magic Pass Plus LLC is an independent company. We are not affiliated with, endorsed by, or officially connected to The Walt Disney Company in any way. Disney®, Walt Disney World®, and related marks are trademarks of The Walt Disney Company."
      },
    ]
  },
  {
    section: "Dining Reservation Alerts",
    emoji: "🍽️",
    questions: [
      {
        q: "How do dining reservation alerts work?",
        a: "When you set a dining alert, we watch Disney's reservation system 24/7 and notify you the instant a table becomes available matching your criteria (restaurant, date, party size, meal time). We check every 60 seconds — significantly faster than manually refreshing Disney's website."
      },
      {
        q: "Why do I need to connect my Disney account for dining alerts?",
        a: "Disney's reservation availability system requires authentication to access. By connecting your Disney account, you authorize us to check availability on your behalf using your own session. This is the same approach used by other popular Disney dining alert services. Your Disney password is never stored by Magic Pass Plus — we only use a temporary session token."
      },
      {
        q: "Is connecting my Disney account safe?",
        a: "Yes. When you connect your Disney account:\n• You log into Disney directly on Disney's own website (in a popup)\n• We never see or store your Disney password\n• Only a temporary session token is saved on our secure servers\n• You can disconnect at any time from Settings\n• Your token is encrypted and only used to check reservation availability\n\nThis process is similar to how other apps authenticate with third-party services."
      },
      {
        q: "What restaurants can you monitor?",
        a: "We monitor all Disney World table-service restaurants across Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom, all resort areas, and Disney Springs — over 130 restaurants total. The list is updated regularly as Disney opens new locations or closes existing ones."
      },
      {
        q: "Will I definitely get the reservation?",
        a: "We alert you the instant availability is detected, but we cannot guarantee you'll successfully book before others do. Highly sought-after restaurants like Be Our Guest and Cinderella's Royal Table can have reservations claimed within seconds of becoming available. We recommend having Disney's booking page ready the moment you receive our alert."
      },
      {
        q: "Can my whole group get alerted at the same time?",
        a: "Yes! When you set a dining alert, you can assign other Magic Pass Plus members (your trip group, family, friends) to also receive the notification simultaneously. This means everyone in your group gets the alert at the exact same moment, giving you the best chance of booking before the reservation disappears."
      },
      {
        q: "What happens if my dining alert fires while I'm asleep?",
        a: "You'll receive a push notification and email immediately when availability is detected. With SMS alerts enabled (requires Twilio), you'll also get a text. We recommend checking your notification settings so alerts wake you up if that's important to you. Dining availability can disappear within seconds, especially for high-demand restaurants."
      },
    ]
  },
  {
    section: "Live Park Features",
    emoji: "⚡",
    questions: [
      {
        q: "Where does the live wait time data come from?",
        a: "Wait times are sourced from ThemeParks.wiki, a reliable open-source park data API that aggregates real-time wait information from all six Disney World parks. Data updates every 60 seconds."
      },
      {
        q: "How does the fireworks ride calculator work?",
        a: "We calculate the optimal time to board certain rides so that you exit during Happily Ever After fireworks with a great view. The formula factors in: current wait time + ride duration + walk time to the ride = board at this exact time. We've researched which rides have the best fireworks views and baked that knowledge in."
      },
      {
        q: "How does GPS park detection work?",
        a: "When you're using Live Park Mode, the app uses your device's GPS to detect if you're inside park boundaries. If you're in the park, navigate buttons appear for every ride, pointing you in the right direction with our futuristic compass. If you're at home, the buttons hide (no navigation needed) but all wait times and fireworks data remain visible."
      },
      {
        q: "What is the AP Meetup Beacon?",
        a: "AP Meetup Beacon is an Annual Passholder-exclusive feature that lets you broadcast your location to other AP holders in the same park. No personal info is shared — just your park, a general meeting spot, and an optional vibe note (e.g. 'Solo AP, love coasters!'). If someone comes by and you want to connect, you can optionally add each other as Magic Pass friends."
      },
    ]
  },
  {
    section: "Annual Passholders",
    emoji: "🎟️",
    questions: [
      {
        q: "I'm an Annual Passholder. Which plan should I get?",
        a: "We built two plans specifically for Annual Passholders:\n• AP Command Center ($7.99/mo) — blockout calendar synced to your pass tier, AP discount database, AP hotel deal alerts, ride closure/refurbishment alerts\n• AP Command Center PLUS ($10.99/mo) — everything in AP Command Center plus live wait time alerts, Lightning Lane gap finder, gift card tracker, and group coordinator\n\nFor APs who visit 4+ times per year, PLUS pays for itself immediately."
      },
      {
        q: "What is the AP Discount Database?",
        a: "We maintain a searchable database of all current Annual Passholder discounts — dining, merchandise, hotel rates, experiences — updated as Disney changes them. We also have an AP Discount Stacking Calculator that shows you the best combination of discounts for a given bill."
      },
      {
        q: "Will you alert me when AP hotel deals drop?",
        a: "Yes. When Disney releases an Annual Passholder room discount, we send you an alert with the rate, dates, and a direct booking link. These deals often disappear within hours, so instant notification is critical."
      },
    ]
  },
  {
    section: "Gift Card Deals",
    emoji: "🎁",
    questions: [
      {
        q: "How does the gift card deal tracker work?",
        a: "We monitor Sam's Club, Target, Costco, BJ's, and other major retailers 24/7 for discounted Disney gift cards. When a deal goes live, you get an instant alert with the savings amount and a direct link. Disney gift card deals often sell out within hours of posting — early notification is everything."
      },
      {
        q: "How much can I save on gift cards?",
        a: "It varies by retailer and timing. Common savings: Sam's Club typically offers $500 cards for $480-490, Target RedCard gives 5% back on all purchases, and occasional promotions can push savings higher. Our savings calculator helps you figure out your exact savings based on your trip budget and available deals."
      },
      {
        q: "Can I stack gift card savings with my Annual Pass discount?",
        a: "In many cases, yes. Our AP Discount Stacking Calculator shows you the best combination. Note that some discounts cannot be combined — the calculator flags these and recommends the better option."
      },
    ]
  },
  {
    section: "Account & Billing",
    emoji: "💳",
    questions: [
      {
        q: "Can I cancel anytime?",
        a: "Yes. You can cancel your subscription at any time from Settings → My Subscription → Cancel. You'll retain full access until the end of your current billing period. We do not charge cancellation fees."
      },
      {
        q: "Can I upgrade or downgrade my plan?",
        a: "Yes, you can change plans at any time from the pricing page or Settings. Upgrades take effect immediately. Downgrades take effect at your next billing date."
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a 7-day free trial so you can experience the full service before being charged. We do not offer refunds for partial billing periods, but we'll always work with you if something went wrong. Contact us at support@magicpassplus.com."
      },
      {
        q: "How is my payment information handled?",
        a: "All payments are processed by Stripe, a PCI-DSS compliant payment processor. Magic Pass Plus never stores your credit card number. Stripe handles all sensitive payment data."
      },
    ]
  },
  {
    section: "Privacy & Security",
    emoji: "🔐",
    questions: [
      {
        q: "Do you sell my data?",
        a: "No. We do not sell, rent, or trade your personal information to third parties for marketing purposes. Full details are in our Privacy Policy."
      },
      {
        q: "How is my data stored?",
        a: "Your data is stored in Supabase, hosted on AWS, with encryption at rest and in transit. We use row-level security — your data is only accessible to you. Session tokens are stored encrypted."
      },
      {
        q: "Can I delete my account?",
        a: "Yes. Go to Settings → Data & Privacy → Delete Account. This permanently removes all your data from our systems. This action cannot be undone."
      },
    ]
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground leading-snug">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-primary shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
      </button>
      {open && (
        <div className="pb-4 pr-8">
          {a.split('\n').map((line, i) => (
            <p key={i} className={`text-sm text-muted-foreground leading-relaxed ${i > 0 ? 'mt-1.5' : ''}`}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen" style={{ background: "#080E1E" }}>
      <nav className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(245,200,66,0.15)", background: "#0D1230" }}>
        <Link to="/" className="flex items-center gap-2">
          <Castle className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary">Magic Pass Plus</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-3">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Everything you need to know about Magic Pass Plus</p>
          <p className="text-xs text-muted-foreground mt-2">Can't find your answer? Email us at <a href="mailto:support@magicpassplus.com" className="text-primary hover:underline">support@magicpassplus.com</a></p>
        </div>

        <div className="space-y-8">
          {FAQ_SECTIONS.map(section => (
            <div key={section.section}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{section.emoji}</span>
                <h2 className="text-base font-bold text-foreground">{section.section}</h2>
              </div>
              <div className="rounded-xl border border-white/8 overflow-hidden px-5" style={{ background: "#111827" }}>
                {section.questions.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-xl border border-primary/20 text-center" style={{ background: "#111827" }}>
          <p className="text-foreground font-semibold mb-1">Still have questions?</p>
          <p className="text-sm text-muted-foreground mb-4">We're here to help. Reach out anytime.</p>
          <a
            href="mailto:support@magicpassplus.com"
            className="inline-block px-6 py-2.5 rounded-lg font-bold text-sm text-[#080E1E]"
            style={{ background: "#F5C842" }}
          >
            Contact Support →
          </a>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>© 2026 Magic Pass Plus LLC · Not affiliated with The Walt Disney Company</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
