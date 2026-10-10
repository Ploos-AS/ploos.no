# ploos.no

Official Norwegian/English company website for Ploos AS.

## Technology
Astro 5, Tailwind CSS 4, static generation and GitHub Pages. No server, cookies, trackers or database.

## Scope
- Official Ploos AS presentation
- HackShack (online store in development)
- HackShack Labs (planned testing and documentation)
- Open-source projects via GitHub
- Norwegian and English supplier/partner landing pages

shells.no is intentionally excluded.

## Development
Install Node.js 22+; run:

```sh
npm install
npm run dev
npm run check
npm run build
```

## Publishing
1. Merge pull request to `main` once validation succeeds.
2. In repository Settings → Pages, select **GitHub Actions** as source.
3. Enter custom domain `ploos.no` in GitHub Pages settings.
4. Point DNS A/AAAA and www CNAME records to GitHub Pages. **Preserve email DNS records.**
5. Enable HTTPS when certificate is ready. Confirm the domain is verified.
6. Any future push to `main` deploys automatically.

The deployed `public/CNAME` file is set to `ploos.no`; it doesn't replace configuration of Pages settings.

## Licensing
MIT for code and CC BY 4.0 for original editorial text. Names, brand marks and third-party assets excluded.
