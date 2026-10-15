# Tips for Everyday

Practical, step-by-step answers to everyday household problems — cleaning, organizing, fixing, and saving money.

**Live site:** https://tips-for-everyday.com
**Stack:** Astro 5 (static) · Cloudflare Pages · AdSense
**Content:** 63 in-depth guides · 89 pages · ~143,500 words

---

## Content structure

Every guide follows the same fixed structure:

- **Step 0** — identify the material or surface before you touch it
- **Method** — numbered steps with specific ratios, dwell times, and tools
- **Why this works** — the mechanism behind the method
- **What NOT to do** — the common mistakes that cause permanent damage
- **FAQ** — 6+ questions targeting featured snippets

The editorial stance is diagnosis before action: most household damage comes from applying the right method to the wrong material. Each guide also carries contrast tables, since ranking matters more than the list — the differences in payoff between items are large.

| Category | Guides | Subcategories |
|---|---|---|
| Home Hacks | 23 | Cleaning · Laundry · Appliances · Stains |
| Save Money | 19 | Groceries · Bills · Shopping |
| Organize | 7 | Kitchen · Closet · Small Spaces · Home Systems |
| Kitchen Tips | 6 | Food Storage · Cooking Hacks |
| Fix It | 8 | Home Repair · Maintenance · Plumbing |

---

## Project layout

```
src/
  content/articles/    63 markdown guides (frontmatter validated at build)
  content/config.ts    zod schema — build fails on missing metadata
  layouts/             BaseLayout · ArticleLayout · CategoryLayout
  components/          AdSlot · Breadcrumb · FaqSection · RelatedPosts · StructuredData
  pages/               index · [category] · [category]/[subcategory] · [...path] · static pages
  utils/site-config.ts All site settings, including AdSense IDs
  styles/global.css    Single stylesheet, no framework
public/
  ads.txt  robots.txt  _headers  _redirects
scripts/
  preflight.mjs              14-point pre-deploy audit
  backlinks.mjs              auto-maintain bidirectional internal links
  fix-duplicate-related.mjs  one-off repair for duplicate frontmatter keys
```

---

## Local development

Requires Node 18.20.8+, 20.3.0+, or 22+.

```bash
npm install
npm run dev      # dev server
npm run build    # build to dist/
npm run preview  # preview the build
```

---

## Deployment

This project uses a **two-branch static-asset workflow**, not Cloudflare-side building.

| Branch | Contents | Purpose |
|---|---|---|
| `main` | Built HTML from `dist/` | Published by Cloudflare Pages |
| `source` | Astro source + markdown | Editing and rebuilding |

Because `main` contains finished HTML, the Cloudflare Pages build command is left **empty** — Cloudflare serves the repository root directly. (With Pages build system v3, an empty build command means the build step is skipped.)

**Update routine:**

```bash
git checkout source          # 1. edit markdown
npm run build                # 2. rebuild
git checkout main            # 3. switch
git rm -rq --cached .        # 4. clear old HTML, copy fresh dist/ over root
git add -A && git commit -m "Publish update"
git push origin main
git push origin source
```

Always run `node scripts/preflight.mjs` before deploying.

Full walkthrough — custom domain setup, post-launch checks, and troubleshooting — is in [DEPLOY.md](./DEPLOY.md).

---

## Configuration

All AdSense settings live in one place, `src/utils/site-config.ts`:

```ts
adsenseClient: 'ca-pub-4150144052388028'   // publisher ID
AD_SLOTS: {
  articleTop:    '3840545729',             // horizontal banner
  articleInline: '7304313863',             // in-article square
  categoryTop:   '3840545729',             // reused
}
```

Ad units self-suppress when unset, so leaving a slot blank means no ad renders there rather than an error. The AdSense loader script is injected once per page from `BaseLayout` — individual ad slots only render the unit and its push call.

`ga4MeasurementId` is still a placeholder. It is optional and does not block anything; the GA4 script is skipped while it contains `XXXX`.

---

## Maintenance

```bash
node scripts/preflight.mjs   # 14-point audit — run before any deploy
node scripts/backlinks.mjs   # rebuild bidirectional internal links
```

The preflight checks sitemap/robots consistency, internal links for dead ends, canonical URLs, duplicate titles and descriptions, JSON-LD validity, content volume (≥1200 words per guide), FAQ coverage, and ad configuration.
