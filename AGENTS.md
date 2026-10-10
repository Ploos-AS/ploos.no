# Ploos AS website contributor guidance
- Keep Norwegian and English content aligned in substance.
- Present HackShack and Labs as under development until separately verified live.
- Scope is ploos.no company profile, HackShack, HackShack Labs, and Ploos open-source projects on GitHub. Do not introduce shells.no.
- Never publish a Ploos business email address in website HTML, client scripts or structured data. The contact form uses a secret-backed Worker.
- Do not include company street address, postal town or municipality in visible text or SEO/JSON-LD markup. Organization number 931 173 723 is approved.
- Preserve the working Turnstile/Proton contact flow, repository deployment settings, and public environment variables.
- Accessibility: semantic headings, labels, keyboard navigation, focus styles, reduced motion.
- No third-party tracking without explicit permission.
- Run npm run check and npm run build before merging; build runs scripts/site-qa.mjs and generates sitemap.xml in dist.
