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
const paths = new Set(files.map(f => '/' + path.relative(root, path.dirname(f)).split(path.sep).filter(Boolean).join('/') + '/'));
const sorted = [...paths].sort();
if (!paths.has('/')) fail('Norwegian home is missing.');
if (!paths.has('/en/')) fail('English home is missing.');
if (!paths.has('/brukt-it-utstyr/')) fail('Norwegian SMB landing page is missing.');

for (const file of files) {
  const urlPath = '/' + path.relative(root, path.dirname(file)).split(path.sep).filter(Boolean).join('/') + '/';
  const html = await readFile(file, 'utf8');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(urlPath + ': title missing');
  if (!/<meta name="description"/.test(html)) fail(urlPath + ': description missing');
  if (!/<meta property="og:title"/.test(html)) fail(urlPath + ': Open Graph title missing');
  if (!/<link rel="canonical"/.test(html)) fail(urlPath + ': canonical missing');
  if (!html.includes('href="' + base + urlPath + '"')) fail(urlPath + ': canonical URL incorrect');
  if (/<a\b[^>]*href="mailto:/i.test(html)) fail(urlPath + ': public email address link');
  if (/Nedre Høgåsen|4440 Tonstad|Sirdal, (?:Norge|Norway)/i.test(html)) fail(urlPath + ': undesired location disclosure');
  if (urlPath.startsWith('/en/') && !/<html lang="en"/.test(html)) fail(urlPath + ': English language tag missing');
  if (!urlPath.startsWith('/en/') && !/<html lang="nb"/.test(html)) fail(urlPath + ': Norwegian language tag missing');
  for (const match of html.matchAll(/\bhref="(\/[^"#?]*)[^"]*"/g)) {
    const target = match[1];
    if (!paths.has(target) && !paths.has(target.endsWith('/') ? target : target + '/')) {
      // Static assets and non-page links are handled separately.
      try { await stat(path.join(root, target)); }
      catch { fail(urlPath + ': missing internal link ' + target); }
    }
  }
}

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
