
SELECT cron.schedule(
  'retry-failed-notifications',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wknelhrmgspuztehetpa.supabase.co/functions/v1/retry-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
