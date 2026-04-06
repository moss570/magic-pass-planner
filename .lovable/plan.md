

## Fix: Admin.tsx JSX Syntax Error

The build is broken because of a missing closing `)}` on line 523 of `Admin.tsx`. The conditional expression wrapping the "Revoke" button is not closed before the next `<button>` element starts, causing a JSX parse error.

### Change

In `src/pages/Admin.tsx` around line 523, close the conditional after the Revoke button:

```tsx
// Before (broken):
{vip.status !== "revoked" && (
  <button onClick={() => revokeVip(vip)} ...>Revoke</button>
<button onClick={async () => { ... }}>...</button>

// After (fixed):
{vip.status !== "revoked" && (
  <button onClick={() => revokeVip(vip)} ...>Revoke</button>
)}
<button onClick={async () => { ... }}>...</button>
```

This is a one-line fix — add `)}` after the Revoke button's closing tag on line 523.

