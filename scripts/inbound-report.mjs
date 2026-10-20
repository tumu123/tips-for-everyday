/**
 * 入链体检：统计每篇文章「被其他文章正文引用」的次数，并区分引用者是否属于目标批次（新文）。
 *
 * 用法：
 *   node scripts/inbound-report.mjs                    # 全站概览（按入链数升序）
 *   node scripts/inbound-report.mjs --targets=a.txt    # 只看 a.txt 里列的 slug（每行一个）
 *   node scripts/inbound-report.mjs --show=slug        # 列出某篇的入链来源与所在小节
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');
const body = (src) => {
  const m = src.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1] : src;
};

const args = process.argv.slice(2);
const targetsArg = args.find((a) => a.startsWith('--targets='));
const showArg = args.find((a) => a.startsWith('--show='));

const targets = targetsArg
  ? fs
      .readFileSync(targetsArg.split('=')[1], 'utf8')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

/** inbound[slug] = [{ from, heading }] */
const inbound = new Map();
for (const f of files) inbound.set(slugOf(f), []);

for (const f of files) {
  const from = slugOf(f);
  const lines = body(fs.readFileSync(path.join(DIR, f), 'utf8')).split(/\r?\n/);
  let heading = '(top)';
  for (const line of lines) {
    if (/^#{2,3}\s/.test(line)) heading = line.replace(/^#+\s*/, '').trim();
    const re = /\]\((\/[a-z0-9-]+\/[a-z0-9-]+\/([a-z0-9-]+)\/)/g;
    for (const m of line.matchAll(re)) {
      const to = m[2];
      if (to === from || !inbound.has(to)) continue;
      const arr = inbound.get(to);
      if (!arr.some((x) => x.from === from && x.heading === heading)) arr.push({ from, heading });
    }
  }
}

if (showArg) {
  const s = showArg.split('=')[1];
  console.log(`== ${s} 入链 ${inbound.get(s).length} 条 ==`);
  for (const r of inbound.get(s)) console.log(`  ${r.from}   ← ${r.heading}`);
  process.exit(0);
}

const list = targets ?? [...inbound.keys()];
const rows = list.map((s) => {
  const all = inbound.get(s) || [];
  const fromTarget = targets ? all.filter((r) => targets.includes(r.from)) : [];
  return {
    slug: s,
    total: all.length,
    fromNew: fromTarget.length,
    fromOld: all.length - fromTarget.length,
  };
});

if (targets) {
  rows.sort((a, b) => a.fromOld - b.fromOld || a.total - b.total);
  const zero = rows.filter((r) => r.total === 0);
  const onlySelf = rows.filter((r) => r.total > 0 && r.fromOld === 0);
  console.log(`目标 ${targets.length} 篇`);
  console.log(`老文→新文 入链合计 ${rows.reduce((n, r) => n + r.fromOld, 0)} 条`);
  console.log(`完全零入链 ${zero.length} 篇，只有同批新文互链 ${onlySelf.length} 篇\n`);
  for (const r of rows) {
    console.log(String(r.fromOld).padStart(2), String(r.total).padStart(3), r.slug);
  }
  process.exit(0);
}

rows.sort((a, b) => a.total - b.total);
console.log(`共 ${rows.length} 篇，正文入链 0 条的 ${rows.filter((r) => r.total === 0).length} 篇\n`);
for (const r of rows.slice(0, 30)) console.log(String(r.total).padStart(3), r.slug);
