#!/usr/bin/env node
// Validate the built site in dist/ before pushing to the deploy branch.
//
// Checks:
//   1. Every internal href resolves to a real page in dist/.
//   2. No CJK characters leaked into any built page.
//   3. Every article page has exactly one Related Reading block and an ad slot.
//
// Run after `npm run build`. Exit code 1 on failure. Safe to run repeatedly.
//
// NOTE on path normalisation: the leading "/" must be added BEFORE the
// index.html substitution, or the regex never matches and every "/" link
// is reported as broken.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'dist';

if (!fs.existsSync(ROOT)) {
  console.log('[FATAL] dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const htmlFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.html')) htmlFiles.push(p);
  }
})(ROOT);

let fail = 0;
const check = (ok, msg) => {
  console.log((ok ? '  ok    ' : '  FAIL  ') + msg);
  if (!ok) fail++;
};

// --- 1. internal links -------------------------------------------------------
const existing = new Set(
  htmlFiles.map((f) => ('/' + path.relative(ROOT, f).replace(/\\/g, '/')).replace(/\/index\.html$/, '/')),
);

let total = 0;
let broken = 0;
const reported = new Set();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    let url = m[1];
    if (/\.(xml|txt|svg|css|js|ico|png|jpe?g|webp|woff2?)$/.test(url)) continue;
    if (url.startsWith('/_assets/')) continue;
    if (!url.endsWith('/')) url += '/';
    total++;
    if (existing.has(url)) continue;
    broken++;
    if (!reported.has(url)) {
      reported.add(url);
      if (reported.size <= 10) console.log(`         broken: ${url}  (in ${file})`);
    }
  }
}
check(broken === 0, `internal links: ${total} checked, ${broken} broken`);

// --- 2. CJK leakage ---------------------------------------------------------
const cjk = [];
for (const file of htmlFiles) {
  if (/[\u4e00-\u9fff]/.test(fs.readFileSync(file, 'utf8'))) cjk.push(file);
}
if (cjk.length) cjk.slice(0, 5).forEach((f) => console.log(`         cjk: ${f}`));
check(cjk.length === 0, `cjk characters: ${cjk.length} file(s) affected of ${htmlFiles.length}`);

// --- 3. article page structure ---------------------------------------------
// Article pages live at /<category>/<subcategory>/<slug>/index.html
const articlePages = htmlFiles.filter((f) => {
  const parts = path.relative(ROOT, f).split(path.sep);
  return parts.length === 4 && parts[3] === 'index.html';
});

let badRelated = 0;
let badAds = 0;
for (const file of articlePages) {
  const html = fs.readFileSync(file, 'utf8');
  const relatedBlocks = (html.match(/Related Reading/g) || []).length;
  if (relatedBlocks !== 1) {
    badRelated++;
    if (badRelated <= 5) console.log(`         related blocks = ${relatedBlocks}: ${file}`);
  }
  if (!html.includes('adsbygoogle')) {
    badAds++;
    if (badAds <= 5) console.log(`         missing ad slot: ${file}`);
  }
}
check(badRelated === 0, `related reading blocks: ${articlePages.length} article pages, ${badRelated} with wrong count`);
check(badAds === 0, `ad slots: ${articlePages.length} article pages, ${badAds} missing`);

console.log('');
console.log(fail === 0 ? `全部通过 ✓（${htmlFiles.length} 个 HTML / ${articlePages.length} 篇文章页）` : `失败 ${fail} 项 ✗`);
process.exit(fail === 0 ? 0 : 1);
