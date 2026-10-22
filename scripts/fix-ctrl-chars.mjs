/**
 * 修复正文里的「被截断的 U+20xx 标点」。
 *
 * 症状：破折号、弯引号在页面上渲染成豆腐块（□）。
 * 原因：写入时字符的高字节丢失，U+2014「—」变成 U+0014（DC4 控制字符）。
 * 这一族字符的共同点是高位为 0x20，截断后落在 C0 控制字符区。
 *
 * 实测范围：第二轮批次 6 的 10 篇 Seasonal 文章，共 157 处。
 * 除 U+0013 / U+0014 外其余映射一并保留，遇到再修，不会误伤正常字符。
 *
 * 用法：
 *   node scripts/fix-ctrl-chars.mjs --dry   只看不写
 *   node scripts/fix-ctrl-chars.mjs         写入
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');

const MAP = {
  '\u0011': '\u2011', // ‑ non-breaking hyphen
  '\u0012': '\u2012', // ‒ figure dash
  '\u0013': '\u2013', // – en dash
  '\u0014': '\u2014', // — em dash
  '\u0015': '\u2015', // ― horizontal bar
  '\u0018': '\u2018', // ‘
  '\u0019': '\u2019', // ’
  '\u001A': '\u201A', // ‚
  '\u001B': '\u201B', // ‛
  '\u001C': '\u201C', // “
  '\u001D': '\u201D', // ”
  '\u001E': '\u201E', // „
  '\u001F': '\u201F', // ‟
};

// 只用 MAP 里出现过的字符，避免把正常的 \t \n 也算进去
const PATTERN = new RegExp(`[${Object.keys(MAP).join('')}]`, 'g');

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
let touched = 0;
let replaced = 0;
const detail = [];

for (const f of files) {
  const p = path.join(DIR, f);
  const src = fs.readFileSync(p, 'utf8');
  const hits = src.match(PATTERN);
  if (!hits) continue;

  const out = src.replace(PATTERN, (ch) => MAP[ch]);
  touched++;
  replaced += hits.length;

  const counts = {};
  for (const ch of hits) counts[MAP[ch]] = (counts[MAP[ch]] || 0) + 1;
  detail.push(
    `${f}  ${hits.length} 处  ${Object.entries(counts)
      .map(([c, n]) => `${c}×${n}`)
      .join(' ')}`
  );

  if (!DRY) fs.writeFileSync(p, out, 'utf8');
}

console.log(detail.join('\n'));
console.log(`\n${DRY ? '[dry-run] ' : ''}受影响文件 ${touched} 个，替换 ${replaced} 处`);

// 复查：写完后目录里不应再有 C0 控制字符（\t \n \r 除外）
if (!DRY) {
  const leftover = new RegExp(`[${Object.keys(MAP).join('')}]`);
  const bad = files.filter((f) => leftover.test(fs.readFileSync(path.join(DIR, f), 'utf8')));
  console.log(bad.length === 0 ? '复查：目录内已无截断标点 ✓' : `复查：仍有残留 ${bad.join(', ')} ✗`);
}
