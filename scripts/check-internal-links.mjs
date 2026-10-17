#!/usr/bin/env node
// Validate internal links across all article sources.
//
// Three checks:
//   1. Body markdown links (/category/sub/slug/) resolve to a real article.
//   2. frontmatter relatedSlugs reference existing articles.
//   3. "## Related reading" titles match the title of the referenced slug.
//   4. frontmatter description stays inside the schema limits
//      (src/content/config.ts caps it at 200 chars; very short ones are a
//      sign of a truncated or placeholder value).
//
// Exit code 1 if any check fails. Safe to run repeatedly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART_DIR = path.join(ROOT, 'src/content/articles');

const CAT_SLUGS = {
  'Home Hacks': 'home-hacks',
  'Save Money': 'save-money',
  'Organize': 'organize',
  'Kitchen Tips': 'kitchen-tips',
  'Fix It': 'fix-it',
  'Seasonal & Holiday': 'seasonal',
};

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const fm = {};
  let key = null;
  for (const raw of m[1].split(/\r?\n/)) {
    const item = raw.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (item) {
      key = item[1];
      fm[key] = item[2].replace(/^"|"$/g, '');
    } else if (key && /^\s+-\s+(.*)$/.test(raw)) {
      (fm[key + '__list'] ||= []).push(raw.match(/^\s+-\s+(.*)$/)[1].replace(/^"|"$/g, ''));
    }
  }
  return fm;
}

// Build index: slug -> { title, url }
const articles = new Map();
for (const file of fs.readdirSync(ART_DIR).filter((f) => f.endsWith('.md'))) {
  const slug = file.replace(/\.md$/, '');
  const src = fs.readFileSync(path.join(ART_DIR, file), 'utf8');
  const fm = parseFrontmatter(src);
  if (!fm || !fm.category || !fm.subcategory) continue;
  const cat = CAT_SLUGS[fm.category];
  if (!cat) {
    console.log(`[FATAL] unknown category "${fm.category}" in ${file}`);
    process.exit(1);
  }
  articles.set(slug, {
    title: fm.title,
    description: fm.description || '',
    url: `/${cat}/${slugify(fm.subcategory)}/${slug}/`,
    file,
    related: fm.relatedSlugs__list || [],
    body: src.slice(src.indexOf('\n---\r\n', 3) + 4),
  });
}

const urlToSlug = new Map();
for (const [slug, a] of articles) urlToSlug.set(a.url, slug);
const titleToSlug = new Map();
for (const [slug, a] of articles) titleToSlug.set(a.title, slug);

console.log(`Articles indexed: ${articles.size}`);

let errors = 0;
let bodyLinks = 0;
let relatedRefs = 0;

const DESC_MAX = 200;
const DESC_MIN = 80;

for (const [slug, a] of articles) {
  // 0. description length (schema caps it at DESC_MAX)
  if (a.description.length > DESC_MAX) {
    console.log(`[DESC TOO LONG] ${a.file}: ${a.description.length} chars (max ${DESC_MAX})`);
    errors++;
  } else if (a.description.length < DESC_MIN) {
    console.log(`[DESC TOO SHORT] ${a.file}: ${a.description.length} chars (min ${DESC_MIN})`);
    errors++;
  }

  // 1. body links
  for (const m of a.body.matchAll(/\]\((\/[a-z0-9\-\/]+\/)\)?/g)) {
    const url = m[1];
    bodyLinks++;
    if (urlToSlug.has(url)) continue;
    // allow non-article routes
    if (/^\/(about|contact|privacy-policy|terms|editorial-policy)\/$/.test(url)) continue;
    console.log(`[BROKEN LINK] ${a.file}: ${url}`);
    errors++;
  }

  // 2. relatedSlugs exist
  for (const r of a.related) {
    relatedRefs++;
    if (!articles.has(r)) {
      console.log(`[BAD RELATED] ${a.file}: "${r}" is not an article slug`);
      errors++;
    }
  }

  // 3. Related reading titles match slugs
  const section = a.body.match(/## Related reading\r?\n([\s\S]*?)(?=\r?\n---|\r?\n###)/);
  if (section) {
    const titles = [...section[1].matchAll(/^\s*-\s+(.+?)\s*$/gm)].map((m) => m[1]);
    for (const t of titles) {
      if (!titleToSlug.has(t)) {
        console.log(`[TITLE MISMATCH] ${a.file}: related-reading title not found -> "${t}"`);
        errors++;
      } else if (a.related.length && !a.related.includes(titleToSlug.get(t))) {
        console.log(`[NOT IN FRONTMATTER] ${a.file}: "${t}" (${titleToSlug.get(t)}) missing from relatedSlugs`);
        errors++;
      }
    }
  }
}

console.log(`Body links checked: ${bodyLinks}`);
console.log(`Related refs checked: ${relatedRefs}`);
console.log(errors === 0 ? 'OK: all internal links valid' : `FAILED: ${errors} problem(s)`);
process.exit(errors === 0 ? 0 : 1);
