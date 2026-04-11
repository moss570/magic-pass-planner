# Inbound Email Setup — Reservations Inbox

This document covers the AWS SES + SNS pipeline that powers email forwarding to the Reservations Inbox.

## Architecture

```
User forwards email
  → trips+<token>@inbox.magicpassplus.com
  → MX → SES Inbound
  → S3 (raw MIME storage)
  → SNS notification
  → Edge Function: inbound-email-handler
  → Edge Function: reservations-parse (LLM extraction)
  → reservations_inbox table
```

## DNS Records for inbox.magicpassplus.com

| Type  | Name                       | Value                                        | TTL  |
|-------|----------------------------|----------------------------------------------|------|
| MX    | inbox.magicpassplus.com    | 10 inbound-smtp.us-east-1.amazonaws.com      | 3600 |
| TXT   | inbox.magicpassplus.com    | v=spf1 include:amazonses.com -all            | 3600 |
| TXT   | _dmarc.inbox.magicpassplus.com | v=DMARC1; p=reject; rua=mailto:dmarc@magicpassplus.com | 3600 |
| CNAME | (DKIM selector 1)         | (provided by SES after domain verification)  | 3600 |
| CNAME | (DKIM selector 2)         | (provided by SES after domain verification)  | 3600 |
| CNAME | (DKIM selector 3)         | (provided by SES after domain verification)  | 3600 |

## AWS Setup Checklist

### 1. SES Domain Verification
- Go to AWS SES Console → Verified identities → Create identity
- Choose "Domain" and enter `inbox.magicpassplus.com`
- Add the DKIM CNAME records to DNS
- Wait for verification (usually < 1 hour)

### 2. S3 Bucket
- Create bucket: `mpp-inbound-email`
- Region: `us-east-1`
- Enable versioning
- Add lifecycle rule:
  - Transition to Glacier after 30 days
  - Delete after 180 days
- Bucket policy: allow SES to write objects

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ses.amazonaws.com" },
    "Action": "s3:PutObject",
    "Resource": "arn:aws:s3:::mpp-inbound-email/*",
    "Condition": {
      "StringEquals": { "AWS:SourceAccount": "<AWS_ACCOUNT_ID>" }
    }
  }]
}
```

### 3. IAM Role
- Create IAM user or role: `mpp-ses-inbound-reader`
- Attach policy:
  - `s3:GetObject` on `arn:aws:s3:::mpp-inbound-email/*`
  - `sns:Publish` on the inbound topic (optional)
- Generate access key and secret
- Store in Supabase Vault:
  - `aws_ses_inbound_access_key`
  - `aws_ses_inbound_secret`
  - `aws_ses_inbound_region` = `us-east-1`

### 4. SNS Topic
- Create topic: `mpp-inbound-email-topic`
- Create HTTPS subscription pointing to:
  ```
  https://wknelhrmgspuztehetpa.supabase.co/functions/v1/inbound-email-handler
  ```
- The edge function handles SNS subscription confirmation automatically

### 5. SES Receipt Rule Set
- Go to SES Console → Email receiving → Create rule set: `inbox-all`
- Create rule:
  - Recipients: `*@inbox.magicpassplus.com`
  - Actions:
    1. S3 → bucket `mpp-inbound-email`
    2. SNS → topic `mpp-inbound-email-topic`
- Set this rule set as active

## Supabase Secrets Required

| Secret Name                    | Description                          |
|-------------------------------|--------------------------------------|
| `aws_ses_inbound_access_key`  | IAM access key for S3 read           |
| `aws_ses_inbound_secret`      | IAM secret key                       |
| `aws_ses_inbound_region`      | AWS region (us-east-1)               |

These should be stored in Supabase Vault (Dashboard → Settings → Vault), not in environment variables.

## Security Considerations

- **SPF/DKIM verification**: The inbound-email-handler checks sender domain against an allow-list of known travel domains
- **Rate limiting**: Max 50 inbound emails per user per 24 hours
- **Token rotation**: Users can rotate their forwarding token, invalidating the old address
- **Content sanitization**: Script tags, iframes, and instruction-like patterns are stripped before LLM parsing
- **LLM prompt injection defense**: The parser explicitly instructs the LLM to ignore directives in email content

## Monitoring

- `inbound_email_events` table tracks all inbound emails with status codes
- `price_check_runs` table can be extended for parse job observability
- Admin-only RLS on `inbound_email_events` — only authorized admins can view

## Troubleshooting

1. **Emails not arriving**: Check MX record propagation with `dig MX inbox.magicpassplus.com`
2. **SNS not triggering**: Verify subscription is confirmed in SNS console
3. **Parse failures**: Check `reservations_inbox.status = 'failed'` rows and edge function logs
4. **Token rejected**: User may have rotated their address — check `forwarding_token_rotated_at`
