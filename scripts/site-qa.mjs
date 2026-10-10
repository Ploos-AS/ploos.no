import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const base = 'https://ploos.no';
const failures = [];
const fail = (message) => failures.push(message);
async function walk(dir) {
  const results = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...await walk(p));
    else if (entry.isFile() && entry.name === 'index.html') results.push(p);
  }
  return results;
}
const files = await walk(root);
if (files.length < 10) fail('Expected at least ten generated website pages.');
const toUrlPath = file => {
  const rel = path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).join('/');
  return rel ? '/' + rel + '/' : '/';
};
const paths = new Set(files.map(toUrlPath));
const sorted = [...paths].sort();
const htmlByPath = new Map(await Promise.all(files.map(async file => [toUrlPath(file), await readFile(file, 'utf8')])));
const contactPages = ['/kontakt/', '/en/contact/', '/brukt-it-utstyr/'];
const contactConfigured = Boolean(process.env.PUBLIC_CONTACT_ENDPOINT && process.env.PUBLIC_TURNSTILE_SITE_KEY);
if (Boolean(process.env.PUBLIC_CONTACT_ENDPOINT) !== Boolean(process.env.PUBLIC_TURNSTILE_SITE_KEY)) fail('Contact form has only one of the required public build variables.');
if (!paths.has('/')) fail('Norwegian home is missing.');
if (!paths.has('/en/')) fail('English home is missing.');
if (!paths.has('/brukt-it-utstyr/')) fail('Norwegian SMB landing page is missing.');

for (const file of files) {
  const urlPath = toUrlPath(file);
  const html = htmlByPath.get(urlPath);
  if (!/<main id="main">/.test(html)) fail(urlPath + ': missing main landmark');
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) fail(urlPath + ': expected exactly one h1');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(urlPath + ': title missing');
  if (!/<meta name="description"/.test(html)) fail(urlPath + ': description missing');
  if (!/<meta property="og:title"/.test(html)) fail(urlPath + ': Open Graph title missing');
  if (!/<link rel="canonical"/.test(html)) fail(urlPath + ': canonical missing');
  if (!html.includes('href="' + base + urlPath + '"')) fail(urlPath + ': canonical URL incorrect');
  if (/<a\b[^>]*href="mailto:/i.test(html)) fail(urlPath + ': public email address link');
  if (/Nedre Høgåsen|4440 Tonstad|Sirdal, (?:Norge|Norway)/i.test(html)) fail(urlPath + ': undesired location disclosure');
  if (urlPath.startsWith('/en/') && !/<html lang="en"/.test(html)) fail(urlPath + ': English language tag missing');
  if (!urlPath.startsWith('/en/') && !/<html lang="nb"/.test(html)) fail(urlPath + ': Norwegian language tag missing');
  for (const match of html.matchAll(/href="#([A-Za-z][\w-]*)"/g)) {
    if (!html.includes('id="' + match[1] + '"')) fail(urlPath + ': missing in-page anchor #' + match[1]);
  }
  if (contactPages.includes(urlPath)) {
    if (contactConfigured && !html.includes('data-contact-form')) fail(urlPath + ': configured form missing from output');
    if (!contactConfigured && html.includes('data-contact-form')) fail(urlPath + ': form unexpectedly active without configuration');
    if (!html.includes(urlPath.startsWith('/en/') ? '/en/privacy/' : '/personvern/')) fail(urlPath + ': missing privacy link');
  }
  for (const match of html.matchAll(/\bhref="(\/[^"#?]*)[^"]*"/g)) {
    const target = match[1];
    if (!paths.has(target) && !paths.has(target.endsWith('/') ? target : target + '/')) {
      // Static assets and non-page links are handled separately.
      try { await stat(path.join(root, target)); }
      catch { fail(urlPath + ': missing internal link ' + target); }
    }
  }
}

const translations = {'/':'/en/','/om-oss/':'/en/about/','/partnere/':'/en/partners/','/kontakt/':'/en/contact/','/personvern/':'/en/privacy/'};
for (const [no, en] of Object.entries(translations)) {
  if (!htmlByPath.has(no) || !htmlByPath.has(en)) { fail('Missing bilingual page pair: ' + no + ' / ' + en); continue; }
  if (!htmlByPath.get(no).includes('href="' + base + en + '"')) fail(no + ': English hreflang target absent');
  if (!htmlByPath.get(en).includes('href="' + base + no + '"')) fail(en + ': Norwegian hreflang target absent');
}
if (!contactConfigured) console.warn('WARN: Contact form is unconfigured in this build. Live contact delivery is NOT_TESTED.');
if (failures.length) {
  for (const failure of failures) console.error('FAIL:', failure);
  process.exit(1);
}
const xmlEscape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  sorted.map(p => '  <url><loc>' + xmlEscape(base + p) + '</loc></url>').join('\n') +
  '\n</urlset>\n';
await writeFile(path.join(root, 'sitemap.xml'), sitemap);
console.log('PASS: ' + files.length + ' pages checked, local links verified, sitemap generated.');
