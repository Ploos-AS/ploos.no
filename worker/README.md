# Ploos private contact receiver

GitHub Pages cannot receive and deliver form submissions by itself. This Cloudflare Worker receives contact requests at https://contact.ploos.no/ and forwards messages using Resend's API. Recipient and sender email addresses live **only in Worker secrets**, not in public HTML, JavaScript, or this Git repository.

## Setup (required before the form can deliver)
1. Set up a Cloudflare account controlling the DNS zone for ploos.no. If DNS is elsewhere, move DNS hosting to Cloudflare or adapt the Worker route to a workers.dev address and update the website endpoint.
2. Configure a Resend account and verify a sending domain. Check Resend's data processing terms and select a suitable region/plan.
3. Deploy via Wrangler: `cd worker && npx wrangler deploy`. Create/configure the proxied DNS record and route for contact.ploos.no. Ensure TLS is active.
4. Add these three secrets (never plaintext vars or repo files):
   - `npx wrangler secret put RESEND_API_KEY`
   - `npx wrangler secret put CONTACT_TO_EMAIL`
   - `npx wrangler secret put CONTACT_FROM_EMAIL`
5. Send an end-to-end test from https://ploos.no/kontakt/ and https://ploos.no/en/contact/ and confirm receipt.
6. Add Cloudflare WAF/rate limiting and preferably Turnstile before promoting the form; the honeypot alone is not robust bot protection.

The browser sees only the receiver URL; it cannot read the recipient address. A sender enters their own email address so we can reply. This is **not anonymous**: processing contact data involves Cloudflare and Resend. Publish a suitable privacy notice before accepting production submissions.

Note: Removing a visible address does not make a previously published address private; email addresses may remain in Git history and search engine caches. Never commit API tokens or the private receiving address.
