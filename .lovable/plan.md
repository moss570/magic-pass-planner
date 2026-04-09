

# Fix Transparent Dropdown Backgrounds on Dining & Event Alerts

## Problem
The search dropdowns on both the Dining Alerts and Enchanting Extras (Event Alerts) pages have see-through backgrounds, making items hard to read against the page content behind them.

## Root Cause
Both dropdowns use `style={{ background: "var(--card)" }}` in inline styles. CSS custom variables with HSL values (e.g., `217 47% 11%`) without the `hsl()` wrapper don't work correctly in inline `background` properties, resulting in a transparent/missing background.

## Fix
Replace `var(--card)` with a solid hex color (`#141C2E`) matching the card color, and ensure text colors are explicitly set for readability.

### Files Changed

**1. `src/pages/DiningAlerts.tsx`** (line ~285)
- Change the restaurant dropdown container from `style={{ background: "var(--card)", maxHeight: 280 }}` to `style={{ background: "#141C2E", maxHeight: 280 }}`

**2. `src/pages/EventAlerts.tsx`** (line ~271)
- Change the event dropdown container from `style={{ background: "var(--card)", maxHeight: 280 }}` to `style={{ background: "#141C2E", maxHeight: 280 }}`

Both dropdowns already have `text-foreground` on item text and `text-muted-foreground` on secondary text, so no text color changes needed — just the solid background fix.

