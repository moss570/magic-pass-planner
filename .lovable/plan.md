

## Fix: Handle Duplicate Constraint on Lead Type Change

### Problem
The `launch_signups` table has a `UNIQUE (email, signup_type)` constraint. When editing a lead's type from "updates" to "beta_tester" (or vice versa), if a row with that email and target type already exists, the update fails with a duplicate key error.

### Solution
Update the `saveEdit` function in `src/pages/admin/EarlyAccessLeads.tsx` to handle this case:

1. Before updating, check if a row already exists with the same email and the new `signup_type`
2. If a duplicate exists, delete the old row (the one being edited) and keep the existing row with the target type — then show a toast saying the duplicate was merged
3. If no duplicate, proceed with the normal update

### Changes

**`src/pages/admin/EarlyAccessLeads.tsx` — `saveEdit` function (~lines 120-137)**

Replace with logic that:
- Detects if `signup_type` changed
- If changed, queries for an existing row with the same email + new type
- If found, deletes the current row being edited (merging into the existing one) and toasts "Lead merged — duplicate removed"
- If not found, performs the normal update

This is a single-file, frontend-only change. No migration needed.

