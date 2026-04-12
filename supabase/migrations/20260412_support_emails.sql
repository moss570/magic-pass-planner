-- Support Emails table for Admin Console inbox
CREATE TABLE IF NOT EXISTS support_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id TEXT,
  from_address TEXT NOT NULL,
  from_name TEXT,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body_text TEXT,
  body_html TEXT,
  is_outbound BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'sent')),
  in_reply_to UUID REFERENCES support_emails(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_support_emails_status ON support_emails(status);
CREATE INDEX idx_support_emails_received ON support_emails(received_at DESC);

-- RLS
ALTER TABLE support_emails ENABLE ROW LEVEL SECURITY;

-- Only authenticated admin users can access
CREATE POLICY "Admin access to support emails" ON support_emails
  FOR ALL USING (auth.role() = 'authenticated');
