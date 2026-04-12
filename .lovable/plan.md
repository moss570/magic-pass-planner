

## Update "Add Person" Link to Large Invite Button

### Change
In `src/components/trip-planner/AddMemberForm.tsx`, replace the small text link ("Add Person") with a full-width styled button that says **"Invite Friend to Plan This Trip"** with a description below it.

### Details

**File: `src/components/trip-planner/AddMemberForm.tsx`** (lines ~75-82)

Replace the current collapsed state:
```tsx
<button onClick={() => setShowForm(true)}
  className="flex items-center gap-1.5 text-xs text-primary hover:underline">
  <UserPlus className="w-3.5 h-3.5" /> Add Person
</button>
```

With a full-width button block:
```tsx
<button onClick={() => setShowForm(true)}
  className="w-full py-3 px-4 rounded-xl border border-primary/30 bg-primary/10 
             hover:bg-primary/20 transition-colors text-left space-y-1">
  <div className="flex items-center gap-2 text-sm font-bold text-primary">
    <UserPlus className="w-4 h-4" /> Invite Friend to Plan This Trip
  </div>
  <p className="text-xs text-muted-foreground leading-snug">
    Your friend will be able to receive alerts, follow budget, participate in 
    polls and other features depending on which subscription tier they have.
  </p>
</button>
```

Also update `StepParty.tsx` to remove the inline layout that places AddMemberForm next to the label — instead place it below the members list as a standalone block.

### Files to edit
- `src/components/trip-planner/AddMemberForm.tsx` — new button design for collapsed state
- `src/components/trip-planner/steps/StepParty.tsx` — move AddMemberForm below members list instead of inline with label

