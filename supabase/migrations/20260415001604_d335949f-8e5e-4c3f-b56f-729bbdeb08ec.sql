ALTER TABLE public.vip_accounts ADD COLUMN email_opened_at timestamptz;
ALTER TABLE public.vip_accounts ADD COLUMN brevo_message_id text;