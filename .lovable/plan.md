

## Multi-Template Email System for Beta Testers

### What You Get
- A **Beta Tester Welcome** email template pre-loaded in the template editor alongside the existing VIP Invite template
- A **template selector dropdown** so you can pick which template to use before sending
- Templates stored in localStorage (same pattern as today) with unique keys per template
- Each template has its own set of placeholders documented in the editor

### Changes

**`src/pages/Admin.tsx`**

1. **Template registry** — Replace the single `emailTemplate` state with a multi-template system:
   - `vip_invite` (existing default template, unchanged)
   - `beta_welcome` (new template welcoming beta testers, thanking them for signing up, explaining how to report bugs via the feedback widget, and setting expectations)
   - `beta_update` (new template for sending product updates/changelog to beta testers)
   
2. **Template selector** — Add a dropdown above the editor to switch between templates. Each template loads/saves independently in localStorage (`vip_email_template`, `beta_welcome_template`, `beta_update_template`).

3. **Placeholder docs** — Update the placeholder hint text dynamically per template. Beta templates use `{{first_name}}` and `{{app_url}}` instead of `{{signup_url}}`.

4. **Send flow integration** — When sending from the Early Access Leads page or VIP section, the selected template name is passed along so the correct HTML is used. Add a template picker dropdown to the VIP invite send area.

**`src/pages/admin/EarlyAccessLeads.tsx`**

5. **"Send Email" action** — Add a "Send Email" button that lets you select beta testers (individually or filtered batch), pick a template (beta_welcome or beta_update), and send via the existing `vip-invite` edge function (which already supports `custom_html`).

**`supabase/functions/vip-invite/index.ts`**

6. Minor update — Accept a `template_name` field for logging purposes so you can track which template was used in the audit trail.

### Template Content (Beta Welcome)
The beta welcome template will include:
- Magic Pass Plus branding header
- Personal greeting with `{{first_name}}`
- Thank you for joining the beta program
- What to expect (features in testing, rough timelines)
- How to report bugs (mention the in-app feedback button)
- CTA button linking to the app
- Footer with unsubscribe/opt-out language (marketing compliance)

### How Template Selection Works
1. Open Email Template Editor in Admin
2. Use the dropdown to switch between: **VIP Invite**, **Beta Welcome**, **Beta Update**
3. Edit and save — each saves independently
4. When sending an invite or beta email, the currently selected template is used
5. The Early Access Leads page gets a "Send Email" flow with its own template picker

