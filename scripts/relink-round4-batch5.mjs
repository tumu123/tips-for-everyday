/**
 * 第四轮批次 5 回链：为两篇新增的 Organize/Kitchen 文章补入链。
 *
 * 规则：宿主 ≤2 条 / 目标 ≥2 条（预检 18 硬门禁）。
 *   clear-kitchen-counters  ← organize-pots-pans-lids（文内已有）
 *                           ← kitchen-gadgets-worth-the-space
 *   organize-pots-pans-lids ← clear-kitchen-counters（文内已有）
 *                           ← organize-small-kitchen
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';

const edits = [
  {
    file: 'organize-small-kitchen.md',
    old: '2. **Heavy items low.** Pots, canned goods, bulk containers — anything heavy should not be lifted from above shoulder height.',
    add: ' The cookware cabinet has its own layout problem — for that, see [how to organize pots and pans and their lids](/organize/kitchen/organize-pots-pans-lids/).',
  },
  {
    file: 'kitchen-gadgets-worth-the-space.md',
    old: 'The appliance that lives on the counter and is used monthly is the worst outcome of all — it takes the space and provides none of the convenience.',
    add: ' For the surface rules that keep the counter usable once the gadgets are decided, see [how to clear kitchen counters and keep them clear](/organize/kitchen/clear-kitchen-counters/).',
  },
];

let ok = 0;
for (const e of edits) {
  const p = path.join(DIR, e.file);
  const t = fs.readFileSync(p, 'utf8');
  const n = t.split(e.old).length - 1;
  if (n !== 1) {
    console.error(`✗ ${e.file}: 锚点出现 ${n} 次（应为 1），跳过`);
    continue;
  }
  fs.writeFileSync(p, t.replace(e.old, e.old + e.add), 'utf8');
  console.log(`✓ ${e.file} +1`);
  ok++;
}
console.log(`\n完成 ${ok}/${edits.length} 条`);
