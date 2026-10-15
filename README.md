# Tips for Everyday

Practical, step-by-step answers to everyday household problems — cleaning, organizing, fixing, and saving money.

**Live site:** https://tips-for-everyday.com
**Stack:** Astro 5 (static) · Cloudflare Pages · AdSense

---

## About the content

44 in-depth guides across 5 categories and 14 subcategories, roughly 110,000 words total. Every guide is written to a fixed structure:

- **Step 0** — identify the material or surface before you touch it
- **Method** — numbered steps with specific ratios, dwell times, and tools
- **Why this works** — the mechanism behind the method
- **What NOT to do** — the common mistakes that cause permanent damage
- **FAQ** — 6+ questions targeting featured snippets

The editorial stance is diagnosis before action: most household damage comes from applying the right method to the wrong material.

| Category | Guides | Subcategories |
|---|---|---|
| Home Hacks | 21 | Cleaning · Laundry · Appliances · Stains |
| Save Money | 9 | Groceries · Bills · Shopping |
| Organize | 10 | Kitchen · Closet · Small Spaces |
| Kitchen Tips | 8 | Food Storage · Cooking Hacks |
| Fix It | 10 | Home Repair · Maintenance |

---

## Project layout

```
src/
  content/articles/    44 markdown guides (frontmatter validated at build)
  content/config.ts    zod schema — build fails on missing metadata
  layouts/             BaseLayout · ArticleLayout · CategoryLayout
  components/          AdSlot · Breadcrumb · FaqSection · RelatedPosts · StructuredData
  pages/               index · [category] · [category]/[subcategory] · [...path] · static pages
  utils/site-config.ts All site settings, including AdSense IDs
  styles/global.css    Single stylesheet, no framework
public/
  ads.txt  robots.txt  _headers  _redirects
scripts/
  preflight.mjs        14-point pre-deploy audit
```

Built output goes to `dist/`, which is gitignored — Cloudflare builds it from source on every push.

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

Pushes to `main` trigger an automatic Cloudflare Pages build. Build settings:

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| `NODE_VERSION` | `22` |

Full walkthrough — including custom domain setup, post-launch checks, and the routine update workflow — is in [DEPLOY.md](./DEPLOY.md).

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

Ad units self-suppress when unset, so leaving a slot blank simply means no ad renders there rather than an error. The AdSense loader script is injected once per page from `BaseLayout`.

---

## Maintenance

```bash
node scripts/preflight.mjs   # run before any deploy
```

The audit checks sitemap/robots consistency, internal links for dead ends, canonical URLs, duplicate titles and descriptions, JSON-LD validity, content volume, FAQ coverage, and ad configuration.
