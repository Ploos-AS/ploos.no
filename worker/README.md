# Contact receiver — Domeneshop DNS + GitHub Pages

GitHub Pages is static; mail cannot be delivered until the backend is configured and tested. Cloudflare Workers runs at a free-style `workers.dev` address while Domeneshop remains authoritative for `ploos.no`.

## Required setup

1. Create/sign into Cloudflare, enable Workers and run `cd worker && npx wrangler login && npx wrangler deploy`. Copy the resulting HTTPS `workers.dev` URL. Cloudflare account access and initial creation must be completed by its owner.
2. Create/sign into Resend and verify a **separate sending subdomain** (for example, `mail.ploos.no`). Add only the DNS records supplied by Resend in Domeneshop. **Never replace existing `ploos.no` MX/SPF/DKIM/DMARC records.** Make sure Resend confirms domain verification.
3. In Cloudflare Turnstile, create a managed widget restricted to `ploos.no` and `www.ploos.no`. Save site key (public) and secret key (private).
4. Set the following confidential Worker secrets, supplying each value interactively, never in GitHub or website source:
   - `npx wrangler secret put RESEND_API_KEY`
   - `npx wrangler secret put CONTACT_TO_EMAIL`
   - `npx wrangler secret put CONTACT_FROM_EMAIL`
   - `npx wrangler secret put TURNSTILE_SECRET_KEY`
5. In GitHub repository **Settings → Secrets and variables → Actions → Variables**, set:
   - `PUBLIC_CONTACT_ENDPOINT` to the exact HTTPS Worker URL
   - `PUBLIC_TURNSTILE_SITE_KEY` to the public Turnstile widget key
6. Re-run **Deploy GitHub Pages** on `main`. Form only renders when both public values exist. Send a real end-to-end test from both `/kontakt/` and `/en/contact/` and confirm successful arrival at the private recipient inbox.
7. Add request rate limiting in Cloudflare for the Worker (where supported) and monitor abusive traffic. Turnstile tokens are verified server-side, bound to the intended action and allowed hostname. A honeypot adds basic protection.
8. Before activation, review both privacy pages, data-processing agreements, location of processing, retention, and add verified legal company/contact details. Do not claim GDPR compliance without completing this review.

Notes: The browser receives only a Worker URL and public Turnstile site key. The recipient mailbox, sender address, Resend API key, and Turnstile secret must never appear in HTML, JavaScript, or repository history. An address previously published might remain in Git history or search engine caches; removing links does not erase history.
