# ploos.no

Official bilingual company website for Ploos AS. Astro + Tailwind CSS, published as a static site through GitHub Pages.

## Scope
- Ploos AS company presentation
- HackShack (online store in development)
- HackShack Labs (planned test and documentation resource)
- Open-source work via GitHub
- Norwegian and English supplier pages

shells.no is intentionally excluded.

## Local development

Node.js 22+. Run `npm install`, `npm run dev`, `npm run check`, `npm run build`.

## GitHub Pages deployment

Merge to `main`, then in repository Settings → Pages set **Source: GitHub Actions**. The included workflow builds and deploys `dist/`. Set custom domain to `ploos.no` and configure DNS according to GitHub Pages documentation. Enable HTTPS after DNS resolves. Do not change MX records used for email. Publication is not activated merely by merging the workflow.

## Licensing
Code: MIT. Original editorial text: CC BY 4.0. Company names and trademarks excluded.
