import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');
const strip = (s) => {
  const m = s.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1] : s;
};

const inGraph = new Map();
for (const f of files) inGraph.set(slugOf(f), new Set());

for (const f of files) {
  const from = slugOf(f);
  for (const line of strip(fs.readFileSync(path.join(DIR, f), 'utf8')).split(/\r?\n/)) {
    for (const m of line.matchAll(/\]\((\/[a-z0-9-]+\/[a-z0-9-]+\/([a-z0-9-]+)\/)/g)) {
      const to = m[2];
      if (to === from || !inGraph.has(to)) continue;
      inGraph.get(to).add(from);
    }
  }
}

const p = 'scripts/inbound-baseline.json';
const b = JSON.parse(fs.readFileSync(p, 'utf8'));
const before = Object.keys(b).length;
const keep = {};
const removed = [];
for (const k of Object.keys(b)) {
  if ((inGraph.get(k)?.size ?? 0) >= 2) removed.push(k);
  else keep[k] = b[k];
}
fs.writeFileSync(p, JSON.stringify(keep, null, 2) + '\n');
console.log(`白名单 ${before} → ${Object.keys(keep).length}，移除 ${removed.length} 篇：${removed.join(', ')}`);
