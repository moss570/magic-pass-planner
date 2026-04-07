
SELECT cron.schedule(
  'check-event-alerts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://wknelhrmgspuztehetpa.supabase.co/functions/v1/event-availability-check',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo"}'::jsonb,
    body:='{"time": "scheduled"}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'priority-event-check',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://wknelhrmgspuztehetpa.supabase.co/functions/v1/event-availability-check',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo"}'::jsonb,
    body:='{"priority": true}'::jsonb
  ) as request_id;
  $$
);
