/**
 * 第三轮批次 6 内链回填：老文 → 4 篇 Seasonal 新文
 *
 * 与批次 1–5 同一套逻辑：每条配对指定「宿主」与「目标」，
 * 脚本在宿主最相关的小节末尾补一句带内链的话。
 * 每个目标配 3 套文案，按配对顺序轮换，避免同一句话重复。
 *
 * 措辞约定：句子以指针收尾（"For X, see {link}."），
 * 这样锚文本永远落在宾语位置，不会被迫充当主语。
 *
 * 约束：每个宿主最多 2 条，每个新文至少 2 条。
 *
 * 用法：
 *   node scripts/relink-round3-batch6.mjs --dry
 *   node scripts/relink-round3-batch6.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'back-to-school-home-reset': {
    variants: [
      {
        anchor: 'the back-to-school home reset',
        sentence:
          'The landing zone is where the school year\u2019s volume actually arrives. For the rest of the week-before setup — entry, laundry, timeline, paperwork — see {link}.',
      },
      {
        anchor: 'the back-to-school home reset',
        sentence:
          'One bin per person is the right starting point. For what else has to change before the first morning, including the paperwork route, see {link}.',
      },
      {
        anchor: 'the back-to-school home reset',
        sentence:
          'Rebuilding routines one at a time works better than a single relaunch. For the version built around the school calendar, see {link}.',
      },
    ],
  },
  'keep-wildfire-smoke-out': {
    variants: [
      {
        anchor: 'how to keep wildfire smoke out of the house',
        sentence:
          'Filtration is the third layer, and it only works if the first two are already in place. For the smoke-specific sequence — sealing, recirculation, one clean room — see {link}.',
      },
      {
        anchor: 'how to keep wildfire smoke out of the house',
        sentence:
          'The HVAC path matters for dust day to day; during a smoke event it becomes the main defence. For how to run it, and which fans to switch off, see {link}.',
      },
      {
        anchor: 'how to keep wildfire smoke out of the house',
        sentence:
          'Securing the openings is the same work a smoke event demands, in a different order. For the smoke version, including the exhaust fans that undo it, see {link}.',
      },
    ],
  },
  'extreme-heat-without-ac': {
    variants: [
      {
        anchor: 'keeping a house safe in extreme heat',
        sentence:
          'Getting more from the AC is the comfortable answer. For the version with no AC at all, and the point at which a fan stops helping, see {link}.',
      },
      {
        anchor: 'keeping a house safe in extreme heat',
        sentence:
          'The one-room heat plan is what carries a household through an outage. For the version with no mechanical cooling, including the signs that mean act now, see {link}.',
      },
      {
        anchor: 'keeping a house safe in extreme heat',
        sentence:
          'The days after a storm are often both the hottest and the most powerless. For the heat-safety side of that, see {link}.',
      },
    ],
  },
  'first-frost-checklist': {
    variants: [
      {
        anchor: 'the first frost checklist',
        sentence:
          'The plumbing steps are the expensive ones on this list. For the 48-hour sequence that covers the garden, the hoses, and the faucets in the right order, see {link}.',
      },
      {
        anchor: 'the first frost checklist',
        sentence:
          'Frost damage gets assessed in spring, not cut back in autumn. For what to do in the 48 hours before it arrives, see {link}.',
      },
      {
        anchor: 'the first frost checklist',
        sentence:
          'Tier 1 of this list is the first freeze. For the night-before sequence, and the hose bib that fails when it is skipped, see {link}.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · 开学季复位
  ['organize-kids-school-papers-artwork', 'back-to-school-home-reset', 'Step 1: Install a landing zone', 0],
  ['create-entryway-drop-zone', 'back-to-school-home-reset', 'Step 3: Give Every Person One Bin', 1],
  ['return-to-routine-after-holidays', 'back-to-school-home-reset', 'Step 5: Rebuild the routines one at a time', 2],

  // 2 · 山火烟
  ['improve-indoor-air-without-gadgets', 'keep-wildfire-smoke-out', 'Layer 3: Filtration', 0],
  ['reduce-dust-in-home', 'keep-wildfire-smoke-out', '3. Fix the HVAC Path', 1],
  ['prepare-home-for-hurricane-season', 'keep-wildfire-smoke-out', 'Step 2: Secure the openings', 2],

  // 3 · 极端高温
  ['keep-house-cool-summer', 'extreme-heat-without-ac', 'Priority 4: Get More From the AC', 0],
  ['prepare-for-power-outage-home', 'extreme-heat-without-ac', 'Step 5: Build the heat plan around one room', 1],
  ['prepare-home-for-hurricane-season', 'extreme-heat-without-ac', 'Step 10: After the storm, in this order', 2],

  // 4 · 初霜清单
  ['winterize-your-home-complete-guide', 'first-frost-checklist', 'Step 3: Protect the plumbing', 0],
  ['get-garden-ready-for-spring', 'first-frost-checklist', 'Step 2: Clean up winter damage', 1],
  ['fall-maintenance-checklist-homeowners', 'first-frost-checklist', 'Tier 1: Before the first freeze', 2],
];

const variantOf = (target, forced) => {
  const list = TARGETS[target].variants;
  return typeof forced === 'number' ? list[forced] : list[0];
};

const CAT_ROUTE = {
  'Fix It': 'fix-it',
  'Save Money': 'save-money',
  'Home Hacks': 'home-hacks',
  'Kitchen Tips': 'kitchen-tips',
  Organize: 'organize',
  'Seasonal & Holiday': 'seasonal',
};
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const read = (slug) => fs.readFileSync(path.join(DIR, `${slug}.md`), 'utf8');
const meta = (src, key) => {
  const m = src.match(new RegExp(`^${key}:\\s*"?(.*?)"?\\s*$`, 'm'));
  return m ? m[1] : '';
};
const pathOf = (slug) => {
  const src = read(slug);
  const cat = CAT_ROUTE[meta(src, 'category')];
  const sub = slugify(meta(src, 'subcategory'));
  if (!cat) throw new Error(`未知栏目：${slug} → ${meta(src, 'category')}`);
  return `/${cat}/${sub}/${slug}/`;
};

// ---- 校验 ----
const allSlugs = new Set(files.map(slugOf));
const hostCount = new Map();
const targetCount = new Map();
for (const [h, t] of PAIRS) {
  if (!allSlugs.has(h)) throw new Error(`宿主不存在：${h}`);
  if (!allSlugs.has(t)) throw new Error(`目标不存在：${t}`);
  if (!TARGETS[t]) throw new Error(`目标缺少文案：${t}`);
  if (h === t) throw new Error(`自链：${h}`);
  hostCount.set(h, (hostCount.get(h) || 0) + 1);
  targetCount.set(t, (targetCount.get(t) || 0) + 1);
}
const overHost = [...hostCount].filter(([, n]) => n > 2);
const thinTarget = Object.keys(TARGETS).filter((t) => (targetCount.get(t) || 0) < 2);
if (overHost.length) throw new Error('宿主超过 2 条：' + overHost.map(([h, n]) => `${h}(${n})`).join(', '));
if (thinTarget.length) throw new Error('目标不足 2 条：' + thinTarget.join(', '));

// ---- 小节选择 ----
const EXCLUDE = /faq|frequently asked|related|what not|sources|bottom line|conclusion/i;

function sections(lines) {
  const heads = [];
  lines.forEach((l, i) => {
    if (/^##\s+/.test(l)) heads.push({ i, title: l.replace(/^##\s+/, '').trim() });
  });
  return heads
    .map((h, k) => ({
      title: h.title,
      start: h.i + 1,
      end: k + 1 < heads.length ? heads[k + 1].i : lines.length,
    }))
    .filter((s) => !EXCLUDE.test(s.title));
}

function pickSection(lines, hint) {
  const secs = sections(lines);
  const re = new RegExp(hint, 'i');
  const hit = secs.find((s) => re.test(s.title));
  if (!hit) throw new Error(`小节提示未命中：${hint}`);
  return hit;
}

// ---- 写入 ----
let changed = 0;
const log = [];
for (const [host, target, hint, forced] of PAIRS) {
  const src = read(host);
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const link = pathOf(target);
  const variant = variantOf(target, forced);
  if (src.includes(`](${link})`)) {
    log.push(`skip  ${host} → ${target}（已有链接）`);
    continue;
  }
  const fmEnd = src.indexOf('---', 3);
  const head = src.slice(0, src.indexOf('\n', fmEnd) + 1);
  const bodyRaw = src.slice(head.length);
  const lines = bodyRaw.split(/\r?\n/);
  const section = pickSection(lines, hint);
  let cut = section.end;
  const trimBlank = () => {
    while (cut > section.start && lines[cut - 1].trim() === '') cut--;
  };
  trimBlank();
  if (cut > section.start && /^-{3,}$/.test(lines[cut - 1].trim())) {
    cut--;
    trimBlank();
  }
  const sentence = variant.sentence.replace('{link}', `[${variant.anchor}](${link})`);
  lines.splice(cut, 0, '', sentence);
  const out = head + lines.join(eol);
  log.push(`${host} → ${target}  @ 「${section.title}」`);
  if (!DRY) fs.writeFileSync(path.join(DIR, `${host}.md`), out);
  changed++;
}

console.log(log.join('\n'));
console.log(`\n${DRY ? '[dry] 计划' : '已写入'} ${changed} 条`);
