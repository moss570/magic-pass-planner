
# Magic Pass — Premium Disney World Vacation Planning Platform (Prompt 1)

## Design System Setup
- Update CSS variables and Tailwind config with the Magic Pass color palette (midnight navy, magic gold, enchanted purple, etc.)
- Import Plus Jakarta Sans from Google Fonts
- Set global dark theme with gold-bordered cards, 12px card radius, 8px button radius
- Add subtle gradient background, animated green pulse for live indicators

## Page 1: Landing Page (/)
- **Sticky Header**: Castle icon + "Magic Pass" gold logo, nav links (Features, Pricing, For Annual Passholders, Login), "Start Free Trial" gold CTA, backdrop blur on scroll
- **Hero Section**: Bold headline + subheadline, dual CTAs (gold filled + outlined), subtle star/particle animation background, 3 inline trust badges
- **Features Grid**: 6 cards in 3×2 layout with icons, titles, and descriptions (AI Trip Planner, Dining Alerts, Gift Card Tracker, Wait Times, AP Hub, Group Coordinator)
- **Social Proof Bar**: Tagline + 3 stat badges (1,200+ members, $480 savings, 4.9★ rating)

## Page 2: Pricing Page (/pricing)
- Monthly/Annual toggle with "Save up to 42%" badge on annual
- 4 pricing tier cards: Pre-Trip Planner ($6.99/mo), Magic Pass ($12.99/mo, "Most Popular" gold badge), AP Command Center ($7.99/mo), AP Command Center PLUS ($10.99/mo)
- Each card lists features with checkmarks, gold CTA button
- Footer note: cancel anytime, no contracts

## Page 3: Auth Pages
- **/signup**: Centered card with logo, email/password fields, "Create Account" gold button, Google social login, free trial note
- **/login**: Centered card with logo, email/password fields, "Log In" gold button, forgot password link, Google option

## Routing
- `/` → Landing Page
- `/pricing` → Pricing Page
- `/signup` → Sign Up
- `/login` → Login
- `/dashboard` → Placeholder "Dashboard coming in next build"

All pages are static with placeholder data — no backend or Supabase integration yet.
