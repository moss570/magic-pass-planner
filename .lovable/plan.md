

## Disable Game Links During Beta

### Changes

**`src/components/GameCard.tsx`**
- Add `disabled?: boolean` prop
- When disabled: suppress `onClick`, reduce opacity, hide hover effects, overlay a "COMING SOON" badge

**`src/pages/GamesDiscovery.tsx`**
- Pass `disabled={true}` to all `GameCard` components
- Add amber banner below header: "🚧 Games are currently under development. Stay tuned!"

