UPDATE public.dining_alerts SET status = 'cancelled', updated_at = now() WHERE restaurant_id = 'd6ad7bed-097b-47c1-94c1-ff63f7d76e13' AND status = 'watching';

INSERT INTO public.dining_alerts (user_id, restaurant_id, alert_date, party_size, meal_periods, status, alert_email, alert_sms)
VALUES ('5bb33711-a09c-4d9c-be02-6351929fb56e', 'd6ad7bed-097b-47c1-94c1-ff63f7d76e13', '2026-05-04', 4, '{Dinner}', 'watching', true, false);