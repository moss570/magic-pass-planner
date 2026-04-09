-- Bulk reset: mark all events as scrapable
UPDATE events SET scrapable = true WHERE is_active = true;

-- Flag known walk-up / phone-only events back to not scrapable
UPDATE events SET scrapable = false WHERE event_name IN (
  'Chip ''n'' Dale''s Campfire Sing-A-Long',
  'Discovery Island Nature Walk',
  'Disney Private VIP Tours',
  'Disney PhotoPass Studio',
  'Contemporary Resort Watercraft Rental',
  'Fort Wilderness Archery Experience'
);