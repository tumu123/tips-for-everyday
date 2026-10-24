/**
 * 第三轮批次 4 内链回填：老文 → 8 篇 Kitchen Tips 新文
 *
 * 与批次 1–3 同一套逻辑：每条配对指定「宿主」与「目标」，
 * 脚本在宿主最相关的小节末尾补一句带内链的话。
 * 每个目标配 2–3 套文案轮换，避免同一句话在多篇里重复。
 *
 * 措辞约定：句子以指针收尾（"For X, see {link}."），
 * 这样锚文本永远落在宾语位置，不会被迫充当主语。
 *
 * 约束：每个宿主最多 2 条，每个新文至少 2 条。
 *
 * 用法：
 *   node scripts/relink-round3-batch4.mjs --dry
 *   node scripts/relink-round3-batch4.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'what-an-air-fryer-actually-does': {
    variants: [
      {
        anchor: 'what an air fryer actually does',
        sentence:
          'A hood filter catches what cooking throws off. For the appliance that produces a surprising share of it — and the reason its element is what eventually smokes — see {link}.',
      },
      {
        anchor: 'what an air fryer actually does',
        sentence:
          'An oven and an air fryer fail the same way for the same reason: grease on the element, and a cavity that nobody cleans often enough. See {link} for the appliance side of it.',
      },
      {
        anchor: 'what an air fryer actually does',
        sentence:
          'Grease on a cabinet door arrived through the air, and it came off something. For the appliance that concentrates the problem within inches of the food, see {link}.',
      },
    ],
  },
  'slow-cooker-vs-instant-pot': {
    variants: [
      {
        anchor: 'slow cooker vs Instant Pot',
        sentence:
          'Cooking in parallel is the whole trick. For which machine suits a morning start and which suits a decision made at 6 p.m., see {link}.',
      },
      {
        anchor: 'slow cooker vs Instant Pot',
        sentence:
          'A freezer full of portions starts with a pot that can turn cheap cuts into something worth freezing. For that choice — including the size most households get wrong — see {link}.',
      },
    ],
  },
  'safe-cooking-temperatures': {
    variants: [
      {
        anchor: 'safe cooking temperatures',
        sentence:
          'Thawing is the step before any of that, and it has its own rules. For the numbers themselves — including why the thickest part is the only place to measure — see {link}.',
      },
      {
        anchor: 'safe cooking temperatures',
        sentence:
          'Inspection tells you about spoilage, not safety. For the temperatures that decide whether the food was safe in the first place, see {link}.',
      },
      {
        anchor: 'safe cooking temperatures',
        sentence:
          'Rice has a storage rule and a cooking rule, and only one of them is about time. For the temperature side, including why 165°F is the number for reheating, see {link}.',
      },
    ],
  },
  'temperature-danger-zone': {
    variants: [
      {
        anchor: 'the temperature danger zone',
        sentence:
          'The outside thaws first and then waits. For the two-hour and four-hour thresholds, and the cooling timings that decide whether a large batch is safe, see {link}.',
      },
      {
        anchor: 'the temperature danger zone',
        sentence:
          'Dating your own food is only half the record. For what the clock is actually measuring — and why four hours is the point of no return — see {link}.',
      },
      {
        anchor: 'the temperature danger zone',
        sentence:
          'A deadline written on a container is only useful if the temperature behind it is right. For the 40°F to 140°F band and the cooling method that gets food through it fast, see {link}.',
      },
    ],
  },
  'cookware-material-guide': {
    variants: [
      {
        anchor: 'the cookware material guide',
        sentence:
          'The pan rewards use and punishes neglect in specific ways, but the choice comes before the care routine. For which material suits which job, and why cast iron holds a sear, see {link}.',
      },
      {
        anchor: 'the cookware material guide',
        sentence:
          'A sharp knife and the right pan are the same kind of decision. For the pans, and the conductivity numbers that explain why copper responds and steel does not, see {link}.',
      },
      {
        anchor: 'the cookware material guide',
        sentence:
          'Deciding when a board is finished is the same calculation as deciding when a pan is. For how long each material lasts, and which ones cannot take high heat, see {link}.',
      },
    ],
  },
  'why-baking-failed': {
    variants: [
      {
        anchor: 'why your baking failed',
        sentence:
          'Flour that has sat for years behaves differently in a cake as well as in a jar. For the measurement problem first, and the failures that follow from it, see {link}.',
      },
      {
        anchor: 'why your baking failed',
        sentence:
          'Reviving is the rescue; prevention is the other half. For the diagnosis chart — gummy, dense, collapsed — and which of those heat cannot fix, see {link}.',
      },
      {
        anchor: 'why your baking failed',
        sentence:
          'Butter temperature is one of the variables that decides whether a bake works at all. For what each failure looks like, and which variable to change first, see {link}.',
      },
    ],
  },
  'meal-prep-a-week': {
    variants: [
      {
        anchor: 'how to meal prep for the week',
        sentence:
          'Changing the carrier is the same principle a component system runs on. For the week-sized version, where the sauces do most of the work, see {link}.',
      },
      {
        anchor: 'how to meal prep for the week',
        sentence:
          'Buying in season lowers the cost of everything you cook in bulk. For turning those components into five different dinners instead of five identical ones, see {link}.',
      },
    ],
  },
  'kitchen-gadgets-worth-the-space': {
    variants: [
      {
        anchor: 'which kitchen gadgets earn their space',
        sentence:
          'Frequency is the right criterion for storage, and it is the right criterion for buying. For the minutes of washing per use that usually decide the answer, see {link}.',
      },
      {
        anchor: 'which kitchen gadgets earn their space',
        sentence:
          'A coffee maker earns its space only if it is maintained. For the wider test, including whether a second appliance is worth the square foot it takes, see {link}.',
      },
      {
        anchor: 'which kitchen gadgets earn their space',
        sentence:
          'A board is the cheapest tool in the kitchen and the one used most. For the rest of the drawer, including the gadgets that fail the twenty-use test, see {link}.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · air fryer
  ['clean-range-hood-filters', 'what-an-air-fryer-actually-does', 'Preventing Clogged Filters', 0],
  ['clean-oven-without-self-clean', 'what-an-air-fryer-actually-does', 'Why This Works', 1],
  ['grease-stains-kitchen-cabinets', 'what-an-air-fryer-actually-does', 'Preventing Grease Buildup', 2],

  // 2 · slow cooker vs pressure cooker
  ['batch-cooking-save-money-time', 'slow-cooker-vs-instant-pot', 'Step 4: Cook in Parallel', 0],
  ['eat-well-on-small-budget', 'slow-cooker-vs-instant-pot', 'Step 5: Use the Freezer Properly', 1],

  // 3 · safe cooking temperatures
  ['thaw-food-safely', 'safe-cooking-temperatures', 'Step 5: Skip thawing entirely', 0],
  ['how-to-tell-if-food-is-bad', 'safe-cooking-temperatures', 'Step 3: Know the foods where inspection', 1],
  ['cook-rice-so-it-turns-out-right', 'safe-cooking-temperatures', 'Step 8: Cool and store it fast', 2],

  // 4 · danger zone
  ['thaw-food-safely', 'temperature-danger-zone', 'Step 1: Understand why the outside thaws first', 0],
  ['how-long-food-lasts-shelf-life-guide', 'temperature-danger-zone', 'Step 5: How to date your own food', 1],
  ['organize-fridge-less-food-waste', 'temperature-danger-zone', 'Step 5: Give leftovers a visible home', 2],

  // 5 · cookware materials
  ['clean-cast-iron-skillet', 'cookware-material-guide', 'Step 8: Cook on it', 0],
  ['sharpen-kitchen-knives', 'cookware-material-guide', 'Step 6: Keep the edge', 1],
  ['clean-cutting-board', 'cookware-material-guide', 'Step 6: Know when to replace', 2],

  // 6 · baking diagnosis
  ['store-flour-pest-free', 'why-baking-failed', 'Step 6: Rotate stock', 0],
  ['revive-stale-bread-chips-crackers', 'why-baking-failed', 'Step 5: Know when reviving stops working', 1],
  ['store-butter-and-margarine', 'why-baking-failed', 'Step 7: Tell rancidity apart', 2],

  // 7 · meal prep
  ['get-more-out-of-grocery-leftovers', 'meal-prep-a-week', 'Step 2: Change the carrier', 0],
  ['save-money-on-groceries', 'meal-prep-a-week', 'Buy Produce in Season', 1],

  // 8 · gadgets
  ['organize-small-kitchen', 'kitchen-gadgets-worth-the-space', 'Step 6: Assign Locations by Frequency', 0],
  ['clean-coffee-maker-tastes-bad', 'kitchen-gadgets-worth-the-space', 'Step 6: Fix the habits that cause it', 1],
  ['clean-cutting-board', 'kitchen-gadgets-worth-the-space', 'Step 2: Sanitize after raw meat', 2],
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
for (const [t, def] of Object.entries(TARGETS)) {
  if (def.variants.length < (targetCount.get(t) || 0)) {
    throw new Error(`${t} 需要 ${targetCount.get(t)} 套文案，实际只有 ${def.variants.length} 套`);
  }
}

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
