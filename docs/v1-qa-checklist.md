# Ploos.no — v1.0 QA checklist

**Status:** source/build checks supplemented with manual verification; this file is not a certificate of a live production test.

## Automated checks (GitHub Actions / npm run build)

- Astro type check, static build and all internal page paths.
- Exactly one H1 and a main landmark per generated page.
- Canonical links, page metadata, language tags, reciprocal translated page links, and in-page anchors.
- Detect undesired public email links / disallowed company location disclosures.
- If both public contact build variables exist, ensure all three contact form placements render; if missing, warn that contact delivery is **NOT_TESTED**. Fail on partial contact configuration.
- Generate sitemap.

## Manual production checks — not yet verified

| Task | Current state |
| --- | --- |
| https://ploos.no and https://www.ploos.no over HTTPS, redirect and canonical host | NOT_TESTED independently (owner reports both open) |
| Norwegian and English navigation at 320px, 375px, 768px, 1280px and keyboard only | NOT_TESTED |
| Contact form visible on /kontakt/, /en/contact/, /brukt-it-utstyr/ | NOT_TESTED on production |
| Turnstile passes on both languages and blocks invalid submission | NOT_TESTED |
| An authorized test enquiry reaches Proton inbox (check spam folder); no sensitive data in logs | NOT_TESTED |
| Cloudflare Worker CORS origin policy, rate limits, failed SMTP path and abuse protections | NOT_TESTED in deployed environment |
| External HackShack and Labs URLs resolve or are clearly marked as prelaunch | NOT_TESTED |
| Review Norwegian/English privacy copy, agreements, retention and transfer safeguards | PENDING legal/operational review |
| Logo, icon, spacing, focus states, reduced motion and accessible form errors on actual devices | NOT_TESTED |

## Deployment gates

Do not tag v1.0.0 solely on green CI. Confirm contact delivery, small-screen navigation, external prelaunch links and privacy/retention process first. GitHub Pages remains the selected hosting platform; Cloudflare Pages / VPS migrations are deferred.
