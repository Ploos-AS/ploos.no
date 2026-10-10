# ploos.no

Official Norwegian/English company website for Ploos AS.

## Stack
Astro + Tailwind, static GitHub Pages hosting and Domeneshop DNS. No database. The contact receiver is an optional Cloudflare Worker on `workers.dev`; **Domeneshop remains DNS provider**.

## Scope
- Ploos AS company presentation
- HackShack — store in development
- HackShack Labs — planned tests and documentation
- GitHub open-source projects
- Norwegian and English partner pages

shells.no is intentionally excluded.

## Development
Node.js 22+. Run `npm install`, `npm run dev`, `npm run check`, `npm run build`.

## Publishing
On merge to main, GitHub Actions builds and deploys to GitHub Pages. In Settings → Pages, choose GitHub Actions and domain `ploos.no`. Keep Domeneshop A/AAAA/CNAME pointing to GitHub Pages and preserve mail DNS records.

## Contact form
Do **not** put business email addresses in rendered pages. See [worker/README.md](worker/README.md) for setup. The form stays unavailable until the GitHub Actions repository variable `PUBLIC_CONTACT_ENDPOINT` is set and the Worker and email delivery are configured and tested.

## License
MIT code; CC BY 4.0 original editorial text. Trademarks excluded.
