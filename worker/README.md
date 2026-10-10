# Ploos contact receiver — Proton SMTP

Site: GitHub Pages. DNS: Domeneshop. Mail: **Proton Mail**. Receiver: Cloudflare Worker at a `workers.dev` URL. There is **no Resend/Brevo dependency**.

## Set up securely

1. In Proton Mail select Settings → All settings → IMAP/SMTP → SMTP tokens and generate an SMTP token named `ploos.no-contact-form` for an active custom-domain address. The SMTP username is the address. The token is shown once only; never share it in chat or commit it.
2. In Cloudflare create a Workers account, run `cd worker && npx wrangler login && npx wrangler deploy`. Note the HTTPS `workers.dev` URL. Leave Domeneshop nameservers and Proton MX, SPF, DKIM and DMARC unchanged.
3. In Cloudflare Turnstile create a widget for `ploos.no` and `www.ploos.no`; note the public site key and secret.
4. Add Worker secrets interactively using Wrangler:
   - `npx wrangler secret put PROTON_SMTP_USERNAME` — full Proton custom-domain address
   - `npx wrangler secret put PROTON_SMTP_TOKEN` — generated Proton SMTP token (never the Proton account password)
   - `npx wrangler secret put CONTACT_TO_EMAIL` — receiving mailbox, may be the same address
   - `npx wrangler secret put TURNSTILE_SECRET_KEY` — Turnstile secret
   - Optional: `npx wrangler secret put CONTACT_FROM_EMAIL` — must be a Proton-authorized sender address
5. In GitHub repo Settings → Secrets and variables → Actions → **Variables**, configure:
   - `PUBLIC_CONTACT_ENDPOINT` — HTTPS `workers.dev` URL
   - `PUBLIC_TURNSTILE_SITE_KEY` — public Turnstile site key
6. After verifying that the Worker can authenticate to Proton and send email, re-run GitHub Pages deployment. The form remains hidden until both public build variables exist. Test both `/kontakt/` and `/en/contact/` and verify actual receipt.
7. Apply rate limiting and review privacy terms before activating submissions. Turnstile checks are enforced by the Worker, not merely the browser.

**Security:** The Worker negotiates STARTTLS on `smtp.protonmail.ch:587` before SMTP AUTH. The token, recipient address and sender address stay server-side. Proton SMTP submission is transport encrypted but the messages are not end-to-end encrypted.

No Cloudflare DNS migration is necessary. SMTP sending does not require changes to the existing Proton DNS entries at Domeneshop.

## Testing / caveats
- `npm run check` and `npm run build` validate the static site, not real SMTP delivery. A real end-to-end test with Worker credentials is required.
- If the Worker runtime cannot establish SMTP submission in the selected Cloudflare account/plan, consider a small dedicated SMTP relay or a different backend.
- Never print SMTP replies containing credentials in logs.
