

## Update Railway Poller URL and Test End-to-End

### What's happening
The `RAILWAY_POLLER_URL` secret in Supabase currently points to the old Railway project (`dining-poller-production.up.railway.app`). We need to update it to the new project URL and verify the full flow works.

### Steps

1. **Update the `RAILWAY_POLLER_URL` secret** to `https://magic-pass-dining-poller2-production.up.railway.app`

2. **Redeploy the `dining-availability-check` Edge Function** so it picks up the new secret value

3. **Test the health endpoint** of the Railway poller (`/health`) to confirm it's running

4. **Invoke the Edge Function** and check logs to confirm it successfully connects to the new Railway poller without the "Invalid URL" error

### Technical detail
The Edge Function constructs `${railwayUrl}/check` — the old URL was missing `https://`, and even after that fix it pointed to the wrong Railway project. This update fixes both issues.

