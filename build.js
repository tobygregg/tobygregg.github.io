/* BUILD SCRIPT: turns /content (editable via Pages CMS) + /src templates into the static site in /dist.
   Runs automatically on deploy (Cloudflare Pages build command: npm run build, output folder: dist).
   You normally never need to edit this file. */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const nunjucks = require('nunjucks'), matter = require('gray-matter'), { marked } = require('marked');

const ROOT = __dirname, DIST = path.join(ROOT, 'dist'), C = path.join(ROOT, 'content');
// Reads a content file. If the CMS saves it empty, deletes it or leaves it invalid, we fall back to safe defaults
// instead of crashing the build (a crashed build means the OLD site, banner and all, stays live).
const LIST_KEYS = ['items', 'steps', 'extras', 'areas', 'services'];
const readJSON = (f, defaults = {}) => {
  let parsed = {};
  try { parsed = JSON.parse(fs.readFileSync(path.join(C, f), 'utf8')) || {}; }
  catch (e) { console.warn(`Note: content/${f} is empty or missing (${e.code || e.message}), using defaults.`); }
  const out = { ...defaults, ...parsed };
  for (const k of LIST_KEYS) if (k in out && !Array.isArray(out[k])) out[k] = [];
  return out;
};
const slugify = s => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const write = (rel, data) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };

// ---------- load content ----------
const site = readJSON('site.json', { areas: [] }); site.url = String(site.url || '').replace(/\/$/, '');
const data = { site,
  banner: readJSON('banner.json', { text: '', linkText: '', link: '' }),
  hero: readJSON('hero.json', { van: '/images/van.webp' }),
  services: readJSON('services.json', { items: [], extras: [] }),
  results: readJSON('results.json', { items: [] }),
  process: readJSON('process.json', { steps: [] }),
  reviews: readJSON('reviews.json', { items: [] }),
  faq: readJSON('faq.json', { items: [] }),
  quote: readJSON('quote.json', { services: [] }),
  newsSettings: readJSON('news-settings.json', { heading: 'Latest news', intro: '', limit: 3 }) };

// Banner: spaces/blank lines count as empty, so nothing shows
['text', 'linkText', 'link'].forEach(k => { data.banner[k] = String(data.banner[k] || '').trim(); });

// services: give each a URL (own page)
data.services.items.forEach(s => { s.slug = slugify(s.slug || s.title); s.url = `/services/${s.slug}/`; s.html = marked.parse(s.details || ''); });

// news: markdown files, newest first, drafts and empty files ignored
const newsDir = path.join(C, 'news');
let news = fs.existsSync(newsDir) ? fs.readdirSync(newsDir).filter(f => f.endsWith('.md')).map(f => {
  const { data: fm, content } = matter(fs.readFileSync(path.join(newsDir, f), 'utf8'));
  const d = fm.date ? new Date(fm.date) : new Date();
  const slug = slugify(fm.slug || path.basename(f, '.md'));
  const plain = content.replace(/[#*_>`\[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim();
  return { slug, url: `/news/${slug}/`, title: fm.title || '', summary: fm.summary || (plain.length > 160 ? plain.slice(0, 157) + '...' : plain), image: fm.image || '', published: fm.published !== false,
    date: d, iso: d.toISOString().slice(0, 10), nice: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    body: content.trim(), html: marked.parse(content) };
}) : [];
news = news.filter(n => n.title && n.published).sort((a, b) => b.date - a.date);
data.news = news; data.newsHome = news.slice(0, Number(data.newsSettings.limit) || 3);

// ---------- templating ----------
const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(ROOT, 'src')), { autoescape: true });
env.addFilter('tel', p => { const d = String(p).replace(/[^\d+]/g, ''); return d.startsWith('0') ? '+44' + d.slice(1) : d; });
env.addFilter('abs', u => !u ? '' : /^https?:/.test(u) ? u : site.url + (u.startsWith('/') ? u : '/' + u));
env.addFilter('json', o => JSON.stringify(o).replace(/</g, '\\u003c'));
env.addFilter('trim240', s => String(s).replace(/\s+/g, ' ').slice(0, 160));
env.addGlobal('year', new Date().getFullYear());

fs.rmSync(DIST, { recursive: true, force: true }); fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });

// ---------- structured data (JSON-LD) for Google ----------
const abs = u => !u ? undefined : /^https?:/.test(u) ? u : site.url + (u.startsWith('/') ? u : '/' + u);
const crumbs = list => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: list.map(([name, u], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(u) })) });
const business = { '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness', '@id': site.url + '/#business', name: site.name, url: site.url,
  telephone: site.phone.replace(/\s/g, '').replace(/^0/, '+44'), email: site.email, image: abs(site.shareImage), logo: abs(site.logo),
  description: site.seoDescription, priceRange: 'Free quotes', address: { '@type': 'PostalAddress', addressRegion: 'Guernsey', addressCountry: 'GG' },
  areaServed: (site.areas || []).map(name => ({ '@type': 'Place', name: name + ', Guernsey' })), sameAs: site.facebook ? [site.facebook] : [],
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Services', itemListElement: data.services.items.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.title, description: s.text, url: abs(s.url), areaServed: 'Guernsey' } })) } };
const faqLd = data.faq.items.length ? { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: data.faq.items.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) } : null;

const render = (tpl, rel, ctx) => write(rel, env.render(tpl, { ...data, ...ctx }));
render('index.njk', 'index.html', { page: { path: '/', title: site.seoTitle, description: site.seoDescription, image: site.shareImage, home: true, ld: [business, faqLd].filter(Boolean) } });
data.services.items.forEach(s => render('service.njk', `services/${s.slug}/index.html`, { s, page: { path: s.url,
  title: `${s.title} in Guernsey | ${site.name}`, description: s.text, image: s.image || site.shareImage, solid: true,
  ld: [crumbs([['Home', '/'], ['Services', '/#services'], [s.title, s.url]]), { '@context': 'https://schema.org', '@type': 'Service', name: s.title, description: s.text, url: abs(s.url), image: abs(s.image || site.shareImage), areaServed: 'Guernsey', provider: { '@id': site.url + '/#business' } }] } }));
if (news.length) render('news-index.njk', 'news/index.html', { page: { path: '/news/', title: `${data.newsSettings.heading} | ${site.name}`, description: `News and updates from ${site.name}.`, image: site.shareImage, solid: true, ld: [crumbs([['Home', '/'], ['News', '/news/']])] } });
news.forEach(n => render('news-article.njk', `news/${n.slug}/index.html`, { n, page: { path: n.url, title: `${n.title} | ${site.name}`, description: n.summary || n.title, image: n.image || site.shareImage, solid: true, article: true,
  ld: [crumbs([['Home', '/'], ['News', '/#news'], [n.title, n.url]]), { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: n.title, description: n.summary, datePublished: n.iso, image: abs(n.image || site.shareImage), mainEntityOfPage: abs(n.url), author: { '@type': 'Organization', name: site.name }, publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: abs(site.logo) } } }] } }));
render('404.njk', '404.html', { page: { path: '/404', title: `Page not found | ${site.name}`, description: 'Page not found', image: site.shareImage, solid: true, noindex: true } });

// ---------- SEO files ----------
const urls = ['/', ...data.services.items.map(s => s.url), ...(news.length ? ['/news/', ...news.map(n => n.url)] : [])];
const lastmod = new Date().toISOString().slice(0, 10);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${site.url}${u}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n') + `\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
write('_headers', `/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/images/*\n  Cache-Control: public, max-age=86400\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
write('humans.txt', `${site.name}\n`);

// ---------- CSS ----------
fs.mkdirSync(path.join(DIST, 'css'), { recursive: true });
execSync(`npx tailwindcss -i src/input.css -o dist/css/styles.css --minify`, { cwd: ROOT, stdio: 'inherit' });
console.log(`Built ${urls.length} pages -> dist/`);
