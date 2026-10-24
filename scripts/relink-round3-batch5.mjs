/**
 * 第三轮批次 5 内链回填：老文 → 5 篇 Organize 新文
 *
 * 与批次 1–4 同一套逻辑：每条配对指定「宿主」与「目标」，
 * 脚本在宿主最相关的小节末尾补一句带内链的话。
 * 每个目标配 3 套文案，按配对顺序轮换，避免同一句话重复。
 *
 * 措辞约定：句子以指针收尾（"For X, see {link}."），
 * 这样锚文本永远落在宾语位置，不会被迫充当主语。
 *
 * 约束：每个宿主最多 2 条，每个新文至少 2 条。
 *
 * 用法：
 *   node scripts/relink-round3-batch5.mjs --dry
 *   node scripts/relink-round3-batch5.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'organize-thousands-of-photos': {
    variants: [
      {
        anchor: 'the method for a 20,000-photo library',
        sentence:
          'Going digital solves the filing problem and creates a deletion problem one layer down. For the phone library version, including the four screens that remove a third of it in an evening, see {link}.',
      },
      {
        anchor: 'the method for a 20,000-photo library',
        sentence:
          'An inventory is a record of what you own, and the largest unrecorded collection in most houses is on a phone. For that library, and the categories worth deleting wholesale, see {link}.',
      },
      {
        anchor: 'the method for a 20,000-photo library',
        sentence:
          'Reversibility matters most when there are twenty thousand decisions to make. For the approach that scales past one-at-a-time judgment, see {link}.',
      },
    ],
  },
  'chore-system-that-survives': {
    variants: [
      {
        anchor: 'the chore system that survives month two',
        sentence:
          'Surfaces reset themselves in ten minutes; the split of who owns which area does not. For that part — and why it feels unfair by month two — see {link}.',
      },
      {
        anchor: 'the chore system that survives month two',
        sentence:
          'A maintenance rhythm works until it depends on one person remembering everything. For the version that assigns areas and rotates the coordination, see {link}.',
      },
      {
        anchor: 'the chore system that survives month two',
        sentence:
          'Tidy-up at speed is the child\u2019s half of the job. For the household half — areas, written standards, and the weekly block — see {link}.',
      },
    ],
  },
  'pack-and-unpack-a-move': {
    variants: [
      {
        anchor: 'how to pack and unpack a move',
        sentence:
          'Packing well is also the cheapest way to move, because it uses fewer boxes and less paid labour. For the labelling and sequencing system that saves both, see {link}.',
      },
      {
        anchor: 'how to pack and unpack a move',
        sentence:
          'Removing things before the move is the highest-value work there is. For what to do with what is left, so the new house is navigable in week one, see {link}.',
      },
      {
        anchor: 'how to pack and unpack a move',
        sentence:
          'Shrinking the items is half the job; knowing where they went is the other half. For the numbering and tier system, see {link}.',
      },
    ],
  },
  'basement-storage-without-ruining': {
    variants: [
      {
        anchor: 'how to store things in a basement',
        sentence:
          'A garage and a basement fail in the same way — water, gravity, and nothing kept off the floor. For the rules specific to a below-grade room, including the humidity number that matters, see {link}.',
      },
      {
        anchor: 'how to store things in a basement',
        sentence:
          'Decorations spend eleven months a year in whatever space the house has left over. For the storage conditions that decide whether they survive it, see {link}.',
      },
      {
        anchor: 'how to store things in a basement',
        sentence:
          'Choosing the container is only half of it; shelf height and room humidity decide the rest. For below-grade storage specifically, see {link}.',
      },
    ],
  },
  'home-records-retention': {
    variants: [
      {
        anchor: 'which home records to keep',
        sentence:
          'The retention schedule is what decides which of these folders ever leaves the house. For the table itself — how long each record type actually has to stay — see {link}.',
      },
      {
        anchor: 'which home records to keep',
        sentence:
          'Not throwing anything away is the right instinct for the first week. For how long each document is genuinely worth keeping, see {link}.',
      },
      {
        anchor: 'which home records to keep',
        sentence:
          'The one-year test sorts the artwork. For the paperwork you are obliged to keep, and for how long, see {link}.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · 手机照片
  ['organize-paperwork-at-home', 'organize-thousands-of-photos', 'Step 4: Go digital on purpose', 0],
  ['organize-cords-cables', 'organize-thousands-of-photos', 'Step 8: Keep a Simple Inventory', 1],
  ['declutter-without-regret', 'organize-thousands-of-photos', 'Step 5: Make Every Decision Reversible', 2],

  // 2 · 家务分工
  ['ten-minute-daily-reset', 'chore-system-that-survives', 'Step 7: Run a Weekly', 0],
  ['maintain-organized-home-long-term', 'chore-system-that-survives', 'Step 4: Build a Three-Tier', 1],
  ['organize-kids-toys', 'chore-system-that-survives', 'Step 7: Make the Tidy-Up Fast', 2],

  // 3 · 搬家打包
  ['save-money-when-moving-house', 'pack-and-unpack-a-move', '7. Pack in a Way That Saves Money', 0],
  ['declutter-without-regret', 'pack-and-unpack-a-move', 'Step 7: Remove Everything the Same Day', 1],
  ['small-space-storage-ideas', 'pack-and-unpack-a-move', 'Step 5: Shrink the Items', 2],

  // 4 · 地下室储物
  ['organize-garage-one-weekend', 'basement-storage-without-ruining', 'Day 2: Build the Storage', 0],
  ['store-holiday-decorations', 'basement-storage-without-ruining', 'Step 8: Avoid the classic storage', 1],
  ['store-off-season-clothes', 'basement-storage-without-ruining', 'Step 4: Match the storage location', 2],

  // 5 · 家庭记录保留期限
  ['organize-paperwork-at-home', 'home-records-retention', 'Step 2: Apply the retention schedule', 0],
  ['file-home-insurance-claim', 'home-records-retention', 'Step 5: Do Not Throw Anything Away', 1],
  ['organize-kids-school-papers-artwork', 'home-records-retention', 'Step 2: Apply the one-year test', 2],
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
