# External Clean Guernsey: website + client dashboard

A fast static website. All text, photos, reviews, news and banner are edited in a simple dashboard ([Pages CMS](https://pagescms.org)). No coding needed. Every save rebuilds the site automatically.

## How it fits together
```
content/          ALL editable text (JSON) + news posts (content/news/*.md)   <- the CMS edits these
public/images/    photos and logo                                              <- the CMS uploads here
public/fonts, js  fonts and small script
src/              page templates (HTML) and custom CSS                         <- developer only
build.js          turns content + templates into the finished site in dist/
.pages.yml        defines the CMS dashboard forms
tailwind.config.js brand colours and fonts
```
Generated automatically on every build: `sitemap.xml`, `robots.txt`, one page per service, one page per news article, Google structured data, social share tags, caching headers.

## Go live (one-time setup, about 20 minutes)
1. **GitHub:** push this folder to a new GitHub repo (owned by the client, or yours and invite them).
2. **Cloudflare Pages:** Create project > connect the repo. Build command `npm run build`, output directory `dist`. Add an environment variable `NODE_VERSION` = `20`. Then add the custom domain.
3. **Dashboard:** go to https://app.pagescms.org, sign in with GitHub, add the repo. Share the dashboard link with the client (they need a GitHub account with access to the repo).
4. **Form:** after the site is live, send one test quote. FormSubmit emails an activation link to the business email. Click it once.
5. **Check `content/site.json`:** make sure `url` is the real domain, then confirm the phone number (the van says 07781 123248, Facebook said 07781 122348).

## What the client can edit in the dashboard
- **Announcement banner:** type text and it appears at the top of every page. Empty = hidden.
- **News posts:** add a post with title, date, short description, optional image, optional full article. No image = clean text card; image = text left, photo right. No posts = the News section disappears. Untick "Published" to hide a post.
- **Homepage top section:** headline, description, buttons, van image.
- **Services:** titles, descriptions, photos and a full description for each service's own Google-friendly page. Add or remove services freely.
- **Before/after photos, how-it-works steps, reviews, FAQs, quote form options.**
- **Business details, logo, share image, Google title/description, areas covered.**
Empty lists (e.g. no reviews) hide that section automatically.

## SEO checklist after launch
- In **Google Search Console** add the domain and submit `https://YOURDOMAIN/sitemap.xml`.
- Create/claim a **Google Business Profile** (biggest local ranking boost) and use the same name, phone and address as the site.
- Replace the placeholder reviews with real ones and add real photos. Fill in each service's full description (200+ words each ranks best).
- Keep `site.json` areas up to date. Post news now and then.

## Developer notes
- Local preview: `npm install` then `npm run dev` (opens http://localhost:3000).
- Pages CMS config was written from its documented format. If a field misbehaves on first login, check `.pages.yml` against https://pagescms.org/docs.
- Favicons are static files in `public/images` (not CMS-editable on purpose).
- Hero house art and floating cleaning items are SVGs in `public/images/art/`.
