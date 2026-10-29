/**
 * 第四轮批次 1 内链回填：老文 → 8 篇 Pest Control 新文
 *
 * 逻辑沿用批次 1–6：每条配对指定「宿主」与「目标」，脚本在宿主指定小节末尾
 * 补一句带内链的话。每个目标配 3 套文案，按配对顺序轮换，避免同一句重复。
 *
 * 措辞约定：句子以指针收尾（"For X, see {link}."），锚文本永远落在宾语位置。
 *
 * 约束：每个宿主最多 2 条，每个新文恰好 3 条（共 15 宿主 / 24 条）。
 *
 * 用法：
 *   node scripts/relink-round4-batch1.mjs --dry
 *   node scripts/relink-round4-batch1.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/articles';
const DRY = process.argv.includes('--dry');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const slugOf = (f) => path.basename(f, '.md');

const TARGETS = {
  'fruit-flies-keep-coming-back': {
    variants: [
      {
        anchor: 'why fruit flies keep coming back',
        sentence:
          'Removing the attractant is the step most kitchens stop at. For the version built around the breeding site — and the trap that tells you when it is gone — see {link}.',
      },
      {
        anchor: 'how to break the fruit fly cycle',
        sentence:
          'Washing also removes the eggs that arrive on the skin. For what happens when they stay, and the ten-day cycle that follows, see {link}.',
      },
      {
        anchor: 'the fruit fly breeding cycle',
        sentence:
          'Placement decides how fast things ripen. For the insect that ripening attracts, and how to end its cycle, see {link}.',
      },
    ],
  },
  'get-rid-of-ants-in-the-kitchen': {
    variants: [
      {
        anchor: 'how to deal with ants in the kitchen',
        sentence:
          'Ants are the case where general advice fails most often. For the bait concentration and the species matching that decide it, see {link}.',
      },
      {
        anchor: 'the ant bait method',
        sentence:
          'A pantry that is faced and sealed is most of the prevention. For the treatment side, including why making the bait stronger fails, see {link}.',
      },
      {
        anchor: 'why spraying ants makes it worse',
        sentence:
          'Some of the marks along a baseboard are traffic rather than dirt. For the trail that causes them — and why cleaning it too early ruins the treatment — see {link}.',
      },
    ],
  },
  'silverfish-what-they-eat': {
    variants: [
      {
        anchor: 'whether silverfish actually matter',
        sentence:
          'The humid rooms on this list are also the rooms silverfish occupy. For what the insect is telling you, and when it is not worth acting on, see {link}.',
      },
      {
        anchor: 'what silverfish eat',
        sentence:
          'Cardboard is both shelter and food for several species. For the one that eats the paper itself, and the humidity rule behind it, see {link}.',
      },
      {
        anchor: 'the silverfish humidity threshold',
        sentence:
          'The baseboard line is where a lot of the evidence collects. For the insect that leaves it, and the reading that decides whether it breeds, see {link}.',
      },
    ],
  },
  'pantry-moths-vs-fruit-flies': {
    variants: [
      {
        anchor: 'how to tell pantry moths from fruit flies',
        sentence:
          'Moths and flies are confused in kitchens more often than the biology justifies. For the ten-second version of this identification, see {link}.',
      },
      {
        anchor: 'the pantry moth clear-out',
        sentence:
          'Where a bag is stored decides how long it lasts. For the insect that shortens that, and the full cupboard clear-out it requires, see {link}.',
      },
      {
        anchor: 'what to throw out after pantry moths',
        sentence:
          'Decanting is also the moment to inspect. For the sorting rules when the cupboard is already infested, see {link}.',
      },
    ],
  },
  'spiders-in-the-basement': {
    variants: [
      {
        anchor: 'whether basement spiders are worth killing',
        sentence:
          'Dry air fixes more than mould. For the predator that lives on what humidity supports, and the two species that change the answer, see {link}.',
      },
      {
        anchor: 'the case for leaving basement spiders alone',
        sentence:
          'Some storage decisions are about animals rather than damage. For the spider question specifically, and how to tell it from something that is not a spider, see {link}.',
      },
      {
        anchor: 'spiders versus the insects they eat',
        sentence:
          'Entry points are worth finding before deciding what to do about anything that uses them. For the predator question — and why removing it raises the insect count — see {link}.',
      },
    ],
  },
  'mice-in-the-walls': {
    variants: [
      {
        anchor: 'how to confirm mice are in the walls',
        sentence:
          'An entry point proves it got in; it does not prove it is still there. For the powder test and the trace reading that settle it, see {link}.',
      },
      {
        anchor: 'reading the signs of mice in walls',
        sentence:
          'Air sealing is the same work done with a different motive. For the diagnostics that tell you whether you have a rodent at all, see {link}.',
      },
      {
        anchor: 'the mouse-in-the-wall checklist',
        sentence:
          'Rodent pressure peaks with the first cold nights. For how to tell whether the scratching is a mouse, a duct, or a bird, see {link}.',
      },
    ],
  },
  'mouse-proof-before-winter': {
    variants: [
      {
        anchor: 'the gap-by-gap mouse-proofing route',
        sentence:
          'The exterior list here and the mouse list overlap more than they differ. For the version that walks the house in order, see {link}.',
      },
      {
        anchor: 'how to mouse-proof a house before winter',
        sentence:
          'A door gap is a heat loss and an entry route at the same time. For the full perimeter walk — sill plate, vents, dryer hood, garage — see {link}.',
      },
      {
        anchor: 'sealing a house against mice',
        sentence:
          'Roof-line work is for squirrels; floor-level work is for mice. For the 1/4-inch rule and the materials that stop teeth, see {link}.',
      },
    ],
  },
  'rats-vs-mice-droppings': {
    variants: [
      {
        anchor: 'how to tell rat droppings from mouse droppings',
        sentence:
          'The gap size you seal depends on the species. For the measurement that decides it, see {link}.',
      },
      {
        anchor: 'reading rodent droppings',
        sentence:
          'Finding a leak is the same walk looking at a different thing. For the droppings that tell you what is using the gap, see {link}.',
      },
      {
        anchor: 'rat or mouse, decided by the droppings',
        sentence:
          'Outdoor food sources decide how much pressure the house faces. For the species question — and the bat confusion that changes everything — see {link}.',
      },
    ],
  },
};

const PAIRS = [
  // 1 · 果蝇
  ['save-money-on-pest-control-diy', 'fruit-flies-keep-coming-back', 'Step 4: Remove What Is Attracting Them', 0],
  ['wash-fruit-vegetables-properly', 'fruit-flies-keep-coming-back', 'Step 1: Know what washing is actually for', 1],
  ['store-bananas-avocados-tomatoes', 'fruit-flies-keep-coming-back', 'Step 6: Place them deliberately', 2],

  // 2 · 厨房蚂蚁
  ['keep-bugs-out-of-house-summer', 'get-rid-of-ants-in-the-kitchen', 'Step 6: Handle the pest-specific cases', 0],
  ['organize-pantry-beginner-guide', 'get-rid-of-ants-in-the-kitchen', 'Step 5: Face, stack, and label', 1],
  ['clean-baseboards-quickly', 'get-rid-of-ants-in-the-kitchen', 'Step 6: Deal With the Black Stripes', 2],

  // 3 · 衣鱼
  ['find-moisture-problems-early', 'silverfish-what-they-eat', 'Step 2: The Three High-Risk Locations', 0],
  ['basement-storage-without-ruining', 'silverfish-what-they-eat', 'Step 7: Pest-proof without poison', 1],
  ['clean-baseboards-quickly', 'silverfish-what-they-eat', 'Step 7: Keep Them Cleaner Between Deep Cleans', 2],

  // 4 · 米蛾
  ['store-flour-pest-free', 'pantry-moths-vs-fruit-flies', 'Step 1: Identify which pest you actually have', 0],
  ['store-nuts-seeds-and-flours', 'pantry-moths-vs-fruit-flies', 'Step 2: Pick the shelf, fridge, or freezer', 1],
  ['organize-pantry-beginner-guide', 'pantry-moths-vs-fruit-flies', 'Step 4: Decant only what is worth decanting', 2],

  // 5 · 蜘蛛
  ['find-moisture-problems-early', 'spiders-in-the-basement', 'Step 7: Fix the Source, Then Control the Humidity', 0],
  ['basement-storage-without-ruining', 'spiders-in-the-basement', 'What Never Goes in a Basement', 1],
  ['keep-bugs-out-of-house-summer', 'spiders-in-the-basement', 'Step 1: Find the entry points with a flashlight', 2],

  // 6 · 墙内老鼠
  ['save-money-on-pest-control-diy', 'mice-in-the-walls', 'Step 2: Find Where They Are Getting In', 0],
  ['winterize-your-home-complete-guide', 'mice-in-the-walls', 'Step 1: Start with air sealing', 1],
  ['fall-maintenance-checklist-homeowners', 'mice-in-the-walls', 'Tier 2: Before the first hard freeze', 2],

  // 7 · 入冬封堵
  ['fall-maintenance-checklist-homeowners', 'mouse-proof-before-winter', 'Tier 1: Before the first freeze', 0],
  ['cheap-window-insulation', 'mouse-proof-before-winter', 'Step 2: Seal the Door Gaps', 1],
  ['prepare-home-for-winter-storm', 'mouse-proof-before-winter', 'Step 2: Get the roof edge right', 2],

  // 8 · 粪便判读
  ['winterize-your-home-complete-guide', 'rats-vs-mice-droppings', 'Step 5: Windows and doors', 0],
  ['cheap-window-insulation', 'rats-vs-mice-droppings', 'Step 1: Find the Leaks', 1],
  ['prepare-home-for-fall', 'rats-vs-mice-droppings', 'Step 5: Prepare the yard and the exterior', 2],
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
  'Pest Control': 'pest-control',
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
  const insertAt = cut;
  const sentence = variant.sentence.replace('{link}', `[${variant.anchor}](${link})`);
  lines.splice(insertAt, 0, '', sentence);
  const out = head + lines.join(eol);
  log.push(`ok    ${host} → ${target}  @ 「${section.title}」`);
  if (!DRY) fs.writeFileSync(path.join(DIR, `${host}.md`), out, 'utf8');
  changed++;
}

console.log(log.join('\n'));
console.log(`\n${DRY ? '[dry] ' : ''}共 ${changed} 条，${hostCount.size} 个宿主，${Object.keys(TARGETS).length} 个目标`);
