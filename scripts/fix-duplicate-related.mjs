/**
 * 修复脚本：合并 frontmatter 中重复的 relatedSlugs 块
 *
 * 背景：backlinks.mjs 早期版本的正则要求 `"..."` 后紧跟 `\n`，
 * 在 CRLF 换行的文件上匹配失败，误判为「无 relatedSlugs 块」而重复插入，
 * 导致同一文件出现两个 relatedSlugs 键，YAML 解析报 "duplicated mapping key"。
 *
 * 本脚本兼容 LF / CRLF，把多个块合并为一个去重后的块。
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const MAX = 5;
// 兼容 CRLF：行尾允许 \r?\n
const BLOCK_RE = /^relatedSlugs:\r?\n((?:\s+-\s+"[^"]+"\r?\n)*)/gm;

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
let fixed = 0;

for (const f of files) {
  const p = path.join(DIR, f);
  const src = fs.readFileSync(p, 'utf8');
  const blocks = [...src.matchAll(BLOCK_RE)];

  if (blocks.length <= 1) continue;

  // 收集所有块中的条目，去重并保持顺序
  const items = [];
  for (const b of blocks) {
    for (const m of b[1].matchAll(/-\s+"([^"]+)"/g)) {
      const s = m[1];
      if (!items.includes(s)) items.push(s);
    }
  }

  const merged = items.slice(0, MAX);
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  const block =
    `relatedSlugs:${nl}` + merged.map((s) => `  - "${s}"`).join(nl) + nl;

  // 第一个块替换为合并结果，其余删除
  let next = src;
  let first = true;
  next = next.replace(BLOCK_RE, () => {
    if (first) {
      first = false;
      return block;
    }
    return '';
  });

  fs.writeFileSync(p, next, 'utf8');
  console.log(`  修复 ${path.basename(f, '.md')}: ${merged.length} 项`);
  fixed++;
}

console.log(fixed ? `\n已修复 ${fixed} 个文件` : '未发现重复块');
