# Contact receiver — GitHub Pages + Domeneshop DNS

The contact form cannot deliver messages using GitHub Pages alone. The Worker receives submissions via its `workers.dev` hostname and sends mail through Resend. **Domeneshop stays the DNS provider; no nameserver move or Cloudflare proxy is needed.**

## Configure backend
1. Create a Cloudflare account (free Workers plan may suffice subject to current service limits).
2. From this directory run `npx wrangler login`, then `npx wrangler deploy`. Save the resulting `https://ploos-contact.<account>.workers.dev/` URL.
3. Create a Resend account, verify a **sending subdomain** such as `mail.ploos.no`. In Domeneshop, create exactly the verification/DKIM/SPF records Resend supplies for this subdomain. **Do not replace ploos.no MX or other existing mail records.**
4. Set secrets from the worker directory, supplying values interactively:
   - `npx wrangler secret put RESEND_API_KEY`
   - `npx wrangler secret put CONTACT_TO_EMAIL`
   - `npx wrangler secret put CONTACT_FROM_EMAIL`
5. In GitHub repository **Settings → Secrets and variables → Actions → Variables**, create `PUBLIC_CONTACT_ENDPOINT` with the exact `workers.dev` HTTPS URL.
6. Re-run the **Deploy GitHub Pages** workflow; verify both Norwegian and English contact forms by sending test messages and checking actual receipt. Before this setting exists, the website displays an honest "temporarily unavailable" notice instead of a broken form.
7. Add server-side rate limiting (Cloudflare WAF/Turnstile or equivalent) before public use; the honeypot is only a basic protection. Publish accurate privacy information covering the contact form, Resend and Cloudflare before collecting submissions.

Recipient and sender email addresses stay in **Worker secrets**, not in browser-side code or the Git repository. API tokens must never be committed.

Note: Earlier published addresses can remain visible in git history or search engine caches; removing live links does not erase previously published text.
