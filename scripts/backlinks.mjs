/**
 * 反向内链补齐脚本
 *
 * 扫描 src/content/articles 下所有文章正文中的站内链接，建立「被引用 → 引用者」
 * 反向图，然后把引用者补进被引用文章的 relatedSlugs（保留已有项，不覆盖）。
 *
 * 目的：保证内链是双向的，避免出现「A 链到 B，但 B 的 Related 里没有 A」的孤儿链接，
 * 这对爬虫抓取与用户跳转都有实际影响。
 *
 * 用法：node scripts/backlinks.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const DIR = 'src/content/articles';
const MAX_RELATED = 5;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

/** 去掉 frontmatter，只保留正文 */
function body(src) {
  const m = src.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return m ? m[1] : src;
}

/** 从正文提取所有站内链接的末段 slug（排除自身） */
function linkedSlugs(src, self) {
  const out = new Set();
  // 匹配形如 (/save-money/bills/some-slug/) 的站内链接，取末段作为 slug
  const re = /\(\/([a-z0-9-]+)\/([a-z0-9-]+)\/([a-z0-9-]+)\/[^)]*\)/g;
  for (const m of body(src).matchAll(re)) {
    const slug = m[3];
    if (slug !== self && files.includes(`${slug}.md`)) out.add(slug);
  }
  return out;
}

/**
 * 匹配 relatedSlugs 块（兼容 LF / CRLF）
 * 行尾必须允许 \r?\n，否则在 CRLF 文件上会匹配失败。
 */
const RELATED_BLOCK_RE = /^relatedSlugs:\r?\n((?:\s+-\s+"[^"]+"\r?\n)*)/m;

/** 读取 frontmatter 里的 relatedSlugs 数组 */
function readRelated(src) {
  const m = src.match(RELATED_BLOCK_RE);
  if (!m) return [];
  return [...m[1].matchAll(/-\s+"([^"]+)"/g)].map((x) => x[1]);
}

// 1. 建立反向图
const backlinks = new Map(); // slug -> Set<引用它的 slug>
for (const f of files) {
  const self = slugOf(f);
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  for (const target of linkedSlugs(src, self)) {
    if (!backlinks.has(target)) backlinks.set(target, new Set());
    backlinks.get(target).add(self);
  }
}

// 2. 补齐
let changed = 0;
const report = [];

for (const f of files) {
  const self = slugOf(f);
  const refs = backlinks.get(self);
  if (!refs || refs.size === 0) continue;

  const p = path.join(DIR, f);
  const src = fs.readFileSync(p, 'utf8');
  const existing = readRelated(src);
  const missing = [...refs].filter((r) => !existing.includes(r));
  if (missing.length === 0) continue;

  // 已有项优先，缺失项追加；过滤掉指向自身的无效项
  const merged = [...existing, ...missing]
    .filter((s) => s !== self)
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .slice(0, MAX_RELATED);

  // 截断到 MAX_RELATED 后若无实质增益，则跳过（保证幂等、不产生无意义写入）
  const unchanged =
    merged.length === existing.length &&
    merged.every((s, i) => s === existing[i]);
  if (unchanged) continue;

  // 保持与文件一致的换行符，避免混用 LF / CRLF
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  const block =
    `relatedSlugs:${nl}` + merged.map((s) => `  - "${s}"`).join(nl) + nl;

  let next;
  if (RELATED_BLOCK_RE.test(src)) {
    // 已有块：原地替换，绝不新增第二个块
    next = src.replace(RELATED_BLOCK_RE, block);
  } else if (/^draft:/m.test(src)) {
    // 没有块：插到 draft 之前
    next = src.replace(/^draft:/m, `${block}draft:`);
  } else {
    next = src.replace(/\n---\n/, `\n${block}---\n`);
  }

  if (next.match(/^relatedSlugs:/gm)?.length > 1) {
    throw new Error(`${f}: 生成后出现重复 relatedSlugs 块，已中止写入`);
  }

  report.push(`  ${self}: +${missing.length} (${missing.join(', ')})`);
  if (!DRY) fs.writeFileSync(p, next, 'utf8');
  changed++;
}

console.log(DRY ? '[DRY RUN] 反向内链补齐预览' : '反向内链补齐完成');
console.log(report.length ? report.join('\n') : '  无需变更');
console.log(`\n受影响文件: ${changed} / ${files.length}`);
